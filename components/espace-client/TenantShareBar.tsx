"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@heroui/react";
import { AddToCalendar } from "@/components/booking/AddToCalendar";

type TenantShareBarProps = {
  bookingId: string;
  villaName: string;
  startDate: string;
  endDate: string;
  address?: string | null;
};

export function TenantShareBar({
  bookingId,
  villaName,
  startDate,
  endDate,
  address,
}: TenantShareBarProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/booking/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      await navigator.clipboard.writeText(json.shareUrl);
      showToast("Lien copié — valide 7 jours pour vos co-voyageurs.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Impossible de générer le lien");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-wrap items-center gap-3">
      <AddToCalendar
        villaName={villaName}
        startDate={startDate}
        endDate={endDate}
        address={address ?? undefined}
        className="inline-flex min-h-[44px] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-navy/50 transition-colors hover:text-navy"
      />
      <Button
        variant="ghost"
        size="sm"
        isPending={loading}
        onPress={handleShare}
        className="min-h-[44px] text-[10px] font-bold uppercase tracking-[0.18em] text-navy/50 data-[hover=true]:text-navy"
      >
        <Share2 size={14} aria-hidden />
        Partager le séjour
      </Button>
      {toast ? (
        <p
          role="status"
          className="w-full border border-gold/25 bg-gold/[0.06] px-4 py-2.5 text-xs text-navy sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-auto sm:min-w-[280px]"
        >
          {toast}
        </p>
      ) : null}
    </div>
  );
}
