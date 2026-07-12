"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { WelcomeBook } from "@/components/espace-client/WelcomeBook";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import Link from "next/link";
import { formatCurrency, getBookingPriceCents } from "@/lib/utils";
import { getRefundAmountCents } from "@/lib/refund-policy";
import { bookingBelongsToTenant } from "@/lib/booking-tenant";
import { AddToCalendar } from "@/components/booking/AddToCalendar";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  BreadcrumbsRow,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  Separator,
  Skeleton,
  linkAsButtonClasses,
} from "@/components/espace-client/tenant-ui";
import { useLocale } from "@/contexts/LocaleContext";

function getNights(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-48 rounded-md" />
      <Skeleton className="h-px w-10 rounded-none" />
      <div className="space-y-5 border border-navy/8 bg-white p-6">
        <Skeleton className="h-7 w-56 rounded-md" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-14 rounded-md" />
              <Skeleton className="h-4 w-full max-w-[8rem] rounded-md" />
              <Skeleton className="h-4 w-full max-w-[6rem] rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-40 w-full rounded-none border border-navy/8" />
    </div>
  );
}

function statusChipProps(
  status: string,
  t: (key: string) => string
): { color: "success" | "warning" | "danger" | "default"; label: string } {
  switch (status) {
    case "confirmed":
      return { color: "success", label: t("client.reservation_detail_status_confirmed") };
    case "pending":
      return { color: "warning", label: t("client.reservation_detail_status_pending") };
    case "cancelled":
      return { color: "danger", label: t("client.reservation_detail_status_cancelled") };
    default:
      return { color: "default", label: status };
  }
}

export default function ReservationDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [data, setData] = useState<{ booking: any; villa: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelStep, setCancelStep] = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !params?.id) return;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        router.replace("/login?redirect=/espace-client");
        return;
      }

      const { data: bookingRaw, error: bookingError } = await supabase
        .from("bookings")
        .select("id, villa_id, start_date, end_date, status, price, total_price_cents, guest_name, guest_email, client_user_id")
        .eq("id", params.id as string)
        .single();

      const booking = bookingRaw as any;
      if (bookingError || !booking) {
        setError(t("client.reservation_detail_not_found"));
        setLoading(false);
        return;
      }
      if (!bookingBelongsToTenant(booking, session.user)) {
        setError(t("client.reservation_detail_unauthorized"));
        setLoading(false);
        return;
      }

      const { data: villaRaw } = await supabase
        .from("villas")
        .select(
          "id, name, location, wifi_name, wifi_password, checkout_instructions, local_recommendations, emergency_contacts"
        )
        .eq("id", booking.villa_id)
        .maybeSingle();
      const villa = villaRaw as any;

      setData({ booking, villa });
      setLoading(false);
    })();
  }, [supabase, params?.id, router, t]);

  if (loading) return <DetailSkeleton />;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-10">
        <Alert status="danger" className="rounded-none border-red-200">
          <AlertTitle>{t("client.reservation_detail_error_title")}</AlertTitle>
          <AlertDescription>{error ?? t("client.reservation_detail_unexpected_error")}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Link
            href="/espace-client"
            className="text-[10px] font-bold uppercase tracking-widest text-gold transition-colors hover:text-navy"
          >
            {t("client.reservation_detail_back_to_bookings")}
          </Link>
        </div>
      </div>
    );
  }

  const { booking, villa } = data;
  const nights = getNights(booking.start_date, booking.end_date);
  const isConfirmed = booking.status === "confirmed";
  const chipStatus = statusChipProps(booking.status, t);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCancellable =
    ["confirmed", "pending"].includes(booking.status) &&
    new Date(booking.start_date) > today;

  const totalCents = getBookingPriceCents(booking);
  const refundCents = getRefundAmountCents(totalCents, booking.start_date);

  async function handleCancel() {
    setCancelStep("loading");
    setCancelError(null);
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("client.reservation_detail_cancel_error_fallback"));
      setData((prev) => prev ? { ...prev, booking: { ...prev.booking, status: "cancelled" } } : prev);
      setCancelStep("done");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : t("client.reservation_detail_cancel_error_fallback"));
      setCancelStep("confirm");
    }
  }

  return (
    <div className="space-y-6">
      <BreadcrumbsRow
        className="text-[10px] uppercase tracking-[0.2em] text-navy/55"
        items={[
          { href: "/espace-client", label: t("nav.client_space") },
          { label: t("client.reservation_detail_breadcrumb") },
        ]}
      />

      <Link
        href="/espace-client"
        className={linkAsButtonClasses(
          "outline",
          "sm",
          "rounded-none border-navy/20 text-navy/50 no-underline hover:border-navy hover:text-navy gap-2"
        )}
      >
        <ArrowLeft size={13} strokeWidth={1.5} />
        {t("client.reservation_detail_back_link")}
      </Link>

      <span className="block h-px w-10 bg-gold/50" />

      {/* Booking summary */}
      <Card className="rounded-none border border-navy/8 bg-white shadow-none">
        <CardHeader className="px-6 pb-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <CardTitle className="font-display text-xl font-normal text-navy">
              {villa?.name ?? t("client.reservation_detail_stay_fallback")}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Chip color={chipStatus.color} className="uppercase">
                {chipStatus.label}
              </Chip>
              {booking.price ? (
                <Chip color="secondary" className="uppercase">
                  {formatCurrency(getBookingPriceCents(booking))}
                </Chip>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="px-6 py-5">
          <div className="grid gap-6 text-sm sm:grid-cols-3">
            {/* Dates */}
            <div className="flex items-start gap-3">
              <KayvilaPngIcon name="calendar" size={18} alt="" className="mt-0.5 shrink-0" />
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30">{t("client.reservation_detail_dates_label")}</p>
                <p className="text-navy">
                  {new Date(booking.start_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-navy/50">
                  →{" "}
                  {new Date(booking.end_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-0.5 text-xs text-navy/30">
                  {nights} {nights > 1 ? t("common.nights_plural") : t("common.nights")}
                </p>
              </div>
            </div>

            {/* Location */}
            {villa?.location && (
              <div className="flex items-start gap-3">
                <KayvilaPngIcon name="location" size={18} alt="" className="mt-0.5 shrink-0" />
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30">{t("client.reservation_detail_location_label")}</p>
                  <p className="text-navy break-words">{villa.location}</p>
                  <p className="text-xs text-navy/55">{t("client.reservation_detail_martinique")}</p>
                </div>
              </div>
            )}
          </div>

          {isConfirmed ? (
            <div className="mt-6 border-t border-navy/8 pt-5">
              <AddToCalendar
                villaName={villa?.name ?? t("client.dashboard_villa_fallback")}
                startDate={booking.start_date}
                endDate={booking.end_date}
                address={villa?.location ?? undefined}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isConfirmed && villa ? (
        <WelcomeBook villa={villa} />
      ) : (
        <Card className="rounded-none border border-navy/8 bg-white shadow-none">
          <CardContent className="p-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/25">
              {t("client.reservation_detail_welcome_book_pending")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Annulation ── */}
      {isCancellable && cancelStep !== "done" && (
        <Card className="rounded-none border border-red-200/60 bg-red-50/30 shadow-none">
          <CardContent className="p-5 space-y-4">
            {cancelStep === "idle" && (
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-navy/80">{t("client.reservation_detail_cancel_prompt")}</p>
                <button
                  type="button"
                  onClick={() => setCancelStep("confirm")}
                  className="shrink-0 text-[10px] font-bold uppercase tracking-[0.25em] text-red-600 transition-colors hover:text-red-800"
                >
                  {t("client.reservation_detail_cancel_cta")}
                </button>
              </div>
            )}

            {(cancelStep === "confirm" || cancelStep === "loading") && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-navy">{t("client.reservation_detail_cancel_confirm_title")}</p>
                    <p className="text-xs text-navy/80">
                      {t("client.reservation_detail_cancel_confirm_desc")}
                    </p>
                    {refundCents !== null ? (
                      <p className="text-xs text-navy/70">
                        {t("client.reservation_detail_refund_estimate")}{" "}
                        <span className="font-semibold text-navy">
                          {refundCents > 0 ? formatCurrency(refundCents) : t("client.reservation_detail_refund_none")}
                        </span>
                        {refundCents > 0 && totalCents > 0 ? (
                          <span className="text-navy/50">
                            {" "}
                            ({Math.round((refundCents / totalCents) * 100)}{t("client.reservation_detail_refund_percent_of_paid")})
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </div>

                {cancelError && (
                  <Alert status="danger" className="rounded-none">
                    <AlertDescription>{cancelError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelStep === "loading"}
                    className="inline-flex items-center gap-2 border border-red-500 bg-red-500 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    {cancelStep === "loading" ? t("client.reservation_detail_cancel_loading") : t("client.reservation_detail_cancel_confirm_yes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCancelStep("idle"); setCancelError(null); }}
                    disabled={cancelStep === "loading"}
                    className="inline-flex items-center gap-2 border border-navy/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/80 transition-colors hover:border-navy hover:text-navy disabled:opacity-50"
                  >
                    {t("client.reservation_detail_cancel_keep")}
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {cancelStep === "done" && (
        <Alert status="success" className="rounded-none">
          <AlertTitle>{t("client.reservation_detail_cancelled_title")}</AlertTitle>
          <AlertDescription>
            {t("client.reservation_detail_cancelled_desc")}
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-none border border-gold/15 bg-gold/[0.03] shadow-none">
        <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-navy/80">{t("client.sav_prompt")}</p>
          <Link
            href="/espace-client/messagerie"
            className="shrink-0 text-[10px] font-bold uppercase tracking-[0.25em] text-gold no-underline transition-colors hover:text-navy"
          >
            {t("client.contact_sav")} →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
