"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useLocale } from "@/contexts/LocaleContext";
import { BookingCard } from "@/components/espace-client/BookingCard";
import { CalendarX } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { KayvilaEmptyState, KayvilaTenantWidget } from "@/components/ui/pro";
import Link from "next/link";
import { Skeleton } from "@/components/espace-client/tenant-ui";
import { TenantPageHeader } from "@/components/espace-client/TenantPageHeader";
import { UpcomingStayHero } from "@/components/espace-client/UpcomingStayHero";
import { TenantQuickLinks } from "@/components/espace-client/TenantQuickLinks";
import { TenantShareBar } from "@/components/espace-client/TenantShareBar";
import { RequestList } from "@/components/espace-client/RequestList";
import { LocalGuide } from "@/components/espace-client/LocalGuide";
import { PracticalInfoCard } from "@/components/espace-client/PracticalInfoCard";
import { CheckoutInstructions } from "@/components/espace-client/CheckoutInstructions";
import { VillaCoverImage } from "@/components/ui/villa-cover-image";
import { pickVillaImageUrl } from "@/lib/villa-image";
import { tenantBookingsOrFilter } from "@/lib/booking-tenant";

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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EspaceClientPage() {
  const { t } = useLocale();
  const supabase = getSupabaseBrowser();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
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
        .or(tenantBookingsOrFilter(session.user.id, email))
        .order("start_date", { ascending: false });

      if (!data || data.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const villaIds = [...new Set(data.map((b: any) => b.villa_id))];
      const { data: villas } = await supabase
        .from("villas")
        .select(
          "id, name, location, image_url, image_urls, wifi_name, wifi_password, welcome_booklet_url, check_out_time, checkout_instructions"
        )
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
    })();
  }, [supabase]);

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const upcomingBooking = bookings.find(
    (b) => b.status === "confirmed" && new Date(b.end_date) > new Date()
  );
  const otherBookings = bookings.filter(
    (b) => b.id !== upcomingBooking?.id && b.status !== "pending"
  );
  const pastBookings = bookings.filter((b) => new Date(b.end_date) < new Date());

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
          <div className="grid gap-3 sm:grid-cols-2 min-w-0">
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
      <div className="space-y-8">
        <TenantPageHeader firstName={firstName} avatarUrl={avatarUrl} />

        <KayvilaEmptyState
          icon={<CalendarX className="size-12" strokeWidth={1.5} />}
          title={t("client.no_bookings")}
          description={t("client.dashboard_no_bookings_desc")}
          actionLabel={t("client.dashboard_discover_villas")}
          actionHref="/villas"
        />

        <KayvilaTenantWidget
          title={t("client.concierge")}
          description={t("client.dashboard_concierge_prompt")}
          action={
            <Link
              href="/espace-client/messagerie"
              className="inline-flex min-h-[44px] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold no-underline transition-colors hover:text-navy"
            >
              <KayvilaPngIcon name="message" size={18} alt="" aria-hidden />
              {t("client.dashboard_contact")}
            </Link>
          }
        >
          <p className="text-sm text-navy/55">
            {t("client.dashboard_concierge_response_time")}
          </p>
        </KayvilaTenantWidget>
      </div>
    );
  }

  // ── Main dashboard ──
  return (
    <div className="space-y-10 min-w-0">
      <TenantPageHeader firstName={firstName} avatarUrl={avatarUrl} />

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
                  {t("client.dashboard_pending_eyebrow")}
                </p>
                <p className="font-display text-[16px] font-normal text-navy leading-snug">
                  {b.villa?.name ?? t("client.dashboard_villa_fallback")}
                </p>
                {b.start_date && b.end_date && (
                  <p className="font-display italic text-[13px] text-navy/55 mt-0.5">
                    {new Date(b.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    {" – "}
                    {new Date(b.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                <p className="text-[11px] text-[rgba(13,27,42,0.45)] mt-2">
                  {t("client.dashboard_pending_processing")}
                </p>
              </div>
              <Link
                href="/espace-client/messagerie"
                className="shrink-0 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[rgba(13,27,42,0.5)] no-underline hover:text-navy transition-colors"
              >
                {t("client.dashboard_pending_contact_team")}
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

      {upcomingBooking ? (
        <>
          <PracticalInfoCard
            villa={upcomingBooking.villa}
            startDate={upcomingBooking.start_date}
            endDate={upcomingBooking.end_date}
            status={upcomingBooking.status}
          />
          <CheckoutInstructions
            endDate={upcomingBooking.end_date}
            checkOutTime={upcomingBooking.villa?.check_out_time ?? undefined}
          />
        </>
      ) : null}

      {/* Demandes en cours */}
      {upcomingBooking && (
        <section className="mt-10">
          <RequestList bookingId={upcomingBooking.id} refreshKey={0} />
        </section>
      )}

      {upcomingBooking ? (
        <section className="space-y-4">
          <TenantQuickLinks />
          <TenantShareBar
            bookingId={upcomingBooking.id}
            villaName={upcomingBooking.villa?.name ?? t("client.dashboard_villa_fallback")}
            startDate={upcomingBooking.start_date}
            endDate={upcomingBooking.end_date}
            address={upcomingBooking.villa?.location}
          />
        </section>
      ) : null}

      {/* Autres réservations */}
      {otherBookings.length > 0 && (
        <div className="space-y-4">
          {upcomingBooking && (
            <p className="text-[10px] tracking-[0.38em] uppercase text-navy/25">
              {t("client.dashboard_history")}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 min-w-0">
            {otherBookings.map((booking) => {
              const isPast = new Date(booking.end_date) < new Date();
              return (
                <div key={booking.id} className="min-w-0 space-y-3">
                  <BookingCard booking={booking} />
                  {isPast && (
                    <Link
                      href={`/villas/${booking.villa_id}`}
                      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 bg-gold px-6 text-[11px] font-bold uppercase tracking-[0.22em] text-white no-underline transition-colors hover:bg-gold/90 active:scale-[0.98]"
                    >
                      {t("client.dashboard_rebook")}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ré-réservation */}
      {pastBookings.length > 0 && similarVillas.length > 0 ? (
        <KayvilaTenantWidget title={t("client.dashboard_come_back_title")} description={t("client.dashboard_come_back_desc")}>
          <div className="grid gap-4 sm:grid-cols-3 min-w-0">
            {similarVillas.map((v: { id: string; name: string; location?: string; image_url?: string; price_per_night: number }) => (
              <Link
                key={v.id}
                href={`/villas/${v.id}`}
                className="group min-w-0 overflow-hidden border border-navy/10 bg-white no-underline transition-colors hover:border-gold/30"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-navy/5">
                  <VillaCoverImage
                    src={pickVillaImageUrl(v.image_url, null)}
                    alt={v.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="min-w-0 p-4">
                  <h3 className="truncate font-display text-sm text-navy transition-colors group-hover:text-gold">{v.name}</h3>
                  {v.location ? (
                    <p className="mt-0.5 truncate text-[11px] text-navy/55">{v.location}</p>
                  ) : null}
                  <p className="mt-2 text-sm font-semibold text-navy">
                    {v.price_per_night}€
                    <span className="text-[10px] font-normal text-navy/55">{t("client.dashboard_per_night")}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </KayvilaTenantWidget>
      ) : null}

      {/* Guide local */}
      {(upcomingBooking || pastBookings.length > 0) && <LocalGuide />}

      {/* Raccourcis conciergerie — uniquement quand TenantQuickLinks n'est pas affiché */}
      {!upcomingBooking && (
      <KayvilaTenantWidget title={t("client.dashboard_services_title")}>
        <div className="grid gap-0 sm:grid-cols-2 sm:divide-x sm:divide-navy/6">
          <Link
            href="/espace-client/messagerie"
            className="group flex min-h-[88px] items-center gap-4 border-b border-navy/6 px-2 py-4 no-underline transition-colors hover:bg-gold/[0.03] sm:border-b-0"
          >
            <KayvilaPngIcon
              name="message"
              size={18}
              alt=""
              className="shrink-0 opacity-60 transition-opacity group-hover:opacity-90"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-navy">{t("client.messages")}</p>
              <p className="mt-0.5 font-display text-sm italic text-navy/50">{t("client.dashboard_messaging_desc")}</p>
            </div>
            <KayvilaPngIcon name="arrow-right" size={18} alt="" className="shrink-0 opacity-60 transition-opacity group-hover:opacity-80" aria-hidden />
          </Link>
          <Link
            href="/espace-client/profil"
            className="group flex min-h-[88px] items-center gap-4 px-2 py-4 no-underline transition-colors hover:bg-gold/[0.03]"
          >
            <KayvilaPngIcon
              name="book"
              size={18}
              alt=""
              className="shrink-0 opacity-60 transition-opacity group-hover:opacity-90"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-navy">{t("client.my_profile")}</p>
              <p className="mt-0.5 font-display text-sm italic text-navy/50">{t("client.dashboard_profile_desc")}</p>
            </div>
            <KayvilaPngIcon name="arrow-right" size={18} alt="" className="shrink-0 opacity-60 transition-opacity group-hover:opacity-80" aria-hidden />
          </Link>
        </div>
      </KayvilaTenantWidget>
      )}
    </div>
  );
}
