// lib/owner-digest.ts
// Payload digest quotidien par propriétaire — consommé par le cron n8n (Bot B).

import type { OwnerContextPack } from "@/lib/owner-assistant-context";
import { ownerInsights } from "@/lib/owner-assistant-reply";

export type OwnerDigestItem = {
  owner_id: string;
  context: {
    portfolio: OwnerContextPack["portfolio"];
    today: OwnerContextPack["today"];
    alerts_count: number;
    insights: ReturnType<typeof ownerInsights>;
  };
};

export function buildOwnerDigestItem(ownerId: string, pack: OwnerContextPack): OwnerDigestItem {
  return {
    owner_id: ownerId,
    context: {
      portfolio: pack.portfolio,
      today: pack.today,
      alerts_count: pack.alerts.length,
      insights: ownerInsights(pack),
    },
  };
}
