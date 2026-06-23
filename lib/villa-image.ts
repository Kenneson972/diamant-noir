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

/** Galerie dédupliquée pour carousels listing (image principale + image_urls). */
export function collectVillaImageUrls(
  imageUrl?: string | null,
  imageUrls?: string[] | null,
  max = 8
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (url?: string | null) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  };

  push(imageUrl);
  imageUrls?.forEach(push);

  if (out.length === 0) out.push(VILLA_IMAGE_FALLBACK);
  return out.slice(0, max);
}
