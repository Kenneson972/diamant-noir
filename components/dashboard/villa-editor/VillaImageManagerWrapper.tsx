"use client";

import { useState, useEffect } from "react";
import { VillaImageManager } from "./VillaImageManager";

interface VillaImageManagerWrapperProps {
  villaId: string;
  initialPhotos: string[];
  photosRef?: React.MutableRefObject<string[]>;
}

export function VillaImageManagerWrapper({
  villaId,
  initialPhotos,
  photosRef,
}: VillaImageManagerWrapperProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(initialPhotos);
  const [mainImage, setMainImage] = useState<string>(initialPhotos[0] ?? "");

  useEffect(() => {
    if (photosRef) {
      photosRef.current = imageUrls;
    }
  }, [imageUrls, photosRef]);

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
