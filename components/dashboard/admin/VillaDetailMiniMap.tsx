"use client";

import dynamic from "next/dynamic";
import type { VillaMapItem } from "@/components/VillaLeafletMap";

const VillaLeafletMap = dynamic(() => import("@/components/VillaLeafletMap"), { ssr: false });

interface Props {
  latitude: number;
  longitude: number;
  name: string;
}

export function VillaDetailMiniMap({ latitude, longitude, name }: Props) {
  const villas: VillaMapItem[] = [
    {
      id: "detail",
      name,
      location: null,
      price: 0,
      image: null,
      coords: [latitude, longitude],
      images: [],
      capacity: null,
      surface: null,
      amenities: [],
    },
  ];

  return (
    <VillaLeafletMap
      villas={villas}
      hoveredId={null}
      onHover={() => {}}
      onSelect={() => {}}
    />
  );
}
