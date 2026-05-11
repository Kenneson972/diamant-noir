import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ExternalLink,
  Home,
  MapPin,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("villas")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (!data?.name) {
    return { title: "Villa — Administration Kayvila" };
  }
  return {
    title: `${data.name} — Administration Kayvila`,
    description: `Fiche villa admin — ${data.name}`,
  };
}

async function getVilla(id: string) {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("villas")
    .select(
      "id, name, location, description, price_per_night, capacity, image_url, owner_id, is_published, airbnb_url, ical_url, created_at, commission_rate"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export default async function AdminVillaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const villa = await getVilla(id);
  if (!villa) notFound();

  const publicHref = `/villas/${villa.id}`;
  const editorHref = `/dashboard/villas/${villa.id}`;

  return (
    <div className="space-y-8 font-body-dashboard">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/admin/villas"
            className="inline-flex items-center gap-2 text-sm text-navy/50 transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Toutes les villas
          </Link>
          <h1 className="font-display-dashboard text-2xl font-semibold tracking-tight text-navy md:text-3xl">
            {villa.name}
          </h1>
          <p className="flex items-center gap-2 text-sm text-navy/55">
            <MapPin className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            {villa.location ?? "Martinique"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              villa.is_published
                ? "bg-emerald-50 text-emerald-800"
                : "bg-navy/5 text-navy/60"
            )}
          >
            {villa.is_published ? "Publiée" : "Brouillon"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-sm lg:col-span-2">
          <div className="relative aspect-[21/9] w-full bg-gradient-to-br from-navy/[0.06] via-offwhite to-gold/10">
            {villa.image_url ? (
              <Image
                src={villa.image_url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                aria-hidden
              >
                <Home className="h-16 w-16 text-navy/12" strokeWidth={1} />
              </div>
            )}
          </div>
          <div className="space-y-4 p-6 md:p-8">
            <h2 className="dashboard-eyebrow">Résumé</h2>
            {villa.description ? (
              <p className="text-sm leading-relaxed text-navy/70">
                {villa.description.length > 500
                  ? `${villa.description.slice(0, 500)}…`
                  : villa.description}
              </p>
            ) : (
              <p className="text-sm text-navy/40">
                Aucune description renseignée. Complétez-la dans l&apos;éditeur
                complet.
              </p>
            )}
            <dl className="grid gap-3 border-t border-navy/8 pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-navy/35">
                  Prix / nuit
                </dt>
                <dd className="mt-1 font-medium text-navy">
                  {Number(villa.price_per_night).toLocaleString("fr-FR")} €
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-navy/35">
                  Capacité
                </dt>
                <dd className="mt-1 font-medium text-navy">
                  {villa.capacity} pers.
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-navy/35">
                  Commission
                </dt>
                <dd className="mt-1 font-medium text-navy">
                  {villa.commission_rate != null
                    ? `${villa.commission_rate}%`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-navy/35">
                  Propriétaire (user id)
                </dt>
                <dd className="mt-1 font-mono text-xs text-navy/60 break-all">
                  {villa.owner_id ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-display-dashboard text-sm font-semibold text-navy">
              Actions
            </h2>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href={editorHref}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-gold/90"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Éditeur complet (hub classique)
                </Link>
                <p className="mt-2 text-xs text-navy/45">
                  Calendrier, médias, équipements, iCal, tarifs saisonniers.
                </p>
              </li>
              <li>
                <a
                  href={publicHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm font-medium text-navy transition-colors hover:border-gold hover:text-gold"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Voir sur le site
                </a>
              </li>
              <li>
                <Link
                  href="/admin/sync-ota"
                  className="flex items-center justify-center gap-2 rounded-xl border border-navy/15 px-4 py-3 text-sm font-medium text-navy transition-colors hover:border-gold hover:text-gold"
                >
                  <Zap className="h-4 w-4" aria-hidden />
                  Sync OTA
                </Link>
              </li>
            </ul>
          </div>

          {(villa.airbnb_url || villa.ical_url) && (
            <div className="rounded-2xl border border-navy/8 bg-navy/[0.02] p-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-navy/40">
                Connexions
              </h3>
              {villa.airbnb_url && (
                <p className="mt-3 text-xs">
                  <span className="text-navy/50">Airbnb : </span>
                  <a
                    href={villa.airbnb_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-gold underline-offset-2 hover:underline"
                  >
                    Lien
                  </a>
                </p>
              )}
              {villa.ical_url && (
                <p className="mt-2 text-xs">
                  <span className="text-navy/50">iCal : </span>
                  <span className="break-all font-mono text-[11px] text-navy/70">
                    {villa.ical_url}
                  </span>
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
