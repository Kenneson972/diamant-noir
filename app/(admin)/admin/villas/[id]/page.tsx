import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import { VillaPublishChecklist } from "@/components/dashboard/villa-editor/VillaPublishChecklist";
import type { VillaPublishChecklistItem } from "@/components/dashboard/villa-editor/VillaPublishChecklist";
import { AdminVillaEditClient } from "./AdminVillaEditClient";
import type { VillaBookingRow } from "@/components/dashboard/villa-editor/VillaBookingsRegistry";
import { VillaDetailMiniMap } from "@/components/dashboard/admin/VillaDetailMiniMap";
import { VillaThumb } from "@/components/dashboard/admin/VillaThumb";
import { AdminVillaBlocks } from "@/components/dashboard/admin/AdminVillaBlocks";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin()
    .from("villas")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  return {
    title: data?.name
      ? `${data.name} — Administration Kayvila`
      : "Villa — Administration Kayvila",
  };
}

export default async function AdminVillaEditPage({ params }: PageProps) {
  const { id } = await params;

  const [villaResult, bookingsResult] = await Promise.all([
    supabaseAdmin().from("villas").select("*").eq("id", id).single(),
    supabaseAdmin()
      .from("bookings")
      .select("id, guest_name, start_date, end_date, source, price, total_price_cents, payment_status, status")
      .eq("villa_id", id)
      .order("start_date", { ascending: false }),
  ]);

  if (villaResult.error || !villaResult.data) notFound();

  const villa = villaResult.data;
  const bookings: VillaBookingRow[] = (bookingsResult.data ?? []).map((b) => ({
    id: b.id,
    guest_name: b.guest_name,
    start_date: b.start_date,
    end_date: b.end_date,
    source: b.source,
    price: b.price ?? 0,
    total_price_cents: b.total_price_cents,
    payment_status: b.payment_status,
    status: b.status,
  }));

  const checklistItems: VillaPublishChecklistItem[] = [
    { id: "name",  ok: !!villa.name,            label: "Nom renseigné" },
    { id: "price", ok: !!villa.price_per_night,  label: "Prix par nuit défini" },
    { id: "desc",  ok: !!villa.description,      label: "Description rédigée" },
    { id: "img",   ok: !!villa.image_url,        label: "Photo principale" },
    { id: "loc",   ok: !!villa.location,         label: "Localisation" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/villas"
          className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Toutes les villas
        </Link>
        <h1 className="font-display text-2xl font-bold text-navy">{villa.name}</h1>
      </div>

      {/* Layout 2 colonnes */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-8">
          <AdminVillaEditClient
            villa={villa as Record<string, unknown>}
            bookings={bookings}
          />
          {/* Blocages de disponibilités (admin) */}
          <AdminVillaBlocks villaId={villa.id} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <VillaPublishChecklist items={checklistItems} />

          {/* Mini-map sous la disponibilité */}
          {villa.latitude != null && villa.longitude != null ? (
            <div className="rounded-2xl border border-navy/8 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-navy/50">
                Localisation
              </h3>
              <div className="h-[220px] overflow-hidden rounded-xl border border-navy/10 md:h-[280px]">
                <VillaDetailMiniMap
                  latitude={villa.latitude}
                  longitude={villa.longitude}
                  name={villa.name ?? "Villa"}
                />
              </div>
            </div>
          ) : null}

          {/* Historique des réservations */}
          {bookings.length > 0 && (() => {
            const todayDate = new Date().toISOString().slice(0, 10);
            const upcoming = bookings.filter((b) => (b.end_date ?? "") >= todayDate);
            const past = bookings.filter((b) => (b.end_date ?? "") < todayDate);
            const villaImageSrc =
              (villa.image_url as string | null) ??
              (Array.isArray(villa.image_urls)
                ? (villa.image_urls as string[])[0]
                : null);
            return (
              <div className="rounded-2xl border border-navy/8 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-navy/50">
                  Historique
                </h3>
                <div className="space-y-0.5">
                  {[...upcoming, ...past].map((b) => (
                    <div key={b.id} className="flex items-center gap-3 border-b border-navy/8 py-2">
                      <VillaThumb
                        src={villaImageSrc}
                        alt={b.guest_name ?? "Réservation"}
                        size={48}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-navy">{b.guest_name ?? "Client"}</p>
                        <p className="text-[11px] text-navy/50">
                          {b.start_date ? new Date(b.start_date).toLocaleDateString("fr-FR") : "—"}{" "}→{" "}
                          {b.end_date ? new Date(b.end_date).toLocaleDateString("fr-FR") : "—"}
                        </p>
                      </div>
                      <span className="text-[11px] uppercase tracking-wide text-navy/45">{b.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="rounded-2xl border border-navy/8 bg-white p-5 shadow-sm space-y-3">
            <a
              href={`/villas/${villa.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm font-medium text-navy transition-colors hover:border-gold hover:text-gold"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Voir sur le site
            </a>
            <Link
              href="/admin/villas"
              className="block text-center text-xs text-navy/55 hover:text-navy transition-colors"
            >
              ← Retour aux villas
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
