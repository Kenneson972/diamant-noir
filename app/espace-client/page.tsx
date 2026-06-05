"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getSupabaseBrowser } from "@/lib/supabase";
import { BookingCard } from "@/components/espace-client/BookingCard";
import { TenantAvatar } from "@/components/espace-client/TenantAvatar";
import { CalendarX, ArrowRight, MessageCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import { Skeleton, Card, CardContent, linkAsButtonClasses } from "@/components/espace-client/tenant-ui";
import { PageTopbar } from "@/components/espace-client/PageTopbar";
import { RequestList } from "@/components/espace-client/RequestList";
import { ReviewForm } from "@/components/espace-client/ReviewForm";
import { downloadICS } from "@/lib/generate-ics";

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
      className="border border-navy/[0.07] border-t-2 border-t-gold bg-white flex flex-col sm:flex-row sm:items-stretch gap-0 overflow-hidden"
    >
      <div className="flex-1 min-w-0 px-7 py-8">
        <p className="text-[11px] tracking-[0.2em] uppercase text-gold mb-4">
          {isToday ? "Séjour en cours" : "Votre prochain séjour"}
        </p>
        <h2 className="font-display text-[22px] font-normal text-navy leading-snug mb-2">
          {booking.villa?.name ?? "Villa Kayvila"}
        </h2>
        {booking.villa?.location && (
          <p className="font-display italic text-[15px] font-light text-navy/50 mb-0.5">
            {booking.villa.location}, Martinique
          </p>
        )}
        <p className="font-display italic text-[15px] font-light text-navy/55 mb-7">
          {fmt(startDate)} – {fmt(endDate)} · {nights} nuit{nights > 1 ? "s" : ""}
        </p>
        <Link
          href="/espace-client/livret"
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-gold hover:text-gold/70 transition-colors no-underline"
        >
          Consulter le livret
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="hidden sm:block w-px self-stretch bg-navy/[0.06]" />
      <div className="sm:hidden h-px mx-7 bg-navy/[0.06]" />

      <div className="px-7 py-8 flex flex-col items-start sm:items-center justify-center gap-1.5 shrink-0 sm:min-w-[120px]">
        <p
          className="font-display font-normal text-navy leading-none"
          style={{ fontSize: "48px", letterSpacing: "-0.02em" }}
        >
          {isToday ? "✦" : Math.max(0, daysUntil)}
        </p>
        <p className="text-[11px] tracking-[0.15em] uppercase text-navy/50">
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
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [similarVillas, setSimilarVillas] = useState<any[]>([]);
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
      const enriched = data.map((b: any) => ({ ...b, villa: villaMap[b.villa_id] }));
      setBookings(enriched);
      const pastVillaIds = enriched
        .filter((b: any) => new Date(b.end_date) < new Date())
        .map((b: any) => b.villa_id)
        .filter(Boolean);
      if (pastVillaIds.length > 0) {
        const { data: similar } = await supabase
          .from("villas")
          .select("id, name, location, image_url, capacity, price_per_night")
          .neq("id", pastVillaIds[0])
          .eq("is_published", true)
          .limit(3);
        setSimilarVillas((similar ?? []) as any[]);
      }
      setLoading(false);
      // Fetch already-reviewed bookings
      const { data: existingReviews } = await supabase
        .from("reviews")
        .select("booking_id")
        .eq("guest_id", session.user.id);
      if (existingReviews) {
        setReviewedBookingIds(new Set(existingReviews.map((r: any) => r.booking_id)));
      }
    })();
  }, [supabase]);

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const upcomingBooking = bookings.find(
    (b) => b.status === "confirmed" && new Date(b.end_date) > new Date()
  );
  const otherBookings = bookings.filter(
    (b) => b.id !== upcomingBooking?.id && b.status !== "pending"
  );

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

        <Card className="rounded-none border border-navy/8 bg-white shadow-none">
          <CardContent className="flex flex-col items-center gap-5 px-8 py-16 text-center">
            <CalendarX size={40} className="text-navy/15" strokeWidth={1} />
            <div>
              <p className="mb-1 font-display text-lg text-navy">Aucune réservation</p>
              <p className="max-w-xs text-sm text-navy/45">
                Vous n&apos;avez pas encore de séjour enregistré à cette adresse.
              </p>
            </div>
            <Link
              href="/villas"
              className={linkAsButtonClasses("outline", "md", "rounded-none border-navy gap-2 no-underline hover:bg-navy hover:text-white")}
            >
              Découvrir nos villas
              <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-gold/15 bg-gold/[0.03] shadow-none">
          <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
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
              className="inline-flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-gold no-underline transition-colors hover:text-navy"
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
            <p className="text-[10px] tracking-[0.32em] uppercase text-navy/30 mt-1.5">Séjour{bookings.length > 1 ? "s" : ""}</p>
          </div>
          <div className="w-px h-9 bg-navy/10" />
          <div>
            <p className="font-display font-normal text-[26px] text-navy leading-none">{totalNights}</p>
            <p className="text-[10px] tracking-[0.32em] uppercase text-navy/30 mt-1.5">Nuit{totalNights > 1 ? "s" : ""}</p>
          </div>
          {daysUntil !== null && daysUntil > 0 && (
            <>
              <div className="w-px h-9 bg-navy/10" />
              <div>
                <p className="font-display font-normal text-[26px] text-gold leading-none">J–{daysUntil}</p>
                <p className="text-[10px] tracking-[0.32em] uppercase text-navy/30 mt-1.5">Prochain séjour</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Réservations en attente de confirmation */}
      {pendingBookings.length > 0 && (
        <div className="space-y-3">
          {pendingBookings.map((b) => (
            <div
              key={b.id}
              className="border border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.04)] px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-gold mb-1">
                  En attente de confirmation
                </p>
                <p className="font-display text-[16px] font-normal text-navy leading-snug">
                  {b.villa?.name ?? "Villa Kayvila"}
                </p>
                {b.start_date && b.end_date && (
                  <p className="font-display italic text-[13px] text-navy/55 mt-0.5">
                    {new Date(b.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    {" – "}
                    {new Date(b.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                <p className="text-[11px] text-[rgba(13,27,42,0.45)] mt-2">
                  Notre équipe traite votre demande et vous recontacte sous 24h.
                </p>
              </div>
              <Link
                href="/espace-client/messagerie"
                className="shrink-0 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[rgba(13,27,42,0.5)] no-underline hover:text-navy transition-colors"
              >
                Contacter l&apos;équipe
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                  <path d="M1.5 5.5h8M6.5 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Hero — prochain séjour */}
      {upcomingBooking && <UpcomingStayHero booking={upcomingBooking} />}

      {/* Demandes en cours */}
      {upcomingBooking && (
        <section className="mt-10">
          <RequestList bookingId={upcomingBooking.id} refreshKey={0} />
        </section>
      )}

      {/* Accès rapide */}
      {upcomingBooking && (
        <div>
          <p className="text-[10px] tracking-[0.38em] uppercase text-navy/25 mb-4">Accès rapide</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 border border-navy/[0.07]">
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
                  "group flex flex-col gap-3 px-3 py-4 xs:px-5 xs:py-6 min-h-[88px] xs:min-h-[110px]",
                  "border-l border-navy/[0.07] first:border-l-0",
                  "hover:bg-[rgba(212,175,55,0.03)] transition-colors duration-200 no-underline",
                ].join(" ")}
              >
                <span className="text-[rgba(13,27,42,0.22)] group-hover:text-gold/70 transition-colors duration-200">
                  {icon}
                </span>
                <span>
                  <span className="block text-[10px] tracking-[0.22em] uppercase text-navy font-medium mb-1">
                    {label}
                  </span>
                  <span className="font-display italic text-[13px] font-light text-[rgba(13,27,42,0.35)]">
                    {sub}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          {/* Calendrier + Partage */}
          <div className="flex items-center gap-4 mt-4">
            <button
              type="button"
              onClick={() => {
                if (upcomingBooking) {
                  downloadICS({
                    villaName: upcomingBooking.villa?.name ?? "Villa Kayvila",
                    startDate: upcomingBooking.start_date,
                    endDate: upcomingBooking.end_date,
                  });
                }
              }}
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/50 hover:text-navy transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="1.5" y="2.5" width="13" height="12" rx="1" stroke="currentColor" strokeWidth="1" />
                <path d="M1.5 6h13M5 1.5v2M11 1.5v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              Ajouter au calendrier
            </button>
            <button
              type="button"
              onClick={() => {
                if (upcomingBooking) {
                  const token = btoa(upcomingBooking.id).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
                  const url = `${window.location.origin}/share/${token}`;
                  navigator.clipboard.writeText(url).then(() => alert("Lien copié ! Partagez-le avec vos co-voyageurs."));
                }
              }}
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/50 hover:text-navy transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="6" cy="8" r="3.5" stroke="currentColor" strokeWidth="1" />
                <path d="M8.5 5.5h4v4M14 3.5l-3.5 3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Partager le séjour
            </button>
          </div>
        </div>
      )}

      {/* Autres réservations */}
      {otherBookings.length > 0 && (
        <div className="space-y-4">
          {upcomingBooking && (
            <p className="text-[10px] tracking-[0.38em] uppercase text-navy/25">
              Historique
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {otherBookings.map((booking) => {
              const isPast = new Date(booking.end_date) < new Date();
              const hasReviewed = reviewedBookingIds.has(booking.id);
              return (
                <div key={booking.id} className="space-y-3">
                  <BookingCard booking={booking} />
                  {isPast && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/villas/${booking.villa_id}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50 hover:text-gold transition-colors"
                      >
                        <ArrowRight size={12} />
                        Re-réserver
                      </Link>
                    </div>
                  )}
                  {isPast && !hasReviewed && (
                    <ReviewForm
                      bookingId={booking.id}
                      villaId={booking.villa_id}
                      onSuccess={() => setReviewedBookingIds((prev) => new Set([...prev, booking.id]))}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Villas similaires */}
      {similarVillas.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] tracking-[0.38em] uppercase text-navy/25">Villas similaires</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {similarVillas.map((v: any) => (
              <Link
                key={v.id}
                href={`/villas/${v.id}`}
                className="group border border-navy/10 bg-white overflow-hidden no-underline hover:border-gold/30 transition-colors"
              >
                <div className="aspect-[16/9] bg-navy/5 overflow-hidden">
                  {v.image_url ? (
                    <Image src={v.image_url} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"  fill />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-navy/10 text-[10px] uppercase">Kayvila</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-sm text-navy group-hover:text-gold transition-colors">{v.name}</h3>
                  {v.location && (
                    <p className="text-[11px] text-navy/55 mt-0.5">{v.location}</p>
                  )}
                  <p className="text-sm font-semibold text-navy mt-2">
                    {v.price_per_night}€<span className="text-[10px] font-normal text-navy/55">/nuit</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <div>
        <p className="text-[10px] tracking-[0.38em] uppercase text-navy/25 mb-4">Services</p>
        <div className="grid gap-[1px] sm:grid-cols-2 bg-[rgba(13,27,42,0.07)]">
          <Link href="/espace-client/messagerie" className="group no-underline bg-white hover:bg-[rgba(212,175,55,0.025)] transition-colors duration-200">
            <div className="px-6 py-5 flex items-center gap-4">
              <MessageCircle size={18} strokeWidth={1} className="text-navy/20 group-hover:text-[rgba(212,175,55,0.6)] shrink-0 transition-colors duration-200" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-navy">
                  Messagerie
                </p>
                <p className="font-display italic text-[13px] font-light text-navy/50 mt-0.5">Contacter la conciergerie</p>
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
                <p className="font-display italic text-[13px] font-light text-navy/50 mt-0.5">Informations personnelles</p>
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
