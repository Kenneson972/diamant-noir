import Link from "next/link";
import Image from "next/image";
import { Bed, Bath, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface VillaCardProps {
  id: string;
  name: string;
  location: string;
  mainPhoto?: string | null;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
}

function InfoIcon({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string | number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {text}
    </span>
  );
}

export function VillaCard({
  id,
  name,
  location,
  mainPhoto,
  capacity,
  bedrooms,
  bathrooms,
  pricePerNight,
}: VillaCardProps) {
  return (
    <Link
      href={`/dashboard/villas/${id}`}
      className="group block overflow-hidden rounded-xl border border-border-subtle bg-white shadow-sm transition-all hover:shadow-md"
    >
      {/* Image */}
      <div className="relative h-[300px] w-full overflow-hidden bg-navy-900/5">
        {mainPhoto ? (
          <Image
            src={mainPhoto}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm font-medium text-muted">
              Aucune photo
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-navy-900">
            {name}
          </h3>
          {location && (
            <p className="mt-0.5 text-sm text-muted">{location}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <InfoIcon icon={Users} text={capacity} />
          <InfoIcon icon={Bed} text={`${bedrooms} ch.`} />
          <InfoIcon icon={Bath} text={`${bathrooms} sdb.`} />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm">
            <span className="text-lg font-bold text-navy-900">
              {pricePerNight.toLocaleString("fr-FR")}€
            </span>
            <span className="text-muted"> / nuit</span>
          </span>
          <span className="text-xs font-medium text-navy-900/40 opacity-0 transition-opacity group-hover:opacity-100">
            Modifier →
          </span>
        </div>
      </div>
    </Link>
  );
}
