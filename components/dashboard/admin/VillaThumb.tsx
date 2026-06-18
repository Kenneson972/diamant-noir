// components/dashboard/admin/VillaThumb.tsx
import Image from "next/image";
import { Building2 } from "lucide-react";

export function VillaThumb({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div
        className="flex aspect-[16/9] w-full items-center justify-center rounded-md border border-navy/10 bg-offwhite text-navy/30"
        aria-hidden
      >
        <Building2 className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-navy/10">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="300px"
      />
    </div>
  );
}
