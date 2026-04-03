"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { BookingCard } from "@/components/espace-client/BookingCard";
import { TenantAvatar } from "@/components/espace-client/TenantAvatar";
import { CalendarX, ArrowRight, MessageCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import { Skeleton, Card, Chip, Button, ProgressBar, Separator } from "@heroui/react";
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
function villaHeroSrc(booking: { villa?: { image_url?: string | null; image_urls?: string[] | null } }) {
  const v = booking.villa;
  if (!v) return "/villa-hero.jpg";
  if (v.image_url) return v.image_url;
  const first = v.image_urls?.[0];
  return first || "/villa-hero.jpg";
}

function UpcomingStayHero({ booking }: { booking: any }) {
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / 86400000);
  const nights = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  const isToday = daysUntil <= 0 && Date.now() < endDate.getTime();
  const heroImg = villaHeroSrc(booking);

  // Progress: 0% = 30+ days, 100% = today
  const maxDays = 30;
  const progressValue = isToday ? 100 : Math.max(0, Math.round(((maxDays - daysUntil) / maxDays) * 100));

  return (
    <Card className="overflow-hidden border border-navy/10 bg-navy shadow-none rounded-none p-0">
      <Card.Content className="p-0 relative">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('${heroImg.replace(/'/g, "%27")}')` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/80 to-transparent" aria-hidden />

        <div className="relative z-10 p-6 md:p-8">
          <Chip
            size="sm"
            variant="soft"
            color={isToday ? "success" : "accent"}
            className="mb-4 uppercase text-[9px] font-bold tracking-[0.35em]"
          >
            {isToday ? "Séjour en cours" : `Prochain séjour · J-${daysUntil}`}
          </Chip>

          <h2 className="font-display text-2xl md:text-3xl text-white mb-1">
            {booking.villa?.name ?? "Villa Diamant Noir"}
          </h2>
          {booking.villa?.location && (
            <p className="text-sm text-white/45 mb-4 tracking-wide">
              {booking.villa.location}, Martinique
            </p>
          )}

          <Separator className="mb-6 max-w-md bg-white/15" />

          <div className="flex flex-wrap gap-8 mb-5">
            {[
              {
                label: "Arrivée",
                value: startDate.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              },
              {
                label: "Départ",
                value: endDate.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              },
              { label: "Durée", value: `${nights} nuit${nights > 1 ? "s" : ""}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30 mb-1">
                  {label}
                </p>
                <p className="text-sm font-medium text-white">{value}</p>
              </div>
            ))}
          </div>

          {!isToday && daysUntil <= maxDays && (
            <ProgressBar
              value={progressValue}
              minValue={0}
              maxValue={100}
              aria-label={`J-${daysUntil}`}
              className="mb-6 max-w-xs"
            >
              <ProgressBar.Track className="bg-white/10 h-1 rounded-full">
                <ProgressBar.Fill className="bg-gold h-full rounded-full" style={{ width: `${progressValue}%` }} />
              </ProgressBar.Track>
            </ProgressBar>
          )}

          <div className="flex flex-wrap gap-3">
            <Link href={`/espace-client/reservations/${booking.id}`} className="no-underline">
              <Button
                size="sm"
                variant="secondary"
                className="rounded-none bg-white/10 text-white border border-white/20 hover:bg-white hover:text-navy uppercase text-[10px] font-bold tracking-[0.25em] px-5 py-2.5 gap-2"
              >
                <BookOpen size={13} strokeWidth={1.25} />
                Livret d&apos;accueil
              </Button>
            </Link>
            <Link href="/espace-client/messagerie" className="no-underline">
              <Button
                size="sm"
                variant="ghost"
                className="rounded-none text-white/80 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/10 uppercase text-[10px] font-bold tracking-[0.25em] px-5 py-2.5 gap-2"
              >
                <MessageCircle size={13} strokeWidth={1.25} />
                Conciergerie
              </Button>
            </Link>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EspaceClientPage() {
  const supabase = getSupabaseBrowser();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
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
      setIsAuthed(true);
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
  if (!isAuthed) {
    return (
      <Card className="border border-navy/10 bg-white shadow-none rounded-none">
        <Card.Content className="px-8 py-14 text-center space-y-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-navy/30">Espace Client</p>
          <p className="font-display text-xl text-navy">Connexion requise</p>
          <p className="text-sm text-navy/50 max-w-md mx-auto">
            Connectez-vous pour voir vos réservations et votre livret d’accueil.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/login?redirect=/espace-client" className="no-underline">
              <Button
                variant="primary"
                className="rounded-none uppercase text-[10px] font-bold tracking-[0.25em] px-6"
              >
                Se connecter
              </Button>
            </Link>
            <Link href="/villas" className="no-underline">
              <Button
                variant="outline"
                className="rounded-none border-navy/25 text-navy uppercase text-[10px] font-bold tracking-[0.25em] px-6"
              >
                Voir les villas
              </Button>
            </Link>
          </div>
        </Card.Content>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <>
        <PageTopbar title="Mon Séjour" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-navy/30">Espace Client</p>
            <h1 className="font-display text-2xl text-navy mt-1">
              Bonjour{firstName ? `, ${firstName}` : ""}
            </h1>
            <span className="mt-2 block h-px w-10 bg-gold/50" />
          </div>
          <TenantAvatar name={firstName} url={avatarUrl} size="lg" className="border border-navy/10 shrink-0" />
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
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-navy/30 mb-1">
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
    <div className="space-y-10">
      {/* Header personnalisé */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-navy/30">Espace Client</p>
            <h1 className="font-display text-2xl text-navy mt-1">
              Bonjour{firstName ? `, ${firstName}` : ""}
            </h1>
            <span className="mt-2 block h-px w-10 bg-gold/50" />
          </div>
          <TenantAvatar name={firstName} url={avatarUrl} size="lg" className="border border-navy/10 shrink-0" />
        </div>

        {/* Stats bar */}
        <div className="flex gap-3 mt-4">
          <Card className="border border-navy/8 bg-white shadow-none rounded-none flex-1">
            <Card.Content className="p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-navy/30">Séjours</p>
              <p className="text-lg font-bold text-navy mt-0.5">{bookings.length}</p>
            </Card.Content>
          </Card>
          <Card className="border border-navy/8 bg-white shadow-none rounded-none flex-1">
            <Card.Content className="p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-navy/30">Nuits</p>
              <p className="text-lg font-bold text-navy mt-0.5">{totalNights}</p>
            </Card.Content>
          </Card>
          {daysUntil !== null && daysUntil > 0 && (
            <Card className="border border-gold/20 bg-gold/[0.03] shadow-none rounded-none flex-1">
              <Card.Content className="p-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-navy/30">Prochain</p>
                <p className="text-lg font-bold text-gold mt-0.5">J-{daysUntil}</p>
              </Card.Content>
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
            <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-navy/30">
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
      <div className="grid gap-3 sm:grid-cols-2 border-t border-navy/8 pt-8">
        <Link href="/espace-client/messagerie" className="no-underline">
          <Card className="border border-navy/8 bg-white shadow-none rounded-none hover:border-navy/20 hover:bg-navy/[0.02] transition-all h-full cursor-pointer">
            <Card.Content className="p-5 flex items-center gap-4">
              <MessageCircle size={20} strokeWidth={1} className="text-navy/25 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-navy mb-0.5">
                  Messagerie SAV
                </p>
                <p className="text-xs text-navy/40">Contacter la conciergerie</p>
              </div>
              <ArrowRight size={14} strokeWidth={1} className="text-navy/20 shrink-0" />
            </Card.Content>
          </Card>
        </Link>

        <Link href="/espace-client/profil" className="no-underline">
          <Card className="border border-navy/8 bg-white shadow-none rounded-none hover:border-navy/20 hover:bg-navy/[0.02] transition-all h-full cursor-pointer">
            <Card.Content className="p-5 flex items-center gap-4">
              <BookOpen size={20} strokeWidth={1} className="text-navy/25 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-navy mb-0.5">
                  Mon profil
                </p>
                <p className="text-xs text-navy/40">Informations personnelles</p>
              </div>
              <ArrowRight size={14} strokeWidth={1} className="text-navy/20 shrink-0" />
            </Card.Content>
          </Card>
        </Link>
      </div>
    </div>
    </>
  );
}
