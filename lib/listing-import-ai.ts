import type { ListingFieldSource, ListingImportResult } from "./listing-import-types";

const SNIPPET_MAX = 28_000;

const EXTRACTION_INSTRUCTIONS = `
Tu complètes un objet JSON décrivant une location (villa, appartement) à partir du texte de page fourni.
Règles strictes :
- Utilise UNIQUEMENT des informations présentes dans pageText ou cohérentes avec parsed déjà extrait.
- Ne invente rien : si une info manque, mets null ou omets la clé.
- Ne renvoie PAS image_url ni image_urls (gérés côté HTML).
- Réponds uniquement avec un objet JSON plat (pas de markdown).
Clés possibles (noms exacts — pour le prix utilise toujours price_per_night en nombre, pas la clé « price », ni chaîne avec symbole €) :
- name, description, location
- capacity (nombre entier), price_per_night (nombre : prix par nuit sans devise), bathrooms_count (nombre), surface_m2 (nombre)
- check_in_time, check_out_time (format HH:MM)
- latitude (nombre), longitude (nombre)
- house_rules (texte : règlement intérieur complet)
- cancellation_policy (texte : politique d'annulation)
- safety_info (texte : équipements de sécurité présents)
- environment (texte court : type de logement et environnement, ex: "Logement complet · Appartement en rez-de-jardin")
- nearby_points (tableau de chaînes courtes : points d'intérêt à proximité)
- amenities (tableau de chaînes courtes en français : équipements disponibles)
`.trim();

export function stripHtmlToSnippet(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SNIPPET_MAX);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Dénveloppe les formes de réponse n8n / proxies (body, json, data, tableau, chaîne JSON).
 */
export function unwrapN8nListingBody(raw: unknown): Partial<ListingImportResult> | null {
  if (raw == null) return null;

  if (typeof raw === "string") {
    const t = raw.trim();
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return unwrapN8nListingBody(JSON.parse(t.slice(start, end + 1)));
      } catch {
        return null;
      }
    }
    return null;
  }

  if (Array.isArray(raw)) {
    if (raw.length === 1) return unwrapN8nListingBody(raw[0]);
    return null;
  }

  if (!isPlainObject(raw)) return null;

  const listing = raw.listing ?? raw.data ?? raw.body ?? raw.json ?? raw.result;
  if (listing && listing !== raw) {
    const inner = unwrapN8nListingBody(listing);
    if (inner) return inner;
  }

  const textKeys = ["output", "text", "response", "content", "message"] as const;
  for (const k of textKeys) {
    if (typeof raw[k] === "string") {
      const inner = unwrapN8nListingBody(raw[k]);
      if (inner) return inner;
    }
  }

  const out: Partial<ListingImportResult> = {};
  const keys: (keyof ListingImportResult)[] = [
    "name",
    "description",
    "location",
    "capacity",
    "price_per_night",
    "bathrooms_count",
    "surface_m2",
    "check_in_time",
    "check_out_time",
    "latitude",
    "longitude",
    "house_rules",
    "cancellation_policy",
    "safety_info",
    "environment",
    "nearby_points",
    "amenities",
  ];
  let any = false;
  const rawR = raw as Record<string, unknown>;
  for (const key of keys) {
    if (key in rawR && rawR[key as string] !== undefined) {
      (out as Record<string, unknown>)[key] = rawR[key as string];
      any = true;
    }
  }
  /** LLM / n8n renvoient souvent `price` ou variantes — le merge attend `price_per_night`. */
  const priceAlias =
    rawR.price_per_night ??
    rawR.price ??
    rawR.nightly_price ??
    rawR.nightlyPrice ??
    rawR.pricePerNight ??
    rawR.prix ??
    rawR.prix_nuit;
  if (priceAlias !== undefined && priceAlias !== null && out.price_per_night == null) {
    const n = coerceNumber(priceAlias);
    if (n != null && n > 0) {
      out.price_per_night = n;
      any = true;
    }
  }
  const capAlias =
    rawR.capacity ?? rawR.guests ?? rawR.maxGuests ?? rawR.personCapacity ?? rawR.voyageurs ?? rawR.occupancy;
  if (capAlias !== undefined && capAlias !== null && out.capacity == null) {
    const n = coerceNumber(capAlias);
    if (n != null && n > 0 && n < 500) {
      out.capacity = Math.round(n);
      any = true;
    }
  }
  return any ? out : null;
}

function emptyish(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "number") return !Number.isFinite(v);
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function coerceNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    let s = v
      .trim()
      .replace(/\u00A0/g, " ")
      .replace(/€/g, " ")
      .replace(/EUR/gi, " ")
      .replace(/par\s+nuit/gi, " ")
      .replace(/\s+/g, "");
    s = s.replace(/(\d)[\s']+(?=\d)/g, "$1");
    const n = parseFloat(s.replace(",", "."));
    if (Number.isFinite(n)) return n;
    const m = v.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?|\d+(?:[.,]\d+)?)/);
    if (m) {
      const n2 = parseFloat(m[1].replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
      return Number.isFinite(n2) ? n2 : null;
    }
    return null;
  }
  return null;
}

function normalizeMerged(
  parsed: ListingImportResult,
  patch: Partial<ListingImportResult>,
  source: ListingFieldSource,
  forceOverride = false
): { merged: ListingImportResult; field_sources: Partial<Record<string, ListingFieldSource>> } {
  const merged: ListingImportResult = { ...parsed };
  const field_sources: Partial<Record<string, ListingFieldSource>> = {};

  const keys: (keyof ListingImportResult)[] = [
    "name",
    "description",
    "location",
    "capacity",
    "price_per_night",
    "bathrooms_count",
    "surface_m2",
    "check_in_time",
    "check_out_time",
    "latitude",
    "longitude",
    "house_rules",
    "cancellation_policy",
    "safety_info",
    "environment",
    "nearby_points",
    "amenities",
  ];

  const numericKeys = new Set<string>([
    "capacity",
    "price_per_night",
    "bathrooms_count",
    "surface_m2",
    "latitude",
    "longitude",
  ]);

  for (const key of keys) {
    const next = patch[key];
    if (next === undefined || next === null) continue;
    const cur = merged[key];
    if (!forceOverride && !emptyish(cur)) continue;

    if ((key === "amenities" || key === "nearby_points") && Array.isArray(next)) {
      const list = next.map((x) => String(x).trim()).filter(Boolean);
      if (list.length) {
        (merged as Record<string, unknown>)[key] = list;
        field_sources[key] = source;
      }
      continue;
    }

    if (numericKeys.has(String(key))) {
      const n = coerceNumber(next);
      if (n == null) continue;
      (merged as Record<string, unknown>)[key] = n;
      field_sources[key] = source;
      continue;
    }

    if (typeof next === "string") {
      const t = next.trim();
      if (!t) continue;
      (merged as Record<string, unknown>)[key] = t;
      field_sources[key] = source;
      continue;
    }
  }

  merged.warnings = [...(parsed.warnings || [])];
  return { merged, field_sources };
}

async function callOpenAiEnrich(
  parsed: ListingImportResult,
  pageUrl: string,
  pageText: string
): Promise<{ patch: Partial<ListingImportResult> | null; note: string | null }> {
  const key = process.env.LISTING_IMPORT_OPENAI_API_KEY;
  if (!key) return { patch: null, note: "OPENAI_KEY_ABSENT" };

  const model = process.env.LISTING_IMPORT_OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const user = JSON.stringify(
    {
      pageUrl,
      parsed,
      pageText,
    },
    null,
    0
  );

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.15,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: EXTRACTION_INSTRUCTIONS },
          {
            role: "user",
            content: `Extrais les champs manquants. Données :\n${user}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { patch: null, note: `openai_http_${res.status}:${err.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { patch: null, note: "openai_empty_content" };

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      return { patch: null, note: "openai_json_parse" };
    }

    const patch = unwrapN8nListingBody(parsedJson);
    return { patch, note: null };
  } catch (e) {
    return { patch: null, note: e instanceof Error ? e.message : "openai_error" };
  }
}

async function callN8nEnrich(
  parsed: ListingImportResult,
  pageUrl: string,
  pageText: string
): Promise<{ patch: Partial<ListingImportResult> | null; note: string | null }> {
  const url = process.env.LISTING_IMPORT_N8N_WEBHOOK_URL?.trim();
  if (!url) return { patch: null, note: null };

  const secret = process.env.LISTING_IMPORT_N8N_WEBHOOK_SECRET?.trim();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers["X-Webhook-Secret"] = secret;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "listing_import_enrich",
        pageUrl,
        pageText,
        extractionInstructions: EXTRACTION_INSTRUCTIONS,
        parsed,
      }),
    });

    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    if (!res.ok) {
      return { patch: null, note: `n8n_${res.status}:${String(text).slice(0, 240)}` };
    }

    const patch = unwrapN8nListingBody(body);
    return { patch, note: patch ? null : "n8n_unwrap_empty" };
  } catch (e) {
    return { patch: null, note: e instanceof Error ? e.message : "n8n_fetch" };
  }
}

export async function enrichListingWithAi(
  parsed: ListingImportResult,
  pageUrl: string,
  html: string,
  options: { useAi: boolean }
): Promise<{
  merged: ListingImportResult;
  field_sources: Partial<Record<string, ListingFieldSource>>;
  ai_used: boolean;
  ai_note: string | null;
}> {
  const field_sources: Partial<Record<string, ListingFieldSource>> = {};
  let merged: ListingImportResult = { ...parsed, warnings: [...(parsed.warnings || [])] };

  if (!options.useAi) {
    return { merged, field_sources, ai_used: false, ai_note: null };
  }

  const pageText = stripHtmlToSnippet(html);

  const n8n = await callN8nEnrich(merged, pageUrl, pageText);
  if (n8n.patch && Object.keys(n8n.patch).length > 0) {
    const r = normalizeMerged(merged, n8n.patch, "n8n", true);
    merged = r.merged;
    Object.assign(field_sources, r.field_sources);
    return {
      merged,
      field_sources,
      ai_used: true,
      ai_note: n8n.note,
    };
  }

  const openai = await callOpenAiEnrich(merged, pageUrl, pageText);
  if (openai.patch && Object.keys(openai.patch).length > 0) {
    const r = normalizeMerged(merged, openai.patch, "ai", true);
    merged = r.merged;
    Object.assign(field_sources, r.field_sources);
    return {
      merged,
      field_sources,
      ai_used: true,
      ai_note: openai.note ?? n8n.note,
    };
  }

  const note = n8n.note || openai.note || "aucun enrichissement (champs déjà remplis ou IA indisponible)";
  merged.warnings = [...(merged.warnings || []), note];
  return { merged, field_sources, ai_used: false, ai_note: note };
}
