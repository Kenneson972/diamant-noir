import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Wifi, MapPin } from "lucide-react";

export const metadata = { title: "Séjour partagé — Kayvila" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveBookingId(token: string): Promise<string | null> {
  if (UUID_RE.test(token)) {
    const admin = supabaseAdmin();
    const { data: share } = await admin
      .from("booking_shares")
      .select("booking_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!share) return null;
    if (new Date(share.expires_at) < new Date()) return null;
    return share.booking_id;
  }

  try {
    return atob(token.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return null;
  }
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const bookingId = await resolveBookingId(token);
  if (!bookingId) notFound();

  const admin = supabaseAdmin();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, start_date, end_date, guest_name, status, villas(name, location, wifi_name, wifi_password, check_in_time, check_out_time)"
    )
    .eq("id", bookingId)
    .single();

  if (!booking || !["confirmed", "pending"].includes(booking.status)) notFound();

  const rawVilla = (booking as { villas?: unknown }).villas;
  const villa =
    ((Array.isArray(rawVilla) ? rawVilla[0] : rawVilla) as Record<string, string | null> | null | undefined) ??
    {};
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-dvh bg-offwhite">
      <div className="mx-auto max-w-lg px-5 py-12">
        <div className="mb-10 text-center">
          <p className="font-display text-xl text-navy">Kayvila</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Séjour partagé</p>
        </div>

        <div className="space-y-6 border border-navy/10 bg-white p-6">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50">Villa</p>
            <p className="font-display text-2xl text-navy">{villa.name}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <MapPin size={13} className="text-navy/30" />
              <p className="text-sm text-navy/50">{villa.location ?? "Martinique"}</p>
            </div>
          </div>

          <div className="h-px bg-navy/8" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/55">Arrivée</p>
              <p className="font-display text-lg text-navy">{fmt(booking.start_date)}</p>
              <p className="mt-0.5 text-sm text-navy/50">{villa.check_in_time ?? "17:00"}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/55">Départ</p>
              <p className="font-display text-lg text-navy">{fmt(booking.end_date)}</p>
              <p className="mt-0.5 text-sm text-navy/50">{villa.check_out_time ?? "10:00"}</p>
            </div>
          </div>

          {villa.wifi_name ? (
            <>
              <div className="h-px bg-navy/8" />
              <div className="flex items-center gap-2">
                <Wifi size={15} className="text-navy/30" />
                <div>
                  <p className="text-[11px] text-navy/50">{villa.wifi_name}</p>
                  {villa.wifi_password ? <p className="text-sm text-navy">{villa.wifi_password}</p> : null}
                </div>
              </div>
            </>
          ) : null}

          <div className="h-px bg-navy/8" />

          <p className="text-center text-[11px] text-navy/50">Kayvila Conciergerie — Martinique</p>
        </div>
      </div>
    </div>
  );
}
