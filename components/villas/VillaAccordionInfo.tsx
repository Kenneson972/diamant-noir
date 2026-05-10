"use client";

import { useState } from "react";

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="pt-10 border-t border-navy/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <h2 className="font-display font-normal text-2xl text-navy">{title}</h2>
        <span
          className={`text-navy/40 text-xs transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      {open && <div className="mt-6">{children}</div>}
    </section>
  );
}

type VillaExtraInfoProps = {
  checkInTime: string;
  checkOutTime: string;
  houseRules?: string | null;
  cancellationPolicy?: string | null;
  safetyInfo?: string | null;
};

export function VillaAccordionInfo({
  checkInTime,
  checkOutTime,
  houseRules,
  cancellationPolicy,
  safetyInfo,
}: VillaExtraInfoProps) {
  const hasHouseRules = houseRules && houseRules !== "";
  const hasCancellation = cancellationPolicy && cancellationPolicy !== "";
  const hasSafety = safetyInfo && safetyInfo !== "";

  return (
    <AccordionSection title="Informations complémentaires">
      <div className="grid sm:grid-cols-2 gap-10">
        {hasHouseRules && (
          <div>
            <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">
              Règlement
            </h4>
            <p className="text-navy/60 text-sm leading-relaxed whitespace-pre-line">
              {houseRules}
            </p>
          </div>
        )}
        {hasCancellation && (
          <div>
            <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">
              Annulation
            </h4>
            <p className="text-navy/60 text-sm leading-relaxed whitespace-pre-line">
              {cancellationPolicy}
            </p>
          </div>
        )}
        {hasSafety && (
          <div>
            <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">
              Sécurité
            </h4>
            <p className="text-navy/60 text-sm leading-relaxed whitespace-pre-line">
              {safetyInfo}
            </p>
          </div>
        )}
      </div>
    </AccordionSection>
  );
}
