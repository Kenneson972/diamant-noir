"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { LatLngBounds } from "leaflet";

export type VillaMapItem = {
  id: string;
  name: string;
  location: string | null;
  price: number;
  image: string | null;
  coords: [number, number];
  // Quick View fields
  images: string[];
  capacity: number | null;
  surface: number | null;
  amenities: string[];
  tier: string | null;
};

interface Props {
  villas: VillaMapItem[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onBoundsChange?: (bounds: LatLngBounds) => void;
}

function makeHouseIcon(L: any, active: boolean) {
  const bg = active ? "#0A0A0A" : "#D4AF37";
  const iconColor = active ? "#D4AF37" : "#fff";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
      <!-- Pin body -->
      <path d="M20 0C9 0 0 9 0 20c0 14 20 32 20 32S40 34 40 20C40 9 31 0 20 0z" fill="${bg}" />
      <!-- House icon centered in circle -->
      <g transform="translate(20,19)">
        <!-- Roof -->
        <polygon points="-7,0 0,-6 7,0" fill="${iconColor}" opacity="0.95"/>
        <!-- Walls -->
        <rect x="-5.5" y="0" width="11" height="7" rx="0.5" fill="${iconColor}" opacity="0.95"/>
        <!-- Door -->
        <rect x="-1.5" y="3" width="3" height="4" rx="0.5" fill="${bg}"/>
      </g>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [40, 52],
    iconAnchor: [20, 52], // pointe du pin = coordonnée exacte
    popupAnchor: [0, -54],
  });
}

export default function VillaLeafletMap({ villas, hoveredId, onHover, onSelect, onBoundsChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const onBoundsChangeRef = useRef(onBoundsChange);
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange; }, [onBoundsChange]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const L = require("leaflet");

    const map = L.map(containerRef.current, {
      center: [14.6415, -61.0242], // Centre Martinique
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
    });

    // Tuiles CartoDB Light — propre et minimal
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19 }
    ).addTo(map);

    // Zoom control en bas à droite
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Attribution discrète
    L.control.attribution({ position: "bottomleft", prefix: false })
      .addAttribution('© <a href="https://www.openstreetmap.org/copyright">OSM</a>')
      .addTo(map);

    mapRef.current = map;

    // Markers
    villas.forEach((villa) => {
      const marker = L.marker(villa.coords, {
        icon: makeHouseIcon(L, false),
      }).addTo(map);

      // Popup mini-card
      const popupHtml = `
        <div class="dn-popup">
          <div class="dn-popup__img" style="background-image:url('${villa.image || "/villa-hero.jpg"}')"></div>
          <div class="dn-popup__body">
            <p class="dn-popup__name">${villa.name}</p>
            <p class="dn-popup__loc">${villa.location || ""}</p>
            <p class="dn-popup__price">${villa.price.toLocaleString("fr-FR")} € <span>/ nuit</span></p>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml, { maxWidth: 220, closeButton: false, className: "dn-leaflet-popup", offset: [0, 0] });

      marker.on("click", () => {
        onSelect(villa.id);
      });
      marker.on("mouseover", function (this: any) {
        this.openPopup();
        onHover(villa.id);
      });
      marker.on("mouseout", function (this: any) {
        this.closePopup();
        onHover(null);
      });

      markersRef.current[villa.id] = marker;
    });

    // Bounds callback — viewport filter (safe: getBounds() throws if map has no layout yet)
    const emitBounds = () => {
      if (!onBoundsChangeRef.current) return;
      const m = mapRef.current;
      if (!m) return;
      try {
        const size = m.getSize();
        if (!size || size.x === 0 || size.y === 0) return;
        onBoundsChangeRef.current(m.getBounds());
      } catch {
        /* map tearing down, hidden container, or Leaflet not ready */
      }
    };
    map.on("moveend", emitBounds);
    map.on("zoomend", emitBounds);

    map.whenReady(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            map.invalidateSize({ animate: false });
            emitBounds();
          } catch {
            /* ignore */
          }
        });
      });
    });

    // Fit bounds sur les villas
    if (villas.length > 0) {
      try {
        const L2 = require("leaflet");
        const bounds = L2.latLngBounds(villas.map((v) => v.coords));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
        setTimeout(() => {
          if (!mapRef.current) return;
          try {
            mapRef.current.invalidateSize({ animate: false });
            emitBounds();
          } catch {
            /* ignore */
          }
        }, 400);
      } catch {}
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour les icônes au hover
  useEffect(() => {
    if (!mapRef.current) return;
    const L = require("leaflet");
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const villa = villas.find((v) => v.id === id);
      if (!villa) return;
      const active = id === hoveredId;
      marker.setIcon(makeHouseIcon(L, active));
      if (active) marker.setZIndexOffset(1000);
      else marker.setZIndexOffset(0);
    });
  }, [hoveredId, villas]);

  return <div ref={containerRef} className="w-full h-full" />;
}
