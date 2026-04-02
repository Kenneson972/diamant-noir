"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { BookingCard } from "@/components/espace-client/BookingCard";
import { TenantAvatar } from "@/components/espace-client/TenantAvatar";
import { CalendarX, ArrowRight, MessageCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      className="bg-white border border-[rgba(13,27,42,0.07)] flex flex-col sm:flex-row sm:items-start gap-0"
      style={{ borderTop: "2px solid #D4AF37" }}
    >
      {/* Gauche */}
      <div className="flex-1 min-w-0 px-6 py-6">
        <p className="text-[8px] tracking-[0.26em] uppercase text-[#D4AF37] mb-3">
          {isToday ? "Séjour en cours" : "Votre prochain séjour"}
        </p>
        <h2 className="font-display text-2xl font-normal text-[#0D1B2A] mb-2">
          {booking.villa?.name ?? "Villa Diamant Noir"}
        </h2>
        {booking.villa?.location && (
          <p className="font-cormorant italic text-[14px] font-light text-[rgba(13,27,42,0.35)] mb-1">
            {booking.villa.location}, Martinique
          </p>
        )}
        <p className="font-cormorant italic text-[14px] font-light text-[rgba(13,27,42,0.45)] mb-5">
          {fmt(startDate)} → {fmt(endDate)} · {nights} nuit{nights > 1 ? "s" : ""}
        </p>
        <Link
          href="/espace-client/livret"
          className="text-[8px] tracking-[0.2em] uppercase text-[#D4AF37] hover:opacity-75 transition-opacity"
          style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
        >
          Voir le livret →
        </Link>
      </div>

      {/* Séparateur vertical desktop */}
      <div className="hidden sm:block w-px self-stretch bg-[rgba(13,27,42,0.07)]" />
      {/* Séparateur horizontal mobile */}
      <div className="sm:hidden h-px mx-6 bg-[rgba(13,27,42,0.07)]" />

      {/* Droite — compteur jours */}
      <div className="px-6 py-6 flex flex-col items-start sm:items-end justify-center gap-1 shrink-0 min-w-[100px]">
        <p
          className="font-display font-normal text-[#0D1B2A] leading-none"
          style={{ fontSize: "40px" }}
        >
          {isToday ? "·" : Math.max(0, daysUntil)}
        </p>
        <p className="text-[8px] tracking-[0.2em] uppercase text-[rgba(13,27,42,0.32)]">
          {isToday ? "Séjour en cours" : "jours"}
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

  if (bookings.length === 0) {
    return (
      <>
        <PageTopbar title="Mon Séjour" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/30">Espace Client</p>
            <h1 className="font-display text-2xl text-navy mt-1">
              Bonjour{firstName ? `, ${firstName}` : ""}
            </h1>
            <span className="mt-2 block h-px w-10 bg-gold/50" />
          </div>
          <TenantAvatar name={firstName} url={avatarUrl} size="lg" className="border border-navy/10 shrink-0" />
        </div>

        <Card className="border border-navy/8 bg-white shadow-none rounded-none">
          <CardContent className="px-8 py-16 flex flex-col items-center text-center gap-5">
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
          </CardContent>
        </Card>

        <Card className="border border-gold/15 bg-gold/[0.03] shadow-none rounded-none">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          </CardContent>
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
    <div className="space-y-10">
      {/* Header personnalisé */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/30">Espace Client</p>
            <h1 className="font-display text-2xl text-navy mt-1">
              Bonjour{firstName ? `, ${firstName}` : ""}
            </h1>
            <span className="mt-2 block h-px w-10 bg-gold/50" />
          </div>
          <TenantAvatar name={firstName} url={avatarUrl} size="lg" className="border border-navy/10 shrink-0" />
        </div>

        {/* Stats bar */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:flex">
          <Card className="border border-navy/8 bg-white shadow-none rounded-none flex-1">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30">Séjours</p>
              <p className="text-lg font-bold text-navy mt-0.5">{bookings.length}</p>
            </CardContent>
          </Card>
          <Card className="border border-navy/8 bg-white shadow-none rounded-none flex-1">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30">Nuits</p>
              <p className="text-lg font-bold text-navy mt-0.5">{totalNights}</p>
            </CardContent>
          </Card>
          {daysUntil !== null && daysUntil > 0 && (
            <Card className="border border-gold/20 bg-gold/[0.03] shadow-none rounded-none flex-1">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30">Prochain</p>
                <p className="text-lg font-bold text-gold mt-0.5">J-{daysUntil}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Hero — prochain séjour */}
      {upcomingBooking && <UpcomingStayHero booking={upcomingBooking} />}

      {/* Accès rapide */}
      {upcomingBooking && (
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-[rgba(13,27,42,0.07)]">
          {[
            {
              label: "Avant l'arrivée",
              sub: "Checklist",
              href: "/espace-client/checklist",
              icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1" />
                  <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1" />
                </svg>
              ),
            },
            {
              label: "Wi-Fi",
              sub: "Accès réseau",
              href: "/espace-client/livret",
              icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M1 6c1.9-2 4.5-3 7-3s5.1 1 7 3M4 9.5c1.1-1.1 2.4-1.7 4-1.7s2.9.6 4 1.7M8 13h.01" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              label: "Calendrier",
              sub: "Planifier le séjour",
              href: "/espace-client/checklist",
              icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1" />
                  <path d="M2 7h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1" />
                </svg>
              ),
            },
            {
              label: "PDF Livret",
              sub: "Télécharger",
              href: "/espace-client/livret/print",
              icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 2h7l3 3v9H3z" stroke="currentColor" strokeWidth="1" />
                  <path d="M10 2v3h3M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1" />
                </svg>
              ),
            },
          ].map(({ label, sub, href, icon }) => (
            <Link
              key={label}
              href={href}
              className={[
                "group flex flex-col gap-[10px] px-5 py-5",
                "border-l border-[rgba(13,27,42,0.07)] first:border-l-0",
                "hover:bg-[rgba(13,27,42,0.015)] transition-colors no-underline",
              ].join(" ")}
            >
              <span className="text-[rgba(13,27,42,0.28)] group-hover:text-[rgba(13,27,42,0.5)] transition-colors">
                {icon}
              </span>
              <span className="text-[8px] tracking-[0.2em] uppercase text-[#0D1B2A] font-medium">
                {label}
              </span>
              <span className="font-cormorant italic text-[13px] font-light text-[rgba(13,27,42,0.4)]">
                {sub}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Autres réservations */}
      {otherBookings.length > 0 && (
        <div className="space-y-4">
          {upcomingBooking && (
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-navy/30">
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

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 border-t border-navy/8 pt-7 md:pt-8">
        <Link href="/espace-client/messagerie" className="no-underline">
          <Card className="border border-navy/8 bg-white shadow-none rounded-none hover:border-navy/20 hover:bg-navy/[0.02] transition-all h-full cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <MessageCircle size={20} strokeWidth={1} className="text-navy/25 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-navy mb-0.5">
                  Messagerie SAV
                </p>
                <p className="text-xs text-navy/40">Contacter la conciergerie</p>
              </div>
              <ArrowRight size={14} strokeWidth={1} className="text-navy/20 shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/espace-client/profil" className="no-underline">
          <Card className="border border-navy/8 bg-white shadow-none rounded-none hover:border-navy/20 hover:bg-navy/[0.02] transition-all h-full cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <BookOpen size={20} strokeWidth={1} className="text-navy/25 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-navy mb-0.5">
                  Mon profil
                </p>
                <p className="text-xs text-navy/40">Informations personnelles</p>
              </div>
              <ArrowRight size={14} strokeWidth={1} className="text-navy/20 shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
    </>
  );
}
