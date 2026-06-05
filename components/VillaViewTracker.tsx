"use client";

import { useEffect } from "react";

export function VillaViewTracker({ villaId }: { villaId: string }) {
  useEffect(() => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(villaId);
    if (!isUUID) return;
    fetch("/api/analytics/villa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ villaId, eventType: "view" }),
    }).catch(() => {});
  }, [villaId]);
  return null;
}
