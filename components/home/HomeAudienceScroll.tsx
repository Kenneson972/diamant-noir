"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SEJOUR_KEYS = new Set(["sejour", "voyageur", "voyageurs"]);

const REVEAL_BOOKING_EVENT = "diamant-reveal-booking";

/**
 * Sur `/` avec `?pour=` :
 * - propriétaire(s) → navigation vers la landing dédiée `/proprietaires`
 * - séjour / voyageur → scroll vers `#reserver-un-sejour`
 */
export function HomeAudienceScroll() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pour = searchParams.get("pour");

  useEffect(() => {
    if (!pour) return;
    const key = pour.toLowerCase();

    if (key === "proprietaire" || key === "proprietaires") {
      router.replace("/proprietaires");
      return;
    }

    if (!SEJOUR_KEYS.has(key)) return;

    const el = document.getElementById("reserver-un-sejour");
    if (!el) return;
    window.history.replaceState(null, "", "#reserver-un-sejour");
    window.dispatchEvent(new Event(REVEAL_BOOKING_EVENT));
    const frame = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [pour, router]);

  return null;
}
