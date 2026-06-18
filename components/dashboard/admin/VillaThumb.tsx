// components/dashboard/admin/VillaThumb.tsx
import Image from "next/image";
import { Building2 } from "lucide-react";

export function VillaThumb({
  src,
  alt,
  size,
  width,
  height,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  width?: number;
  height?: number;
}) {
  const w = width ?? size ?? 60;
  const h = height ?? size ?? 60;

  if (!src) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-md border border-navy/10 bg-offwhite text-navy/30"
        style={{ width: w, height: h }}
        aria-hidden
      >
        <Building2 className="h-5 w-5" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      className="shrink-0 rounded-md border border-navy/10 object-cover"
      style={{ width: w, height: h }}
    />
  );
}
