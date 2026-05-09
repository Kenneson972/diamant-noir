"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { WelcomeBook } from "@/components/espace-client/WelcomeBook";
import { ArrowLeft, Calendar, MapPin, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatCurrency, getBookingPriceCents } from "@/lib/utils";
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

function statusChipProps(status: string): { color: "success" | "warning" | "danger" | "default"; label: string } {
  switch (status) {
    case "confirmed":
      return { color: "success", label: "Confirmée" };
    case "pending":
      return { color: "warning", label: "En attente" };
    case "cancelled":
      return { color: "danger", label: "Annulée" };
    default:
      return { color: "default", label: status };
  }
}

export default function ReservationDetailPage() {
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

      const email = session.user.email;

      const { data: bookingRaw, error: bookingError } = await supabase
        .from("bookings")
        .select("id, villa_id, start_date, end_date, status, price, guest_name, guest_email")
        .eq("id", params.id as string)
        .single();

      const booking = bookingRaw as any;
      if (bookingError || !booking) {
        setError("Réservation introuvable.");
        setLoading(false);
        return;
      }
      if (booking.guest_email !== email) {
        setError("Accès non autorisé.");
        setLoading(false);
        return;
      }

      const { data: villaRaw } = await supabase
        .from("villas")
        .select(
          "id, name, location, wifi_name, wifi_password, checkout_instructions, local_recommendations, emergency_contacts"
        )
        .eq("id", booking.villa_id)
        .single();
      const villa = villaRaw as any;

      setData({ booking, villa });
      setLoading(false);
    })();
  }, [supabase, params?.id, router]);

  if (loading) return <DetailSkeleton />;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-10">
        <Alert status="danger" className="rounded-none border-red-200">
          <AlertTitle>Impossible d&apos;afficher la réservation</AlertTitle>
          <AlertDescription>{error ?? "Erreur inattendue."}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Link
            href="/espace-client"
            className="text-[10px] font-bold uppercase tracking-widest text-gold transition-colors hover:text-navy"
          >
            ← Retour aux réservations
          </Link>
        </div>
      </div>
    );
  }

  const { booking, villa } = data;
  const nights = getNights(booking.start_date, booking.end_date);
  const isConfirmed = booking.status === "confirmed";
  const chipStatus = statusChipProps(booking.status);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCancellable =
    ["confirmed", "pending"].includes(booking.status) &&
    new Date(booking.start_date) > today;

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
      if (!res.ok) throw new Error(json.error ?? "Erreur inconnue");
      setData((prev) => prev ? { ...prev, booking: { ...prev.booking, status: "cancelled" } } : prev);
      setCancelStep("done");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Erreur inconnue");
      setCancelStep("confirm");
    }
  }

  return (
    <div className="space-y-6">
      <BreadcrumbsRow
        className="text-[10px] uppercase tracking-[0.2em] text-navy/40"
        items={[
          { href: "/espace-client", label: "Espace client" },
          { label: "Livret séjour" },
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
        Mes réservations
      </Link>

      <span className="block h-px w-10 bg-gold/50" />

      {/* Booking summary */}
      <Card className="rounded-none border border-navy/8 bg-white shadow-none">
        <CardHeader className="px-6 pb-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <CardTitle className="font-display text-xl font-normal text-navy">
              {villa?.name ?? "Votre séjour"}
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
              <Calendar size={14} strokeWidth={1.25} className="mt-0.5 shrink-0 text-gold" />
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30">Dates</p>
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
                  {nights} nuit{nights > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Location */}
            {villa?.location && (
              <div className="flex items-start gap-3">
                <MapPin size={14} strokeWidth={1.25} className="mt-0.5 shrink-0 text-gold" />
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30">Lieu</p>
                  <p className="text-navy">{villa.location}</p>
                  <p className="text-xs text-navy/40">Martinique</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isConfirmed && villa ? (
        <WelcomeBook villa={villa} />
      ) : (
        <Card className="rounded-none border border-navy/8 bg-white shadow-none">
          <CardContent className="p-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/25">
              Livret d&apos;accueil disponible une fois la réservation confirmée
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
                <p className="text-sm text-navy/55">Vous souhaitez annuler cette réservation ?</p>
                <button
                  type="button"
                  onClick={() => setCancelStep("confirm")}
                  className="shrink-0 text-[10px] font-bold uppercase tracking-[0.25em] text-red-600 transition-colors hover:text-red-800"
                >
                  Annuler ma réservation →
                </button>
              </div>
            )}

            {(cancelStep === "confirm" || cancelStep === "loading") && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-navy">Confirmer l&apos;annulation</p>
                    <p className="text-xs text-navy/60">
                      Cette action est irréversible. Votre réservation sera marquée comme annulée.
                      Consultez les conditions d&apos;annulation de la villa pour le remboursement.
                    </p>
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
                    {cancelStep === "loading" ? "Annulation…" : "Oui, annuler"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCancelStep("idle"); setCancelError(null); }}
                    disabled={cancelStep === "loading"}
                    className="inline-flex items-center gap-2 border border-navy/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/60 transition-colors hover:border-navy hover:text-navy disabled:opacity-50"
                  >
                    Conserver
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {cancelStep === "done" && (
        <Alert status="success" className="rounded-none">
          <AlertTitle>Réservation annulée</AlertTitle>
          <AlertDescription>
            Votre réservation a bien été annulée. Contactez-nous pour toute question sur le remboursement.
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-none border border-gold/15 bg-gold/[0.03] shadow-none">
        <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-navy/55">Un problème ou une question sur votre séjour ?</p>
          <Link
            href="/espace-client/messagerie"
            className="shrink-0 text-[10px] font-bold uppercase tracking-[0.25em] text-gold no-underline transition-colors hover:text-navy"
          >
            Contacter le SAV →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
