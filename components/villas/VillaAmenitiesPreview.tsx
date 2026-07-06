"use client";

import { useState } from "react";
import { KayvilaPngIcon, type KayvilaPngName } from "@/components/icons/KayvilaPngIcon";
import { LegalModal } from "@/components/legal/LegalModal";
import { buildAmenitiesPreview } from "@/lib/villa-amenities-preview";

export const getEquipmentIcon = (label: string): KayvilaPngName => {
  const a = label.toLowerCase();
  if (a.includes("wifi")) return "wifi";
  if (a.includes("climatisation") || a.includes("clim")) return "ac";
  if (a.includes("piscine")) return "pool";
  if (a.includes("jacuzzi")) return "pool";
  if (a.includes("barbecue") || a.includes("bbq")) return "fireplace";
  if (a.includes("jardin") || a.includes("terrasse") || a.includes("extérieur")) return "tree";
  if (a.includes("parking") || a.includes("garage")) return "car";
  if (a.includes("cuisine") || a.includes("réfrigérateur")) return "kitchen";
  if (a.includes("tv") || a.includes("télé") || a.includes("écran")) return "tv";
  if (a.includes("machine à laver") || a.includes("lave-linge")) return "wash";
  if (a.includes("chef") || a.includes("restauration")) return "chef";
  if (a.includes("bateau") || a.includes("nautique") || a.includes("mer") || a.includes("vue") || a.includes("plage")) return "boat";
  if (a.includes("massage") || a.includes("spa") || a.includes("bien-être")) return "heart";
  if (a.includes("concierge") || a.includes("accueil") || a.includes("dédié")) return "users";
  if (a.includes("ménage") || a.includes("draps") || a.includes("serviettes") || a.includes("linge")) return "bed";
  if (a.includes("borne") || a.includes("ev") || a.includes("électrique")) return "car";
  if (a.includes("salle de sport") || a.includes("fitness") || a.includes("gym")) return "gym";
  if (a.includes("sécurité") || a.includes("alarme") || a.includes("caméra")) return "shield-check";
  if (a.includes("clé") || a.includes("autonome") || a.includes("self")) return "key";
  if (a.includes("transfert") || a.includes("navette") || a.includes("transport")) return "plane";
  return "check-circle";
};

function EquipmentCategory({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/55">{title}</p>
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <KayvilaPngIcon name={getEquipmentIcon(item)} size={20} alt="" />
            <span className="text-sm text-navy/70">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type VillaAmenitiesPreviewProps = {
  equipmentInterior: string[];
  equipmentExterior: string[];
  includedServicesHome: string[];
  includedServicesCollection: string[];
  aLaCarteServices: string[];
};

export function VillaAmenitiesPreview({
  equipmentInterior,
  equipmentExterior,
  includedServicesHome,
  includedServicesCollection,
  aLaCarteServices,
}: VillaAmenitiesPreviewProps) {
  const [open, setOpen] = useState(false);

  const { preview, total } = buildAmenitiesPreview({
    interior: equipmentInterior,
    exterior: equipmentExterior,
    servicesHome: includedServicesHome,
    servicesCollection: includedServicesCollection,
    aLaCarte: aLaCarteServices,
  });

  if (total === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        {preview.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <KayvilaPngIcon name={getEquipmentIcon(item)} size={20} alt="" />
            <span className="text-sm text-navy/70">{item}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 inline-flex items-center gap-2 border border-navy/20 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-navy hover:border-navy transition-colors"
      >
        Voir les {total} équipements
      </button>

      <LegalModal open={open} onClose={() => setOpen(false)} title="Tous les équipements">
        <div className="space-y-10">
          <EquipmentCategory title="Intérieur" items={equipmentInterior} />
          <EquipmentCategory title="Extérieur" items={equipmentExterior} />
          <EquipmentCategory title="Services inclus — domicile" items={includedServicesHome} />
          <EquipmentCategory title="Services inclus — collection" items={includedServicesCollection} />
          <EquipmentCategory title="Services à la carte" items={aLaCarteServices} />
        </div>
      </LegalModal>
    </>
  );
}
