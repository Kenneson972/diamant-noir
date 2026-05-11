import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ExternalLink, MapPin, Check, X } from "lucide-react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";

export const metadata: Metadata = {
  title: "Hub Classique — Administration Kayvila",
};

export default async function AdminHubClassiquePage() {
  const supabase = await getSupabaseServer();
  const { data: villas } = await supabase
    .from("villas")
    .select("id, name, location, image_url, price_per_night, capacity, is_published, collection_tier, owner_id")
    .order("name");

  const villaIds = (villas ?? []).map((v) => v.id);
  const { data: bookings } = villaIds.length > 0
    ? await supabase.from("bookings").select("villa_id, total_price_cents, status").in("villa_id", villaIds)
    : { data: [] };

  const bookingByVilla: Record<string, any[]> = {};
  (bookings ?? []).forEach((b: any) => {
    if (!bookingByVilla[b.villa_id]) bookingByVilla[b.villa_id] = [];
    bookingByVilla[b.villa_id].push(b);
  });

  return (
    <div className="space-y-6">
      <AdminPageIntro title="Hub Classique" description="Toutes les villas et leurs performances." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(villas ?? []).map((v: any) => {
          const vBookings = bookingByVilla[v.id] ?? [];
          const confirmedRevenue = vBookings
            .filter((b: any) => b.status === "confirmed")
            .reduce((s: number, b: any) => s + (b.total_price_cents ?? 0), 0) / 100;
          const bookingCount = vBookings.length;

          return (
            <div key={v.id} className="border border-navy/10 bg-white overflow-hidden">
              {v.image_url ? (
                <img src={v.image_url} alt={v.name} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-navy/5 flex items-center justify-center">
                  <Building2 size={32} className="text-navy/15" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-base text-navy">{v.name}</h3>
                    {v.location && (
                      <p className="flex items-center gap-1 text-[11px] text-navy/40 mt-0.5">
                        <MapPin size={10} /> {v.location}
                      </p>
                    )}
                  </div>
                  {v.is_published ? (
                    <Check size={14} className="text-emerald-500 shrink-0" />
                  ) : (
                    <X size={14} className="text-red-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-navy/50">
                  <span>{v.price_per_night}€/nuit</span>
                  <span>·</span>
                  <span>{v.capacity} pers.</span>
                  {v.collection_tier && <><span>·</span><span className="text-gold">{v.collection_tier}</span></>}
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-navy/40">{bookingCount} résa{bookingCount !== 1 ? "s" : ""}</span>
                  <span className="font-semibold text-navy">{confirmedRevenue.toLocaleString("fr-FR")}€</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href={`/admin/villas/${v.id}`}
                    className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/50 hover:text-navy transition-colors">
                    Éditer
                  </Link>
                  <Link href={`/villas/${v.id}`} target="_blank"
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gold hover:text-gold/70 transition-colors">
                    Voir <ExternalLink size={9} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
