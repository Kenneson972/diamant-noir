import type { SupabaseClient } from "@supabase/supabase-js";

export type SubmissionRow = Record<string, unknown>;

const EXTERIOR_KEYWORDS = ["piscine", "jardin", "terrasse", "balcon", "barbecue", "parking", "vue mer"];

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : v != null ? String(v) : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

const num = (v: unknown): number => {
  const m = str(v).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
};

export function mapSubmissionToVilla(s: SubmissionRow): Record<string, unknown> {
  const bedrooms = num(s.chambres);
  const equipements = arr(s.equipements);
  const photos = arr(s.photo_urls);
  const isExterior = (e: string) => EXTERIOR_KEYWORDS.some((k) => e.toLowerCase().includes(k));

  const description = [str(s.message), str(s.villa_description)].filter(Boolean).join("\n\n");

  return {
    name: str(s.villa_name) || `Villa de ${str(s.name) || "propriétaire"}`,
    location: str(s.villa_location) || str(s.adresse_postale) || "",
    description,
    price_per_night: 0,
    capacity: Math.max(2, bedrooms * 2),
    bedrooms,
    bathrooms_count: num(s.salles_de_bains),
    surface_m2: num(s.surface),
    equipment_interior: equipements.filter((e) => !isExterior(e)),
    equipment_exterior: equipements.filter(isExterior),
    image_urls: photos,
    image_url: photos[0] ?? "",
    airbnb_url: str(s.airbnb_url) || "",
    is_published: false,
    min_nights: 2,
    commission_rate: 22,
  };
}

export async function createVillaFromSubmission(
  admin: SupabaseClient,
  submission: SubmissionRow,
): Promise<{ villaId: string | null; created: boolean; error?: string }> {
  if (submission.villa_id) {
    return { villaId: String(submission.villa_id), created: false };
  }

  const payload = mapSubmissionToVilla(submission);

  const email = String(submission.email ?? "").trim().toLowerCase();
  if (email) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (profile?.id) payload.owner_id = profile.id;
  }

  const { data: villa, error } = await admin.from("villas").insert(payload).select("id").single();
  if (error || !villa) {
    return { villaId: null, created: false, error: error?.message ?? "Insert villa échoué" };
  }

  await admin
    .from("villa_submissions")
    .update({ villa_id: villa.id, updated_at: new Date().toISOString() })
    .eq("id", submission.id as string);

  return { villaId: villa.id as string, created: true };
}
