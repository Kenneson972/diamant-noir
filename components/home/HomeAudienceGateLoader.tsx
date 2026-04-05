"use client";

import { useHomeAudience } from "@/contexts/HomeAudienceContext";
import { HomeAudienceGate } from "@/components/home/HomeAudienceGate";

/**
 * Chaque `requestGateReopen()` incrémente `gateReopenSignal` → **nouvelle clé** → remontage du gate.
 * `useLayoutEffect` + `readGateInitialShow()` rejouent alors la logique (plus fiable que seul un effet).
 */
export function HomeAudienceGateLoader() {
  const { gateReopenSignal } = useHomeAudience();
  return <HomeAudienceGate key={gateReopenSignal} />;
}
