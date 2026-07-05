"use client";

import { useState, type ReactNode } from "react";

type CgvTab = "voyageurs" | "proprietaires";

/** Bascule entre CGV Voyageurs et CGV Propriétaires sur la page /cgv — évite d'empiler les deux textes. */
export function CgvTabs({
  voyageurs,
  proprietaires,
}: {
  voyageurs: ReactNode;
  proprietaires: ReactNode;
}) {
  const [tab, setTab] = useState<CgvTab>("voyageurs");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Choisir les CGV à afficher"
        className="mb-8 inline-flex rounded-full border border-navy/10 bg-navy/[0.03] p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "voyageurs"}
          onClick={() => setTab("voyageurs")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 ${
            tab === "voyageurs" ? "bg-navy text-white" : "text-navy/60 hover:text-navy"
          }`}
        >
          CGV Voyageurs
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "proprietaires"}
          onClick={() => setTab("proprietaires")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 ${
            tab === "proprietaires" ? "bg-navy text-white" : "text-navy/60 hover:text-navy"
          }`}
        >
          CGV Propriétaires
        </button>
      </div>

      <div role="tabpanel">{tab === "voyageurs" ? voyageurs : proprietaires}</div>
    </div>
  );
}
