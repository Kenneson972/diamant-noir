"use client";

/** Carte légère OpenStreetMap — remplace Leaflet sur la liste /villas */
export default function VillasMapEmbed() {
  const lat = 14.6415;
  const lng = -61.0242;
  const bbox = `${lng - 0.12},${lat - 0.08},${lng + 0.12},${lat + 0.08}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <iframe
      src={src}
      title="Carte des villas — Martinique"
      className="h-full w-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
