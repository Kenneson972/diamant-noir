/* ─── Schémas de validation Zod ─────────────────────── */

/**
 * Schémas de validation partagés pour les formulaires Kayvila.
 * Utiliser avec react-hook-form + @hookform/resolvers/zod.
 */

import { z } from "zod";

/** Soumission villa publique (audit Sec#6). Champs optionnels permissifs, name+email requis. */
export const villaSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().trim().optional(),
  villa_name: z.string().trim().optional(),
  villa_location: z.string().trim().optional(),
  villa_type: z.string().trim().optional(),
  surface: z.union([z.string(), z.number()]).optional(),
  surface_terrain: z.union([z.string(), z.number()]).optional(),
  chambres: z.union([z.string(), z.number()]).optional(),
  salles_de_bains: z.union([z.string(), z.number()]).optional(),
  etages: z.union([z.string(), z.number()]).optional(),
  parking_places: z.union([z.string(), z.number()]).optional(),
  parking_securise: z.boolean().optional(),
  equipements: z.array(z.string()).optional(),
  already_listed: z.string().optional(),
  airbnb_url: z.string().url().optional().or(z.literal("")),
  message: z.string().optional(),
  gardien_existant: z.string().optional(),
  delai_souhaite: z.string().optional(),
  adresse_postale: z.string().optional(),
  no_photos: z.boolean().optional(),
  photo_urls: z.array(z.string()).optional(),
}).passthrough();

export type LoginFormData = {
  email: string;
  password: string;
};

export type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type VillaFormData = {
  name: string;
  location: string;
  description: string;
  price_per_night: number;
  capacity: number;
  bathrooms_count: number;
  surface_m2: number;
  check_in_time: string;
  check_out_time: string;
};

/**
 * Valide les données d'un formulaire de réservation.
 * Returns : { valid: true } | { valid: false, errors: Record<string, string> }
 */
export function validateBookingInput(data: Record<string, unknown>): { valid: true } | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.startDate || typeof data.startDate !== "string") {
    errors.startDate = "La date d'arrivée est requise";
  }
  if (!data.endDate || typeof data.endDate !== "string") {
    errors.endDate = "La date de départ est requise";
  }
  if (!data.villaId || typeof data.villaId !== "string") {
    errors.villaId = "La villa est requise";
  }

  if (typeof data.startDate === "string" && typeof data.endDate === "string") {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (isNaN(start.getTime())) errors.startDate = "Date d'arrivée invalide";
    if (isNaN(end.getTime())) errors.endDate = "Date de départ invalide";
    if (start >= end) errors.endDate = "Le départ doit être après l'arrivée";
  }

  return Object.keys(errors).length > 0 ? { valid: false, errors } : { valid: true };
}

/**
 * Valide les données d'un formulaire de contact.
 */
export function validateContactInput(data: Record<string, unknown>): { valid: true } | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.name || typeof data.name !== "string" || data.name.trim().length < 2) {
    errors.name = "Le nom est requis (min. 2 caractères)";
  }
  if (!data.email || typeof data.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email invalide";
  }
  if (!data.message || typeof data.message !== "string" || data.message.trim().length < 10) {
    errors.message = "Le message doit contenir au moins 10 caractères";
  }

  return Object.keys(errors).length > 0 ? { valid: false, errors } : { valid: true };
}

/**
 * Validation simple d'une adresse email.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validation du format de date ISO (YYYY-MM-DD).
 */
export function isValidDateISO(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  return !isNaN(d.getTime()) && dateStr === d.toISOString().slice(0, 10);
}
