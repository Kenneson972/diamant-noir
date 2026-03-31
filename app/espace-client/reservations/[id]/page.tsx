"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { WelcomeBook } from "@/components/espace-client/WelcomeBook";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getNights(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-48 rounded-md" />
      <Skeleton className="h-px w-10 rounded-none" />
      <div className="border border-navy/8 bg-white p-6 space-y-5">
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
    case "confirmed": return { color: "success", label: "Confirmée" };
    case "pending": return { color: "warning", label: "En attente" };
    case "cancelled": return { color: "danger", label: "Annulée" };
    default: return { color: "default", label: status };
  }
}

function chipClass(color: "success" | "warning" | "danger" | "default") {
  switch (color) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "danger":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-navy/10 bg-offwhite text-navy/60";
  }
}

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [data, setData] = useState<{ booking: any; villa: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="py-10 space-y-6 max-w-lg mx-auto">
        <div className="rounded-none border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <p className="font-display text-sm mb-1">Impossible d&apos;afficher la réservation</p>
          <p className="text-sm">{error ?? "Erreur inattendue."}</p>
        </div>
        <div className="text-center">
          <Link
            href="/espace-client"
            className="text-[10px] font-bold uppercase tracking-widest text-gold hover:text-navy transition-colors"
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

  return (
    <div className="space-y-6">
      <nav className="text-[10px] uppercase tracking-[0.2em] text-navy/40" aria-label="Fil d’Ariane">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/espace-client" className="hover:text-navy transition-colors">
              Espace client
            </Link>
          </li>
          <li className="text-navy/20">/</li>
          <li className="text-navy/50">Livret séjour</li>
        </ol>
      </nav>

      <Link href="/espace-client" className="inline-block no-underline">
        <Button
          variant="outline"
          size="sm"
          className="rounded-none border-navy/20 text-navy/50 hover:border-navy hover:text-navy gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Mes réservations
        </Button>
      </Link>

      <span className="block h-px w-10 bg-gold/50" />

      {/* Booking summary */}
      <Card className="border border-navy/8 bg-white shadow-none rounded-none">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <CardTitle className="font-display text-xl text-navy font-normal">
              {villa?.name ?? "Votre séjour"}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-1 uppercase text-[9px] font-bold tracking-[0.2em] ${chipClass(chipStatus.color)}`}
              >
                {chipStatus.label}
              </span>
              {booking.price && (
                <span className="inline-flex items-center rounded-full border border-navy/10 bg-offwhite px-2 py-1 uppercase text-[9px] font-bold tracking-[0.2em] text-navy/70">
                  {Number(booking.price).toLocaleString("fr-FR")} €
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <div className="h-px w-full bg-navy/10" />

        <CardContent className="px-6 py-5">
          <div className="grid gap-6 sm:grid-cols-3 text-sm">
            {/* Dates */}
            <div className="flex items-start gap-3">
              <Calendar size={14} strokeWidth={1.25} className="text-gold mt-0.5 shrink-0" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-navy/30 mb-1.5">Dates</p>
                <p className="text-navy">
                  {new Date(booking.start_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-navy/50">
                  → {new Date(booking.end_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-navy/30 text-xs mt-0.5">
                  {nights} nuit{nights > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Location */}
            {villa?.location && (
              <div className="flex items-start gap-3">
                <MapPin size={14} strokeWidth={1.25} className="text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-navy/30 mb-1.5">Lieu</p>
                  <p className="text-navy">{villa.location}</p>
                  <p className="text-navy/40 text-xs">Martinique</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Livret d'accueil */}
      {isConfirmed && villa ? (
        <WelcomeBook villa={villa} />
      ) : (
        <Card className="border border-navy/8 bg-white shadow-none rounded-none">
          <CardContent className="p-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/25">
              Livret d&apos;accueil disponible une fois la réservation confirmée
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lien messagerie */}
      <Card className="border border-gold/15 bg-gold/[0.03] shadow-none rounded-none">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-navy/55">Un problème ou une question sur votre séjour ?</p>
          <Link
            href="/espace-client/messagerie"
            className="shrink-0 text-[10px] font-bold uppercase tracking-[0.25em] text-gold hover:text-navy transition-colors no-underline"
          >
            Contacter le SAV →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
