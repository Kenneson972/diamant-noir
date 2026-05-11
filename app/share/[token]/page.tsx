import { getSupabaseServer } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { Wifi, MapPin, Clock, Phone, AlertTriangle } from "lucide-react";

export const metadata = { title: "Séjour partagé — Kayvila" };

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let bookingId: string;
  try {
    bookingId = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    notFound();
  }

  const supabase = await getSupabaseServer();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, start_date, end_date, guest_name, villas(name, location, wifi_name, wifi_password, check_in_time, check_out_time)")
    .eq("id", bookingId)
    .single();

  if (!booking) notFound();

  const v = (booking as any).villas ?? {};
  const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-dvh bg-offwhite">
      <div className="mx-auto max-w-lg px-5 py-12">
        <div className="text-center mb-10">
          <p className="font-display text-xl text-navy">Kayvila</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold mt-1">Séjour partagé</p>
        </div>

        <div className="border border-navy/10 bg-white p-6 space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-1">Villa</p>
            <p className="font-display text-2xl text-navy">{v.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin size={13} className="text-navy/30" />
              <p className="text-sm text-navy/50">{v.location ?? "Martinique"}</p>
            </div>
          </div>

          <div className="h-px bg-navy/8" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/40 mb-1">Arrivée</p>
              <p className="font-display text-lg text-navy">{fmt(booking.start_date)}</p>
              <p className="text-sm text-navy/50 mt-0.5">{v.check_in_time ?? "17:00"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/40 mb-1">Départ</p>
              <p className="font-display text-lg text-navy">{fmt(booking.end_date)}</p>
              <p className="text-sm text-navy/50 mt-0.5">{v.check_out_time ?? "10:00"}</p>
            </div>
          </div>

          {v.wifi_name && (
            <>
              <div className="h-px bg-navy/8" />
              <div className="flex items-center gap-2">
                <Wifi size={15} className="text-navy/30" />
                <div>
                  <p className="text-[11px] text-navy/50">{v.wifi_name}</p>
                  {v.wifi_password && <p className="text-sm text-navy">{v.wifi_password}</p>}
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-navy/8" />

          <p className="text-[11px] text-navy/35 text-center">
            Kayvila Conciergerie — Martinique
          </p>
        </div>
      </div>
    </div>
  );
}
