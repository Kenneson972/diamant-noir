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

/** Décode une chaîne JSON courante dans les blobs Airbnb (échappements minimaux). */
function decodeEmbeddedJsonString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\u0026/g, "&");
}

/**
 * Airbnb met souvent `houseRules`, horaires et `Amenity` très loin dans le HTML (>120 ko) :
 * le bloc `textBlob` des heuristiques texte ne les voit pas. On les prend ici sur le même
 * `slice` que le reste du scrape JSON.
 */
function extractAirbnbHouseRulesAndAmenities(slice: string): Partial<ListingImportResult> {
  const out: Partial<ListingImportResult> = {};

  const hrIdx = slice.indexOf('"houseRules":[');
  if (hrIdx >= 0) {
    const endSub = slice.indexOf('],"listingExpectations"', hrIdx);
    const chunk =
      endSub > hrIdx ? slice.slice(hrIdx, endSub + 1) : slice.slice(hrIdx, hrIdx + 15_000);
    const titles: string[] = [];
    const titleRe = /"title"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    let tm: RegExpExecArray | null;
    while ((tm = titleRe.exec(chunk)) !== null) {
      const raw = decodeEmbeddedJsonString(tm[1]).trim();
      if (raw) titles.push(raw);
    }
    if (titles.length) {
      out.house_rules = titles.join("\n");
      for (const line of titles) {
        const timeMatch = line.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
        if (!timeMatch) continue;
        if (
          /arrivée/i.test(line) ||
          /check[-\s]?in/i.test(line)
        ) {
          if (!out.check_in_time) out.check_in_time = timeMatch[0];
        }
        if (
          /départ/i.test(line) ||
          /check[-\s]?out/i.test(line)
        ) {
          if (!out.check_out_time) out.check_out_time = timeMatch[0];
        }
      }
    }
  }

  const amenityRe =
    /"__typename":"Amenity","id":"[^"]+","available":true,"title":"((?:[^"\\]|\\.)*)"/g;
  const seenAm = new Set<string>();
  const amenities: string[] = [];
  let am: RegExpExecArray | null;
  while ((am = amenityRe.exec(slice)) !== null) {
    const title = decodeEmbeddedJsonString(am[1]).trim();
    if (!title || seenAm.has(title)) continue;
    seenAm.add(title);
    amenities.push(title);
  }
  if (amenities.length) out.amenities = amenities;

  return out;
}

/**
 * Extrait les champs clés depuis les blocs JSON embarqués (Airbnb __NEXT_DATA__, etc.)
 * en recherchant des patterns connus directement dans le HTML brut.
 */
function scrapeEmbeddedJsonFields(html: string): Partial<ListingImportResult> {
  const out: Partial<ListingImportResult> = {};
  const slice = html.slice(0, 800_000);

  // Capacité — Airbnb: "personCapacity":N ou "person_capacity":N
  if (!out.capacity) {
    const m = slice.match(/"person(?:_c|C)apacity"\s*:\s*(\d+)/);
    if (m) { const n = parseInt(m[1], 10); if (n > 0 && n < 200) out.capacity = n; }
  }
  // Fallback: "maxGuests":N ou "guestCapacity":N
  if (!out.capacity) {
    const m = slice.match(/"(?:maxGuests|guestCapacity|maximumOccupancy)"\s*:\s*(\d+)/);
    if (m) { const n = parseInt(m[1], 10); if (n > 0 && n < 200) out.capacity = n; }
  }

  // Prix/nuit — pattern JSON courant Airbnb (nombreux formats)
  const pricePatterns: RegExp[] = [
    /"nightly_price"\s*:\s*(\d+(?:\.\d+)?)/,
    /"nightly_price_as_guest"\s*:\s*(\d+(?:\.\d+)?)/,
    /"(?:basePrice|nightlyPrice|nightlyRate|nightlyPriceAmount)"\s*:\s*(\d+(?:\.\d+)?)/,
    /"price"\s*:\s*\{"amount"\s*:\s*(\d+(?:\.\d+)?)/,
    /"amount"\s*:\s*(\d+(?:\.\d+)?)\s*,\s*"currency"\s*:\s*"EUR"/,
    /"localizedPrice"\s*:\s*"[^"]*?(\d{2,6})[^"]*?€/,
    /"formattedPrice"\s*:\s*"[^"]*?(\d{2,6})[^"]*€/,
    /"priceString"\s*:\s*"[^"]*?(\d{2,6})[^"]*€/,
    /"discountedPrice"\s*:\s*(\d+(?:\.\d+)?)/,
    // accessibilityLabel: "57 € par nuit" (Airbnb FR)
    /"accessibilityLabel"\s*:\s*"(\d{2,6})\s*€/,
  ];
  for (const re of pricePatterns) {
    if (!out.price_per_night) {
      const m = slice.match(re);
      if (m) { const n = parseFloat(m[1]); if (n > 5 && n < 200_000) { out.price_per_night = n; break; } }
    }
  }
  // Airbnb : montant en micro-unités (ex. 57 € → 57_000_000)
  if (!out.price_per_night) {
    const mMicro = slice.match(/"amountMicros"\s*:\s*(\d{6,15})\b/);
    if (mMicro) {
      const micros = parseInt(mMicro[1], 10);
      const euros = micros / 1_000_000;
      if (euros > 5 && euros < 200_000) out.price_per_night = Math.round(euros * 100) / 100;
    }
  }
  if (!out.price_per_night) {
    const mQual = slice.match(/"qualifyingPrice"\s*:\s*\{[^}]*"amount"\s*:\s*(\d+(?:\.\d+)?)/);
    if (mQual) {
      const n = parseFloat(mQual[1]);
      if (n > 5 && n < 200_000) out.price_per_night = n;
    }
  }
  // Format texte: "57 € par nuit" ou "€57/nuit" ou "57€/nuit"
  if (!out.price_per_night) {
    const m = slice.match(/(\d{2,5})\s*€\s*(?:par\s+nuit|\/\s*nuit)/i)
      || slice.match(/€\s*(\d{2,5})\s*(?:par\s+nuit|\/\s*nuit)/i)
      || slice.match(/(\d{2,5})\s*€\s*\/?\s*nuit/i);
    if (m) { const n = parseInt(m[1], 10); if (n > 5 && n < 200_000) out.price_per_night = n; }
  }

  // Surface — Airbnb: "squareFeet":N ou "squareMeters":N
  if (!out.surface_m2) {
    const m = slice.match(/"squareMeters"\s*:\s*(\d+(?:\.\d+)?)/);
    if (m) { const n = parseFloat(m[1]); if (n > 0) out.surface_m2 = n; }
  }
  if (!out.surface_m2) {
    const m = slice.match(/"squareFeet"\s*:\s*(\d+(?:\.\d+)?)/);
    if (m) { const n = parseFloat(m[1]); if (n > 0) out.surface_m2 = Math.round(n * 0.0929); }
  }

  // Salles de bain — "bathrooms":N (JSON)
  if (!out.bathrooms_count) {
    const m = slice.match(/"bathrooms"\s*:\s*(\d+(?:\.\d+)?)\b(?!\s*(?:_|[A-Za-z]))/);
    if (m) { const n = parseFloat(m[1]); if (n > 0 && n < 50) out.bathrooms_count = n; }
  }

  // Latitude / Longitude depuis JSON embarqué
  if (!out.latitude) {
    const latPatterns = [
      /"(?:lat|latitude|listing_lat|listingLat|location_lat)"\s*:\s*(-?\d{1,3}\.\d{3,})/,
      /"lat"\s*:\s*(-?\d{1,3}\.\d{3,})/,
    ];
    for (const re of latPatterns) {
      const m = slice.match(re);
      if (m) { const n = parseFloat(m[1]); if (Math.abs(n) <= 90) { out.latitude = n; break; } }
    }
  }
  if (!out.longitude) {
    const lngPatterns = [
      /"(?:lng|lon|longitude|listing_lng|listingLng|location_lng)"\s*:\s*(-?\d{1,3}\.\d{3,})/,
      /"lng"\s*:\s*(-?\d{1,3}\.\d{3,})/,
    ];
    for (const re of lngPatterns) {
      const m = slice.match(re);
      if (m) { const n = parseFloat(m[1]); if (Math.abs(n) <= 180) { out.longitude = n; break; } }
    }
  }

  // Politique d'annulation depuis JSON Airbnb
  if (!out.cancellation_policy) {
    const m = slice.match(/"(?:cancellationPolicyLabel|cancel_policy_label|cancelPolicy)"\s*:\s*"([^"]{5,200})"/);
    if (m) out.cancellation_policy = m[1].replace(/\\n/g, '\n').trim();
  }

  // Règlement, horaires, équipements (JSON loin dans la page — hors fenêtre textBlob)
  const airbnbPolicy = extractAirbnbHouseRulesAndAmenities(slice);
  if (!out.check_in_time && airbnbPolicy.check_in_time) out.check_in_time = airbnbPolicy.check_in_time;
  if (!out.check_out_time && airbnbPolicy.check_out_time) out.check_out_time = airbnbPolicy.check_out_time;
  if (!out.house_rules && airbnbPolicy.house_rules) out.house_rules = airbnbPolicy.house_rules;
  if ((!out.amenities || out.amenities.length === 0) && airbnbPolicy.amenities?.length) {
    out.amenities = airbnbPolicy.amenities;
  }

  return out;
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
    textBlob.match(/(\d+)\s*(personnes?|persons?)/i) ||
    textBlob.match(/pour\s+(\d+)\s+(?:personnes?|voyageurs?)/i);
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

  // Extraction depuis les JSON embarqués (Airbnb __NEXT_DATA__, etc.)
  const embedded = scrapeEmbeddedJsonFields(html);
  if (!result.capacity && embedded.capacity) result.capacity = embedded.capacity;
  if (!result.price_per_night && embedded.price_per_night) result.price_per_night = embedded.price_per_night;
  if (!result.surface_m2 && embedded.surface_m2) result.surface_m2 = embedded.surface_m2;
  if (!result.bathrooms_count && embedded.bathrooms_count) result.bathrooms_count = embedded.bathrooms_count;
  if (!result.latitude && embedded.latitude) result.latitude = embedded.latitude;
  if (!result.longitude && embedded.longitude) result.longitude = embedded.longitude;
  if (!result.cancellation_policy && embedded.cancellation_policy) result.cancellation_policy = embedded.cancellation_policy;
  if (!result.check_in_time && embedded.check_in_time) result.check_in_time = embedded.check_in_time;
  if (!result.check_out_time && embedded.check_out_time) result.check_out_time = embedded.check_out_time;
  if (!result.house_rules && embedded.house_rules) result.house_rules = embedded.house_rules;
  if ((!result.amenities || result.amenities.length === 0) && embedded.amenities?.length) {
    result.amenities = embedded.amenities;
  }

  // --- Extraction textuelle champs supplémentaires ---

  // Cancellation policy: phrases clés Airbnb FR
  if (!result.cancellation_policy) {
    const cancelMatch = textBlob.match(
      /(?:annulation|politique d.annulation|cancellation policy)[^\n.]{0,10}[\s:]+([^\n.]{10,300})/i
    );
    if (cancelMatch?.[1]) {
      result.cancellation_policy = cancelMatch[1].trim().slice(0, 300);
    }
  }

  // House rules depuis texte
  if (!result.house_rules) {
    // Cherche section "Règlement" ou "Règles de la maison"
    const rulesMatch = textBlob.match(
      /(?:règles de la maison|règlement intérieur|house rules)[^\n]{0,10}[\n:]+([^\n]{10,500})/i
    );
    if (rulesMatch?.[1]) {
      result.house_rules = rulesMatch[1].trim().slice(0, 500);
    }
  }

  // Safety info: liste d'équipements sécurité Airbnb
  if (!result.safety_info) {
    const safetyKeywords = [
      'détecteur de fumée', 'smoke detector', 'détecteur de co', 'co detector',
      'extincteur', 'fire extinguisher', 'trousse de premiers secours', 'first aid kit',
      'verrou', 'lock', 'caméra', 'camera',
    ];
    const found = safetyKeywords.filter(kw => textBlob.toLowerCase().includes(kw));
    if (found.length >= 2) {
      result.safety_info = found.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', ');
    }
  }

  // Environment: type de logement depuis Airbnb
  if (!result.environment) {
    const envMatch = textBlob.match(
      /(?:logement complet|chambre privée|chambre partagée|entire home|private room|entire apartment|entire villa)[^\n,·|]{0,60}/i
    );
    if (envMatch?.[0]) {
      result.environment = envMatch[0].replace(/[·|]/g, '').trim().slice(0, 100);
    }
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

  if (result.source === "airbnb" && result.price_per_night == null) {
    warnings.push(
      "Prix par nuit absent du HTML Airbnb (souvent injecté uniquement côté client). Indiquez le tarif manuellement ou via votre grille tarifaire."
    );
  }

  return result;
}
