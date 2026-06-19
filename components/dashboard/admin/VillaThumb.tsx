// components/dashboard/admin/VillaThumb.tsx
import Image from "next/image";
import { Building2 } from "lucide-react";

export function VillaThumb({
  src,
  alt,
  size = 60,
}: {
  src?: string | null;
  alt: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-md border border-navy/10 bg-offwhite text-navy/30"
        style={{ width: size, height: size, minWidth: size }}
        aria-hidden
      >
        <Building2 className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div
      className="shrink-0 overflow-hidden rounded-md border border-navy/10"
      style={{ width: size, height: size, minWidth: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
