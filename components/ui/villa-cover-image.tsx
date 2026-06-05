"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { VILLA_IMAGE_FALLBACK } from "@/lib/villa-image";

type VillaCoverImageProps = Omit<ComponentProps<typeof Image>, "src" | "onError"> & {
  src?: string | null;
};

/** Image villa avec repli local si l'URL Supabase (ou autre) renvoie 404. */
export function VillaCoverImage({ src, alt, ...props }: VillaCoverImageProps) {
  const primary = src?.trim() || VILLA_IMAGE_FALLBACK;
  const [current, setCurrent] = useState(primary);

  useEffect(() => {
    setCurrent(primary);
  }, [primary]);

  return (
    <Image
      {...props}
      alt={alt}
      src={current}
      onError={() => {
        if (current !== VILLA_IMAGE_FALLBACK) setCurrent(VILLA_IMAGE_FALLBACK);
      }}
    />
  );
}
