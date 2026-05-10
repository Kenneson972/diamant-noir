"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { LatLngBounds } from "leaflet";

export type VillaMapItem = {
  id: string;
  name: string;
  location: string | null;
  price: number;
  image: string | null;
  coords: [number, number];
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeHouseIcon(L: any, active: boolean) {
  const bg = active ? "#D4AF37" : "#0A0A0A";
  const iconColor = active ? "#0A0A0A" : "#D4AF37";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
      <path d="M20 0C9 0 0 9 0 20c0 14 20 32 20 32S40 34 40 20C40 9 31 0 20 0z" fill="${bg}" />
      <g transform="translate(20,19)">
        <polygon points="-7,0 0,-6 7,0" fill="${iconColor}" opacity="0.95"/>
        <rect x="-5.5" y="0" width="11" height="7" rx="0.5" fill="${iconColor}" opacity="0.95"/>
        <rect x="-1.5" y="3" width="3" height="4" rx="0.5" fill="${bg}"/>
      </g>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -54],
  });
}

export default function VillaLeafletMap({ villas, hoveredId, onHover, onSelect, onBoundsChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({});
  const onBoundsChangeRef = useRef(onBoundsChange);
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange; }, [onBoundsChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Charger Leaflet + markercluster (dynamique pour éviter L is not defined)
    Promise.all([
      import("leaflet"),
      import("leaflet.markercluster"),
    ]).then(([{ default: L }]) => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [14.6415, -61.0242],
        zoom: 10,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Dark Matter — style noir premium, sans clé API
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.control.attribution({ position: "bottomleft", prefix: false })
        .addAttribution('© <a href="https://www.openstreetmap.org/copyright" style="color:#D4AF37">OSM</a> © <a href="https://carto.com" style="color:#D4AF37">CARTO</a>')
        .addTo(map);

      // Cluster markers
      const markerCluster = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        maxClusterRadius: 50,
      });

      mapRef.current = map;

      const emitBounds = () => {
        if (!onBoundsChangeRef.current || !mapRef.current) return;
        try {
          const size = map.getSize();
          if (!size || size.x === 0 || size.y === 0) return;
          onBoundsChangeRef.current(map.getBounds());
        } catch { /* map tearing down */ }
      };

      villas.forEach((villa) => {
        const marker = L.marker(villa.coords, {
          icon: makeHouseIcon(L, false),
        });
        markerCluster.addLayer(marker);

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
        marker.bindPopup(popupHtml, {
          maxWidth: 220,
          closeButton: false,
          className: "dn-leaflet-popup",
          offset: [0, 0],
        });

        // Click : ouvre QuickView (desktop + mobile touch)
        marker.on("click", () => {
          onSelect(villa.id);
        });

        // Hover : popup preview (desktop uniquement, ignoré sur touch)
        marker.on("mouseover", function (this: typeof marker) {
          this.openPopup();
          onHover(villa.id);
        });
        marker.on("mouseout", function (this: typeof marker) {
          this.closePopup();
          onHover(null);
        });

        markersRef.current[villa.id] = marker;
      });

      map.addLayer(markerCluster);

      map.on("moveend", emitBounds);
      map.on("zoomend", emitBounds);

      map.whenReady(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              map.invalidateSize({ animate: false });
              emitBounds();
            } catch { /* ignore */ }
          });
        });
      });

      if (villas.length > 0) {
        try {
          const bounds = L.latLngBounds(villas.map((v) => v.coords));
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
          setTimeout(() => {
            try {
              mapRef.current?.invalidateSize({ animate: false });
              emitBounds();
            } catch { /* ignore */ }
          }, 400);
        } catch { /* ignore */ }
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour les icônes au hover (supporte les markers dans clusterGroup)
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      Object.entries(markersRef.current).forEach(([id, marker]) => {
        const active = id === hoveredId;
        marker.setIcon(makeHouseIcon(L, active));
        marker.setZIndexOffset(active ? 1000 : 0);
      });
    });
  }, [hoveredId]);

  return <div ref={containerRef} className="w-full h-full" />;
}
