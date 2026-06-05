"use client";

import Link from "next/link";
import { Chip } from "@heroui/react";
import { ExternalLink, Edit3 } from "lucide-react";
import { commissionRateLabel } from "@/lib/commission";

interface Props {
  ownerId: string;
  villas: any[];
}

function firstImage(imageUrls: any): string | null {
  if (Array.isArray(imageUrls) && imageUrls.length > 0) return imageUrls[0];
  return null;
}

export function OwnerVillasTab({ ownerId, villas }: Props) {
  if (villas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-12 text-center">
        <p className="text-navy/40">Aucune villa assignée à ce propriétaire.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {villas.map((villa) => {
        const img = firstImage(villa.image_urls);
        return (
          <div
            key={villa.id}
            className="flex items-center gap-4 rounded-2xl border border-navy/10 bg-white p-4 transition-colors hover:border-navy/20"
          >
            {/* Thumbnail */}
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-navy/5">
              {img ? (
                <img
                  src={img}
                  alt={villa.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-navy/20">
                  N/A
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate text-sm font-semibold text-navy">
                  {villa.name}
                </h4>
                <Chip
                  size="sm"
                  variant="soft"
                  className={villa.is_published ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}
                >
                  {villa.is_published ? "Publiée" : "Brouillon"}
                </Chip>
              </div>
              <div className="mt-1 flex items-center gap-4 text-xs text-muted">
                <span>{villa.price_per_night}€ / nuit</span>
                <span>{commissionRateLabel(villa.commission_rate)} commission</span>
                <span>{villa.capacity} voyageurs</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/admin/villas/${villa.id}`}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/5 transition-colors"
              >
                <Edit3 size={14} /> Éditer
              </Link>
              <Link
                href={`/villas/${villa.slug || villa.id}`}
                className="rounded-lg p-1.5 text-muted hover:bg-navy/5 transition-colors"
              >
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
