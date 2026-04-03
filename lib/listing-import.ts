import type { ListingImportResult } from "./listing-import-types";

const FETCH_TIMEOUT_MS = 25_000;

/** Fragments de host autorisés par défaut (sous-chaîne du hostname). */
const DEFAULT_HOST_FRAGMENTS = [
  "airbnb.",
  "booking.com",
  "vrbo.com",
  "abritel.",
  "homeaway.",
  "tripadvisor.",
  "expedia.",
  "hotels.com",
] as const;

function parseExtraFragments(): string[] {
  const raw = process.env.LISTING_IMPORT_EXTRA_HOST_FRAGMENTS?.trim();
  if (!raw) return [];
  return raw
    .split(/[,;|\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function allowAnyPublicUrl(): boolean {
  return process.env.LISTING_IMPORT_ALLOW_ANY_PUBLIC_URL === "1" || process.env.LISTING_IMPORT_ALLOW_ANY_PUBLIC_URL === "true";
}

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
}

/**
 * Garde-fou SSRF : autoriser seulement des cibles HTTP(S) « typiquement publiques ».
 * Exportée pour les tests.
 */
export function isSafePublicFetchHostname(hostname: string): boolean {
  const host = normalizeHost(hostname);
  if (!host || host === "localhost" || host.endsWith(".localhost")) return false;
  if (host === "0.0.0.0") return false;

  if (host.endsWith(".local") || host.endsWith(".internal")) return false;

  const metadataHosts = ["metadata.google.internal", "metadata", "169.254.169.254"];
  if (metadataHosts.includes(host)) return false;

  if (host === "[::1]" || host === "::1") return false;
  if (host.startsWith("[") && host.includes(":")) {
    const inner = host.slice(1, -1);
    if (inner === "::1") return false;
    if (inner.toLowerCase().startsWith("fc") || inner.toLowerCase().startsWith("fd")) return false;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 0) return false;
    if (a === 169 && b === 254) return false;
    if (a === 192 && b === 168) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
  }

  return true;
}

function hostMatchesAllowlist(hostname: string): boolean {
  const host = normalizeHost(hostname);
  const extras = parseExtraFragments();
  const all = [...DEFAULT_HOST_FRAGMENTS, ...extras];
  return all.some((frag) => host.includes(frag));
}

/**
 * URL autorisée pour l’import (allowlist ou mode ouvert + hostname sûr).
 */
export function isAllowedListingUrl(urlStr: string): boolean {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (!isSafePublicFetchHostname(url.hostname)) return false;
  if (allowAnyPublicUrl()) return true;
  return hostMatchesAllowlist(url.hostname);
}

function detectSource(hostname: string): string {
  const h = normalizeHost(hostname);
  if (h.includes("airbnb.")) return "airbnb";
  if (h.includes("booking.com")) return "booking";
  if (h.includes("vrbo.") || h.includes("homeaway.") || h.includes("abritel.")) return "vacation_rental";
  if (h.includes("tripadvisor.")) return "tripadvisor";
  return "unknown";
}

export async function fetchListingForImport(urlStr: string): Promise<string> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(urlStr, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`Échec du téléchargement de la page (${res.status})`);
    }
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function parseJsonLdBlocks(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }
  return out;
}

function walkJsonLd(node: unknown, visit: (o: Record<string, unknown>) => void): void {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const item of node) walkJsonLd(item, visit);
    return;
  }
  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    visit(o);
    if (o["@graph"]) walkJsonLd(o["@graph"], visit);
  }
}

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function collectImages(val: unknown, acc: string[]): void {
  if (!val) return;
  if (typeof val === "string" && val.startsWith("http")) {
    acc.push(val);
    return;
  }
  if (Array.isArray(val)) {
    for (const item of val) collectImages(item, acc);
    return;
  }
  if (typeof val === "object" && val !== null) {
    const o = val as Record<string, unknown>;
    if (typeof o.url === "string") collectImages(o.url, acc);
    if (o.contentUrl) collectImages(o.contentUrl, acc);
  }
}

function extractMeta(html: string, property: string): string | null {
  const m = html.match(
    new RegExp(`<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']+)["']`, "i")
  );
  return m?.[1] ? decodeMeta(m[1]) : null;
}

function decodeMeta(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function mergeListing(base: ListingImportResult, patch: Partial<ListingImportResult>): ListingImportResult {
  const out = { ...base };
  (Object.keys(patch) as (keyof ListingImportResult)[]).forEach((k) => {
    const v = patch[k];
    if (v === undefined) return;
    if (k === "warnings" && Array.isArray(v)) {
      out.warnings = [...(out.warnings || []), ...v];
      return;
    }
    if (v === null || v === "") return;
    if (k === "amenities" && Array.isArray(v) && v.length === 0) return;
    if (k === "image_urls" && Array.isArray(v) && v.length === 0) return;
    (out as Record<string, unknown>)[k] = v;
  });
  return out;
}

function uniqImages(urls: string[], max = 50): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    const trimmed = u.trim();
    if (!trimmed.startsWith("http")) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

function scrapeExtraImages(html: string): string[] {
  const acc: string[] = [];
  const patterns = [/"(?:large|picture_url|baseUrl|original_content_url)"\s*:\s*"([^"]+)"/gi];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const u = m[1]?.replace(/\\u002F/g, "/");
      if (u?.startsWith("http")) acc.push(u);
      if (acc.length >= 40) return acc;
    }
  }
  return acc;
}

function parseTimeHint(text: string): string | null {
  const m = text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
  return m ? m[0] : null;
}

/**
 * Parse déterministe du HTML (JSON-LD, Open Graph, regex).
 */
export function parseListingFromHtml(html: string, pageUrl: string): ListingImportResult {
  const warnings: string[] = [];
  let result: ListingImportResult = { warnings, partial: true };

  let sourceHost = "unknown";
  try {
    sourceHost = new URL(pageUrl).hostname;
    result.source = detectSource(sourceHost);
  } catch {
    warnings.push("URL de page invalide pour détection de source");
  }

  const jsonBlocks = parseJsonLdBlocks(html);
  const fromLd: Partial<ListingImportResult> = {};

  for (const block of jsonBlocks) {
    walkJsonLd(block, (o) => {
      const type = o["@type"];
      const types = Array.isArray(type) ? type : type ? [type] : [];
      const typeStr = types.map(String).join(" ").toLowerCase();
      const isLodging =
        typeStr.includes("lodgingbusiness") ||
        typeStr.includes("vacationrental") ||
        typeStr.includes("hotel") ||
        typeStr.includes("product") ||
        typeStr.includes("apartment") ||
        typeStr.includes("houseroom");

      if (!isLodging && !o.name && !o.description) return;

      if (!fromLd.name && o.name) fromLd.name = asString(o.name);
      if (!fromLd.description && o.description) {
        fromLd.description = typeof o.description === "string" ? o.description : asString(o.description);
      }

      const imageArr: string[] = [];
      collectImages(o.image, imageArr);
      if (imageArr.length) {
        fromLd.image_urls = uniqImages([...(fromLd.image_urls || []), ...imageArr]);
        if (!fromLd.image_url && fromLd.image_urls[0]) fromLd.image_url = fromLd.image_urls[0];
      }

      const addr = o.address;
      if (addr && typeof addr === "object") {
        const a = addr as Record<string, unknown>;
        const line = [a.streetAddress, a.addressLocality, a.addressRegion]
          .map((x) => asString(x))
          .filter(Boolean)
          .join(", ");
        if (line && !fromLd.location) fromLd.location = line;
      }
      if (!fromLd.location && o.address && typeof o.address === "string") {
        fromLd.location = o.address.trim();
      }

      const geo = o.geo as Record<string, unknown> | undefined;
      if (geo) {
        const lat = asNumber(geo.latitude);
        const lng = asNumber(geo.longitude);
        if (lat != null) fromLd.latitude = lat;
        if (lng != null) fromLd.longitude = lng;
      }

      const offers = o.offers;
      if (offers && typeof offers === "object") {
        const off = offers as Record<string, unknown>;
        const price = asNumber(off.price ?? off.lowPrice ?? off.highPrice);
        if (price != null && !fromLd.price_per_night) fromLd.price_per_night = price;
        const cur = asString(off.priceCurrency);
        if (cur && cur !== "EUR") warnings.push(`Devise prix détectée : ${cur} (vérifier la conversion).`);
      }

      const cap =
        asNumber(o.occupancy) ??
        asNumber((o as { maximumAttendeeCapacity?: unknown }).maximumAttendeeCapacity) ??
        asNumber((o as { numberOfRooms?: unknown }).numberOfRooms);
      if (cap != null && !fromLd.capacity) fromLd.capacity = Math.max(1, Math.round(cap));
    });
  }

  result = mergeListing(result, fromLd);

  const ogTitle = extractMeta(html, "og:title");
  const ogDesc = extractMeta(html, "og:description") || extractMeta(html, "description");
  const ogImage = extractMeta(html, "og:image");

  if (ogTitle && !result.name) {
    const name = ogTitle.split(/\s*[·•|\-–—]\s*/)[0]?.trim();
    if (name) result.name = name;
  }
  if (ogDesc && !result.description) result.description = ogDesc;

  const ogImages: string[] = [];
  if (ogImage) ogImages.push(ogImage);
  const tw = extractMeta(html, "twitter:image");
  if (tw) ogImages.push(tw);
  if (ogImages.length || scrapeExtraImages(html).length) {
    const merged = uniqImages([
      ...(result.image_urls || []),
      ...ogImages,
      ...scrapeExtraImages(html),
    ]);
    result.image_urls = merged;
    if (!result.image_url && merged[0]) result.image_url = merged[0];
  }

  const textBlob = `${ogDesc || ""}\n${html.slice(0, 120_000)}`;

  const guestMatch =
    textBlob.match(/(\d+)\s*(voyageurs?|guests?|hôtes?|hosts?)/i) ||
    textBlob.match(/(\d+)\s*(personnes|persons)/i);
  if (guestMatch && !result.capacity) {
    result.capacity = Math.max(1, parseInt(guestMatch[1], 10));
  }

  const bathMatch = textBlob.match(/(\d+)\s*(salle(s)?\s*de\s*bain|bathroom|bath)s?/i);
  if (bathMatch && !result.bathrooms_count) {
    result.bathrooms_count = parseInt(bathMatch[1], 10);
  }

  const surfMatch = textBlob.match(/(\d+)\s*(m²|m2|sq\s*m)/i);
  if (surfMatch && !result.surface_m2) {
    result.surface_m2 = parseInt(surfMatch[1], 10);
  }

  const checkIn = textBlob.match(/check[-\s]?in[^0-9]{0,24}([01]?\d|2[0-3]):[0-5]\d/i)
    || textBlob.match(/arrivée[^0-9]{0,24}([01]?\d|2[0-3]):[0-5]\d/i);
  if (checkIn?.[1] && !result.check_in_time) {
    const full = checkIn[0].match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
    if (full) result.check_in_time = full[0];
  }
  const checkOut = textBlob.match(/check[-\s]?out[^0-9]{0,24}([01]?\d|2[0-3]):[0-5]\d/i)
    || textBlob.match(/départ[^0-9]{0,24}([01]?\d|2[0-3]):[0-5]\d/i);
  if (checkOut?.[1] && !result.check_out_time) {
    const full = checkOut[0].match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
    if (full) result.check_out_time = full[0];
  }

  if (!result.check_in_time) {
    const metaIn = extractMeta(html, "checkin");
    if (metaIn) {
      const t = parseTimeHint(metaIn);
      if (t) result.check_in_time = t;
    }
  }
  if (!result.check_out_time) {
    const metaOut = extractMeta(html, "checkout");
    if (metaOut) {
      const t = parseTimeHint(metaOut);
      if (t) result.check_out_time = t;
    }
  }

  if (ogTitle && !result.location) {
    const parts = ogTitle.split(/\s*[·•|\-–—]\s*/);
    if (parts.length >= 2) {
      const tail = parts[parts.length - 1]?.replace(/airbnb.*/i, "").trim();
      if (tail && tail.length > 2) result.location = tail;
    }
  }

  if (!result.name && ogTitle) result.name = ogTitle.replace(/\s*·\s*airbnb.*$/i, "").trim();

  if (!result.description && jsonBlocks.length === 0 && !ogDesc) {
    warnings.push("Peu de métadonnées structurées : import partiel probable.");
  }

  return result;
}
