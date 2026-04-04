"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SEJOUR_KEYS = new Set(["sejour", "voyageur", "voyageurs"]);

/**
 * Sur `/` avec `?pour=` :
 * - propriétaire(s) → reste sur `/`, scroll vers `#offre-proprietaire`
 * - locataire(s) → reste sur `/`, scroll vers `#locataire`
 * - séjour / voyageur (hors locataire explicite) → `/villas` (catalogue unique)
 */
export function HomeAudienceScroll() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pour = searchParams.get("pour");

  useEffect(() => {
    if (!pour) return;
    const key = pour.toLowerCase();

    if (key === "proprietaire" || key === "proprietaires") {
      router.replace("/");
      const id = "offre-proprietaire";
      const run = () => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(run);
      });
      return;
    }

    if (key === "locataire" || key === "locataires") {
      router.replace("/");
      const id = "locataire";
      const run = () => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(run);
      });
      return;
    }

    if (!SEJOUR_KEYS.has(key)) return;

    router.replace("/villas");
  }, [pour, router]);

  return null;
}
