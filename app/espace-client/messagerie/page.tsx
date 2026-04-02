"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseBrowser } from "@/lib/supabase";
import { PageTopbar } from "@/components/espace-client/PageTopbar";

// ── Lazy load TenantChatbot (ssr: false — uses localStorage + browser APIs) ───

function ChatLoadingDots() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#FAFAF8]">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="dn-typing-dot w-2 h-2 rounded-full bg-[rgba(13,27,42,0.15)]"
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingData {
  id: string;
  start_date: string;
  end_date: string;
  villa_id: string;
  villa: { name: string } | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

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
        .eq("guest_email", email)
        .in("status", ["confirmed", "upcoming"])
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
        const { data: villaRaw } = await supabase
          .from("villas")
          .select("name")
          .eq("id", bk.villa_id)
          .single();

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
        <div className="flex-1 flex items-center justify-center bg-[#FAFAF8]">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="dn-typing-dot w-2 h-2 rounded-full bg-[rgba(13,27,42,0.15)]"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageTopbar title="Messagerie" />

      {/* Bandeau contexte villa */}
      {booking && (
        <div className="flex items-center gap-4 px-6 py-3 border-b border-[rgba(13,27,42,0.06)] bg-white shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M8 1L1 5v9h5V9h4v5h5V5L8 1z"
              stroke="#0D1B2A"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <p className="text-[8px] tracking-[0.2em] uppercase text-[rgba(13,27,42,0.5)]">
              {booking.villa?.name ?? "Villa Diamant Noir"}
            </p>
            <p className="font-cormorant italic text-[12px] font-light text-[rgba(13,27,42,0.4)]">
              {fmt(booking.start_date)} → {fmt(booking.end_date)}
            </p>
          </div>
          <span className="ml-auto text-[7px] tracking-[0.18em] uppercase text-[rgba(13,27,42,0.3)]">
            Réponse sous 2 h
          </span>
        </div>
      )}

      {/* Chat — lazy loaded */}
      <div className="flex-1 min-h-0 overflow-hidden">
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
