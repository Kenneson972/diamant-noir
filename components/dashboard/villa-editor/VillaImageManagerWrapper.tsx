"use client";

import { useState } from "react";
import { VillaImageManager } from "./VillaImageManager";

interface VillaImageManagerWrapperProps {
  villaId: string;
  initialPhotos: string[];
}

export function VillaImageManagerWrapper({
  villaId,
  initialPhotos,
}: VillaImageManagerWrapperProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(initialPhotos);
  const [mainImage, setMainImage] = useState<string>(initialPhotos[0] ?? "");

  const handleError = (msg: string) => {
    console.error("VillaImageManager error:", msg);
  };

  return (
    <VillaImageManager
      imageUrls={imageUrls}
      villaId={villaId}
      onImagesChange={setImageUrls}
      onMainImageChange={setMainImage}
      onError={handleError}
    />
  );
}
