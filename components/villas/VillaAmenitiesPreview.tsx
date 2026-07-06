"use client";

import { useState } from "react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { LegalModal } from "@/components/legal/LegalModal";
import { buildAmenitiesPreview, getEquipmentIcon } from "@/lib/villa-amenities-preview";

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
