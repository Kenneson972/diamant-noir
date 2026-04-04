"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { BookingCard } from "@/components/espace-client/BookingCard";
import { TenantAvatar } from "@/components/espace-client/TenantAvatar";
import { CalendarX, ArrowRight, MessageCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import { Skeleton, Card, Button } from "@heroui/react";
import { PageTopbar } from "@/components/espace-client/PageTopbar";

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function BookingCardSkeleton() {
  return (
    <div className="border border-navy/8 bg-white overflow-hidden">
      <Skeleton className="aspect-[16/7] w-full rounded-none" />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>
        <Skeleton className="h-3 w-3/4 rounded-md" />
        <div className="border-t border-navy/5 pt-3 flex justify-between items-center">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// ─── Hero upcoming stay ───────────────────────────────────────────────────────

function UpcomingStayHero({ booking }: { booking: any }) {
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / 86400000);
  const nights = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  const isToday = daysUntil <= 0 && Date.now() < endDate.getTime();

  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  return (
    <div
      className="bg-white border border-[rgba(13,27,42,0.07)] flex flex-col sm:flex-row sm:items-stretch gap-0 overflow-hidden"
      style={{ borderTop: "2px solid #D4AF37" }}
    >
      <div className="flex-1 min-w-0 px-7 py-8">
        <p className="text-[9px] tracking-[0.32em] uppercase text-[#D4AF37] mb-4">
          {isToday ? "Séjour en cours" : "Votre prochain séjour"}
        </p>
        <h2 className="font-display text-[22px] font-normal text-[#0D1B2A] leading-snug mb-2">
          {booking.villa?.name ?? "Villa Diamant Noir"}
        </h2>
        {booking.villa?.location && (
          <p className="font-cormorant italic text-[15px] font-light text-[rgba(13,27,42,0.32)] mb-0.5">
            {booking.villa.location}, Martinique
          </p>
        )}
        <p className="font-cormorant italic text-[15px] font-light text-[rgba(13,27,42,0.4)] mb-7">
          {fmt(startDate)} – {fmt(endDate)} · {nights} nuit{nights > 1 ? "s" : ""}
        </p>
        <Link
          href="/espace-client/livret"
          className="inline-flex items-center gap-2 text-[9px] tracking-[0.22em] uppercase text-[#D4AF37] hover:text-[rgba(212,175,55,0.7)] transition-colors no-underline"
        >
          Consulter le livret
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="hidden sm:block w-px self-stretch bg-[rgba(13,27,42,0.06)]" />
      <div className="sm:hidden h-px mx-7 bg-[rgba(13,27,42,0.06)]" />

      <div className="px-7 py-8 flex flex-col items-start sm:items-center justify-center gap-1.5 shrink-0 sm:min-w-[120px]">
        <p
          className="font-display font-normal text-[#0D1B2A] leading-none"
          style={{ fontSize: "48px", letterSpacing: "-0.02em" }}
        >
          {isToday ? "✦" : Math.max(0, daysUntil)}
        </p>
        <p className="text-[9px] tracking-[0.28em] uppercase text-[rgba(13,27,42,0.28)]">
          {isToday ? "en cours" : "jours"}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EspaceClientPage() {
  const supabase = getSupabaseBrowser();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
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
      setFirstName(session.user.user_metadata?.full_name?.split(" ")[0]);
      setAvatarUrl(session.user.user_metadata?.avatar_url);

      const { data } = await supabase
        .from("bookings")
        .select("id, villa_id, start_date, end_date, status, price, guest_name")
        .eq("guest_email", email)
        .order("start_date", { ascending: false });

      if (!data || data.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const villaIds = [...new Set(data.map((b: any) => b.villa_id))];
      const { data: villas } = await supabase
        .from("villas")
        .select("id, name, location, image_url, image_urls")
        .in("id", villaIds);

      const villaMap = Object.fromEntries((villas || []).map((v: any) => [v.id, v]));
      setBookings(data.map((b: any) => ({ ...b, villa: villaMap[b.villa_id] })));
      setLoading(false);
    })();
  }, [supabase]);

  const upcomingBooking = bookings.find(
    (b) => b.status === "confirmed" && new Date(b.end_date) > new Date()
  );
  const otherBookings = bookings.filter((b) => b.id !== upcomingBooking?.id);

  const totalNights = bookings.reduce((acc, b) => {
    const nights = Math.round((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000);
    return acc + nights;
  }, 0);
  const daysUntil = upcomingBooking
    ? Math.ceil((new Date(upcomingBooking.start_date).getTime() - Date.now()) / 86400000)
    : null;

  // ── Skeleton ──
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="h-9 w-56 max-w-full rounded-md" />
            <Skeleton className="h-px w-10 rounded-none mt-2" />
            <div className="flex gap-3 mt-4">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          </div>
          <Skeleton className="size-11 shrink-0 rounded-full" />
        </div>
        <Skeleton className="h-52 w-full rounded-none" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-md mb-4" />
          <div className="grid gap-3 sm:grid-cols-2">
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (bookings.length === 0) {
    return (
      <>
        <PageTopbar title="Mon Séjour" />
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-navy/25">Espace Client</p>
            <h1 className="font-display text-3xl font-normal text-navy mt-2 leading-none">
              Bonjour{firstName ? `, ${firstName}` : ""}
            </h1>
            <span className="mt-3 block h-px w-8 bg-gold/60" />
          </div>
          <TenantAvatar name={firstName} url={avatarUrl} size="lg" className="border border-navy/10 shrink-0 mt-1" />
        </div>

        <Card className="border border-navy/8 bg-white shadow-none rounded-none">
          <Card.Content className="px-8 py-16 flex flex-col items-center text-center gap-5">
            <CalendarX size={40} className="text-navy/15" strokeWidth={1} />
            <div>
              <p className="font-display text-lg text-navy mb-1">Aucune réservation</p>
              <p className="text-sm text-navy/45 max-w-xs">
                Vous n&apos;avez pas encore de séjour enregistré à cette adresse.
              </p>
            </div>
            <Link
              href="/villas"
              className="no-underline"
            >
              <Button
                variant="outline"
                className="rounded-none border-navy text-navy hover:bg-navy hover:text-white gap-2 text-[10px] font-bold uppercase tracking-[0.25em] px-6 py-3 h-auto"
              >
                Découvrir nos villas
                <ArrowRight size={12} strokeWidth={1.5} />
              </Button>
            </Link>
          </Card.Content>
        </Card>

        <Card className="border border-gold/15 bg-gold/[0.03] shadow-none rounded-none">
          <Card.Content className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30 mb-1">
                Conciergerie
              </p>
              <p className="text-sm text-navy/60">
                Besoin d&apos;aide pour préparer votre séjour ?
              </p>
            </div>
            <Link
              href="/espace-client/messagerie"
              className="shrink-0 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-gold hover:text-navy transition-colors no-underline"
            >
              <MessageCircle size={13} strokeWidth={1.25} />
              Contacter le SAV
            </Link>
          </Card.Content>
        </Card>
      </div>
      </>
    );
  }

  // ── Main dashboard ──
  return (
    <>
      <PageTopbar
        title="Mon Séjour"
        badge={daysUntil !== null && daysUntil > 0 ? `J — ${daysUntil}` : undefined}
      />
    <div className="space-y-12">
      {/* Header personnalisé */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-navy/25">Espace Client</p>
            <h1 className="font-display text-3xl font-normal text-navy mt-2 leading-none">
              Bonjour{firstName ? `, ${firstName}` : ""}
            </h1>
            <span className="mt-3 block h-px w-8 bg-gold/60" />
          </div>
          <TenantAvatar name={firstName} url={avatarUrl} size="lg" className="border border-navy/10 shrink-0 mt-1" />
        </div>

        {/* Stats — ligne éditoriale */}
        <div className="flex items-center gap-7 mt-6 pt-6 border-t border-navy/8">
          <div>
            <p className="font-display font-normal text-[26px] text-navy leading-none">{bookings.length}</p>
            <p className="text-[9px] tracking-[0.32em] uppercase text-navy/30 mt-1.5">Séjour{bookings.length > 1 ? "s" : ""}</p>
          </div>
          <div className="w-px h-9 bg-navy/10" />
          <div>
            <p className="font-display font-normal text-[26px] text-navy leading-none">{totalNights}</p>
            <p className="text-[9px] tracking-[0.32em] uppercase text-navy/30 mt-1.5">Nuit{totalNights > 1 ? "s" : ""}</p>
          </div>
          {daysUntil !== null && daysUntil > 0 && (
            <>
              <div className="w-px h-9 bg-navy/10" />
              <div>
                <p className="font-display font-normal text-[26px] text-gold leading-none">J–{daysUntil}</p>
                <p className="text-[9px] tracking-[0.32em] uppercase text-navy/30 mt-1.5">Prochain séjour</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hero — prochain séjour */}
      {upcomingBooking && <UpcomingStayHero booking={upcomingBooking} />}

      {/* Accès rapide */}
      {upcomingBooking && (
        <div>
          <p className="text-[9px] tracking-[0.38em] uppercase text-navy/25 mb-4">Accès rapide</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 border border-[rgba(13,27,42,0.07)]">
            {[
              {
                label: "Checklist",
                sub: "Avant l'arrivée",
                href: "/espace-client/checklist",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <rect x="2.5" y="2.5" width="13" height="13" rx="1" stroke="currentColor" strokeWidth="1" />
                    <path d="M6 6h6M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                label: "Wi-Fi",
                sub: "Code & réseau",
                href: "/espace-client/livret",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <path d="M1.5 7c2-2.2 4.8-3.5 7.5-3.5s5.5 1.3 7.5 3.5M5 10.5c1.1-1.2 2.5-1.9 4-1.9s2.9.7 4 1.9M9 14.5h.01" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                label: "Calendrier",
                sub: "Ajouter au planning",
                href: "/espace-client/checklist",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <rect x="2.5" y="3.5" width="13" height="12" rx="1" stroke="currentColor" strokeWidth="1" />
                    <path d="M2.5 8h13M6 2.5v2M12 2.5v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                label: "Livret PDF",
                sub: "Télécharger",
                href: "/espace-client/livret/print",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <path d="M4 2h8l4 4v10H4z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                    <path d="M12 2v4h4M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                ),
              },
            ].map(({ label, sub, href, icon }) => (
              <Link
                key={label}
                href={href}
                className={[
                  "group flex flex-col gap-3 px-5 py-6 min-h-[110px]",
                  "border-l border-[rgba(13,27,42,0.07)] first:border-l-0",
                  "hover:bg-[rgba(212,175,55,0.03)] transition-colors duration-200 no-underline",
                ].join(" ")}
              >
                <span className="text-[rgba(13,27,42,0.22)] group-hover:text-[rgba(212,175,55,0.7)] transition-colors duration-200">
                  {icon}
                </span>
                <span>
                  <span className="block text-[10px] tracking-[0.22em] uppercase text-[#0D1B2A] font-medium mb-1">
                    {label}
                  </span>
                  <span className="font-cormorant italic text-[13px] font-light text-[rgba(13,27,42,0.35)]">
                    {sub}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Autres réservations */}
      {otherBookings.length > 0 && (
        <div className="space-y-4">
          {upcomingBooking && (
            <p className="text-[9px] tracking-[0.38em] uppercase text-navy/25">
              Historique
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {otherBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <div>
        <p className="text-[9px] tracking-[0.38em] uppercase text-navy/25 mb-4">Services</p>
        <div className="grid gap-[1px] sm:grid-cols-2 bg-[rgba(13,27,42,0.07)]">
          <Link href="/espace-client/messagerie" className="group no-underline bg-white hover:bg-[rgba(212,175,55,0.025)] transition-colors duration-200">
            <div className="px-6 py-5 flex items-center gap-4">
              <MessageCircle size={18} strokeWidth={1} className="text-navy/20 group-hover:text-[rgba(212,175,55,0.6)] shrink-0 transition-colors duration-200" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-navy">
                  Messagerie
                </p>
                <p className="font-cormorant italic text-[13px] font-light text-navy/35 mt-0.5">Contacter la conciergerie</p>
              </div>
              <ArrowRight size={13} strokeWidth={1} className="text-navy/15 group-hover:text-navy/30 shrink-0 transition-colors duration-200" />
            </div>
          </Link>

          <Link href="/espace-client/profil" className="group no-underline bg-white hover:bg-[rgba(212,175,55,0.025)] transition-colors duration-200">
            <div className="px-6 py-5 flex items-center gap-4">
              <BookOpen size={18} strokeWidth={1} className="text-navy/20 group-hover:text-[rgba(212,175,55,0.6)] shrink-0 transition-colors duration-200" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-navy">
                  Mon profil
                </p>
                <p className="font-cormorant italic text-[13px] font-light text-navy/35 mt-0.5">Informations personnelles</p>
              </div>
              <ArrowRight size={13} strokeWidth={1} className="text-navy/15 group-hover:text-navy/30 shrink-0 transition-colors duration-200" />
            </div>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
