/** FK explicite — évite PGRST201 (double relation bookings ↔ villas en prod). */
export const BOOKING_VILLA_EMBED = "villas!bookings_villa_id_fkey(name)" as const;
