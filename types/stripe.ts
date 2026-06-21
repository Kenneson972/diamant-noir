import { z } from "zod";

export const BookingRequestSchema = z.object({
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  villaId: z.string().uuid("ID de villa invalide"),
  guests: z.number().int().positive("Nombre de voyageurs invalide").optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email("Email invalide").optional().nullable(),
  serviceFeePercent: z.number().min(0).max(100).optional().default(5),
  cgvAccepted: z.literal(true, { message: "Acceptation des CGV requise" }),
});

export type BookingRequest = z.infer<typeof BookingRequestSchema>;
