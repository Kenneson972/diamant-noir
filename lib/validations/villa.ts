import { z } from "zod";

export const roomSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  bed: z.enum(["King size", "Queen size", "Double", "Simple", "Canapé-lit"]),
  ensuite: z.boolean(),
});
export type Room = z.infer<typeof roomSchema>;

export const seasonSchema = z.object({
  season: z.string().min(1, "Nom de saison requis"),
  start: z.string().regex(/^\d{2}-\d{2}$/, "Format MM-DD"),
  end: z.string().regex(/^\d{2}-\d{2}$/, "Format MM-DD"),
  price: z.number().min(0, "Prix ≥ 0"),
});
export type Season = z.infer<typeof seasonSchema>;

export const emergencyContactSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  phone: z.string().min(1, "Téléphone requis"),
});
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;

export const villaFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  location: z.string().optional().default(""),
  description: z.string().optional().default(""),
  price_per_night: z.number().min(1, "Prix minimum 1 €"),
  capacity: z.number().min(0).optional().default(0),
  bedrooms: z.number().min(0).optional().default(0),
  bathrooms_count: z.number().min(0).optional().default(0),
  surface_m2: z.number().min(0).optional().default(0),
  image_url: z.string().optional().default(""),
  image_urls: z.array(z.string()).optional().default([]),
  equipment_interior: z.array(z.string()).optional().default([]),
  equipment_exterior: z.array(z.string()).optional().default([]),
  house_rules: z.array(z.string()).optional().default([]),
  safety_info: z.array(z.string()).optional().default([]),
  check_in_time: z.string().optional().default("15:00"),
  check_out_time: z.string().optional().default("10:00"),
  environment: z.string().optional().default(""),
  nearby_points: z.array(z.string()).optional().default([]),
  included_services_home: z.array(z.string()).optional().default([]),
  included_services_collection: z.array(z.string()).optional().default([]),
  a_la_carte_services: z.array(z.string()).optional().default([]),
  wifi_name: z.string().optional().default(""),
  wifi_password: z.string().optional().default(""),
  checkout_instructions: z.string().optional().default(""),
  map_embed_url: z.string().optional().default(""),
  airbnb_url: z.string().optional().default(""),
  latitude: z.number().optional().default(0),
  longitude: z.number().optional().default(0),
  rooms_details: z.array(roomSchema).optional().default([]),
  seasonal_prices: z.array(seasonSchema).optional().default([]),
  emergency_contacts: z.array(emergencyContactSchema).optional().default([]),
  booking_terms: z.record(z.any()).optional().default({}),
  min_nights: z.number().min(1).optional().default(2),
  welcome_booklet_url: z.string().optional().default(""),
  cancellation_policy: z.string().optional().default(""),
  cancellation_template: z.string().optional().default(""),
  cancellation_notes: z.string().optional().default(""),
  // Admin only
  is_published: z.boolean().optional().default(false),
  commission_rate: z.number().min(0).max(100).optional().default(22),
  owner_id: z.string().optional().default(""),
  collection_tier: z.string().optional().default(""),
  cleaning_fee_cents: z.number().min(0).optional().default(0),
});

export type VillaFormData = z.infer<typeof villaFormSchema>;
