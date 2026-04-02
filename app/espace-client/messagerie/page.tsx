"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { TenantChatbot } from "@/components/espace-client/TenantChatbot";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function MessageriePage() {
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [latestBookingId, setLatestBookingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { setLoading(false); return; }

      const email = session.user.email;
      const name = session.user.user_metadata?.full_name;
      setUser({ email, name });

      const { data: bookingData } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("guest_email", email)
        .in("status", ["confirmed", "pending"])
        .order("start_date", { ascending: false })
        .limit(1);

      if (bookingData?.[0]) setLatestBookingId((bookingData[0] as any).id);
      setLoading(false);
    })();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
          <Skeleton className="h-px w-10 rounded-none mt-3" />
        </div>
        <Skeleton
          className="w-full rounded-none border border-navy/8"
          style={{ height: "calc(100dvh - 260px)", minHeight: 400 }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-display text-2xl text-navy">Messagerie SAV</h1>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
            En ligne
          </span>
        </div>
        <p className="text-sm text-navy/40 tracking-wide">Notre équipe vous répond rapidement</p>
        <span className="mt-3 block h-px w-10 bg-gold/50" />
      </div>

      <Card
        className="border border-navy/10 shadow-none rounded-none overflow-hidden"
        style={{ height: "calc(100dvh - 260px)", minHeight: 400 }}
      >
        <CardContent className="p-0 h-full">
          <TenantChatbot
            guestEmail={user!.email}
            guestName={user!.name}
            bookingId={latestBookingId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
