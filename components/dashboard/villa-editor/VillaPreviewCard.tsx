"use client";

import { VillaCoverImage } from "@/components/ui/villa-cover-image";
import { pickVillaImageUrl } from "@/lib/villa-image";
import type { VillaFormData } from "@/lib/validations/villa";
import { cn } from "@/lib/utils";

export function VillaPreviewCard({
  form,
  hoveredSection,
}: {
  form: VillaFormData;
  hoveredSection: string | null;
}) {
  const imageSrc = pickVillaImageUrl(form.image_url, form.image_urls);
  const topAmenities = [
    ...form.equipment_interior.slice(0, 2),
    ...form.equipment_exterior.slice(0, 2),
  ].slice(0, 4);
  const roomCapacity = form.rooms_details.reduce(
    (sum, r) => sum + (["King size", "Queen size", "Double"].includes(r.bed) ? 2 : 1),
    0
  );

  return (
    <div className="overflow-hidden border border-navy/8 bg-white" data-testid="villa-preview-card">
      <div className="relative aspect-[16/10] bg-navy/5">
        {imageSrc ? (
          <VillaCoverImage
            src={imageSrc}
            alt={form.name || "Villa"}
            fill
            className="object-cover"
            sizes="400px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-navy/20">
            Aperçu de la villa
          </div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-navy">
            {form.name || "Nom de la villa"}
          </h3>
          {form.location ? (
            <p className="text-sm text-navy/50">{form.location}, Martinique</p>
          ) : null}
        </div>
        <p
          className={cn(
            "font-display text-xl font-bold text-navy",
            hoveredSection === "pricing" && "ring-2 ring-gold/30 rounded"
          )}
        >
          {form.price_per_night > 0 ? `${form.price_per_night} €` : "—"}
          <span className="text-sm font-normal text-navy/40"> / nuit</span>
        </p>
        <div
          className={cn(
            "flex flex-wrap gap-1.5",
            hoveredSection === "equipments" && "ring-2 ring-gold/30 rounded"
          )}
        >
          {topAmenities.length > 0 ? (
            topAmenities.map((a) => (
              <span
                key={a}
                className="rounded-full border border-navy/10 px-2.5 py-1 text-[11px] font-medium text-navy/60"
              >
                {a}
              </span>
            ))
          ) : (
            <span className="text-[11px] italic text-navy/30">
              Équipements à renseigner
            </span>
          )}
        </div>
        {form.rooms_details.length > 0 && (
          <p
            className={cn(
              "text-sm text-navy/55",
              hoveredSection === "rooms" && "ring-2 ring-gold/30 rounded"
            )}
          >
            {form.rooms_details.length} chambre{form.rooms_details.length > 1 ? "s" : ""} ·{" "}
            {roomCapacity} personne{roomCapacity > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
