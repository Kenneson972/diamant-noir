export const VILLA_IMAGE_FALLBACK = "/villa-hero.jpg";

/** Choisit la première URL image villa disponible, sinon le visuel de secours local. */
export function pickVillaImageUrl(
  imageUrl?: string | null,
  imageUrls?: string[] | null
): string {
  if (imageUrl?.trim()) return imageUrl.trim();
  const fromGallery = imageUrls?.find((url) => url?.trim());
  return fromGallery?.trim() || VILLA_IMAGE_FALLBACK;
}
