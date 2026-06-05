"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseBrowser } from "@/lib/supabase";
import { tenantBookingsOrFilter } from "@/lib/booking-tenant";
import { Home } from "lucide-react";
import { Chip } from "@heroui/react";
import { PageTopbar } from "@/components/espace-client/PageTopbar";

function ChatLoadingDots() {
  return (
    <div className="flex-1 flex items-center justify-center bg-offwhite min-h-[400px]">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="dn-typing-dot w-2 h-2 rounded-full bg-navy/15"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

const TenantChatbot = dynamic(
  () =>
    import("@/components/espace-client/TenantChatbot").then((m) => ({
      default: m.TenantChatbot,
    })),
  { ssr: false, loading: () => <ChatLoadingDots /> }
);

interface BookingData {
  id: string;
  start_date: string;
  end_date: string;
  villa_id: string;
  villa: { name: string } | null;
}

export default function MessageriePage() {
  const supabase = getSupabaseBrowser();
  const [userId, setUserId] = useState<string | undefined>();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      const email = session.user.email;
      const name = session.user.user_metadata?.full_name as string | undefined;
      setUserId(session.user.id);
      setUser({ email, name });

      const { data: bookingRaw } = await supabase
        .from("bookings")
        .select("id, start_date, end_date, villa_id, status")
        .or(tenantBookingsOrFilter(session.user.id, email))
        .in("status", ["confirmed", "pending"])
        .gt("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(1);

      const bk = (
        bookingRaw as Array<{
          id: string;
          start_date: string;
          end_date: string;
          villa_id: string;
          status: string;
        }> | null
      )?.[0];

      if (bk) {
        const { data: villaRaw } = await supabase.from("villas").select("name").eq("id", bk.villa_id).single();

        setBooking({
          id: bk.id,
          start_date: bk.start_date,
          end_date: bk.end_date,
          villa_id: bk.villa_id,
          villa: villaRaw as { name: string } | null,
        });
      }

      setLoading(false);
    })();
  }, [supabase]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  if (loading || !user) {
    return (
      <>
        <PageTopbar title="Messagerie" />
        <div className="flex items-center justify-center bg-offwhite min-h-[320px]">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="dn-typing-dot w-2 h-2 rounded-full bg-navy/15"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-[min(100dvh,900px)] flex-col">
      <PageTopbar title="Messagerie" />

      {booking ? (
        <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-navy/6 bg-white px-5 py-3 md:px-6">
          <Home size={16} className="shrink-0 text-gold/80" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/50">
              {booking.villa?.name ?? "Villa Kayvila"}
            </p>
            <p className="font-display text-sm italic text-navy/55">
              {fmt(booking.start_date)} → {fmt(booking.end_date)}
            </p>
          </div>
          <Chip size="sm" variant="soft" color="success" className="uppercase">
            Réponse sous 2 h
          </Chip>
        </div>
      ) : null}

      <div className="flex min-h-[400px] flex-1 flex-col overflow-hidden">
        <TenantChatbot
          guestEmail={user.email}
          guestName={user.name}
          bookingId={booking?.id}
          userId={userId}
        />
      </div>
    </div>
  );
}
