"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

interface VillaPrint {
  name: string;
  location?: string;
  wifi_name?: string;
  wifi_password?: string;
  checkout_instructions?: string;
  local_recommendations?: string;
  emergency_contacts?: string;
}

export default function LivretPrintPage() {
  const supabase = getSupabaseBrowser();
  const [villa, setVilla] = useState<VillaPrint | null>(null);
  const [dates, setDates] = useState<{ start: string; end: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { setReady(true); return; }

      const { data: bookingsRaw } = await supabase
        .from("bookings")
        .select("start_date, end_date, villa_id, status")
        .eq("guest_email", session.user.email)
        .in("status", ["confirmed", "upcoming"])
        .gt("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(1);

      const bk = (bookingsRaw as Array<{ start_date: string; end_date: string; villa_id: string; status: string }> | null)?.[0];
      if (!bk) { setReady(true); return; }

      const { data: villaRaw } = await supabase
        .from("villas")
        .select("name, location, wifi_name, wifi_password, checkout_instructions, local_recommendations, emergency_contacts")
        .eq("id", bk.villa_id)
        .single();

      setVilla(villaRaw as VillaPrint);
      setDates({ start: bk.start_date, end: bk.end_date });
      setReady(true);
    })();
  }, [supabase]);

  // Auto-print once data is loaded
  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          @page { margin: 2cm; }
        }
      `}</style>

      <div className="no-print py-4 px-6 border-b border-[rgba(13,27,42,0.07)] flex items-center justify-between">
        <p className="text-[8px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.4)]">
          {ready ? "Prêt à imprimer" : "Chargement…"}
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="text-[8px] tracking-[0.18em] uppercase border border-[rgba(13,27,42,0.12)] px-4 py-2 text-[rgba(13,27,42,0.45)] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
        >
          Imprimer
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-[rgba(13,27,42,0.12)]">
          <p className="text-[8px] tracking-[0.28em] uppercase text-[#D4AF37] mb-1">
            Diamant Noir · Conciergerie
          </p>
          <h1 className="font-display text-2xl font-normal text-[#0D1B2A]">
            {villa?.name ?? "Livret d'accueil"}
          </h1>
          {villa?.location && (
            <p className="font-cormorant italic text-[15px] font-light text-[rgba(13,27,42,0.5)] mt-1">
              {villa.location}, Martinique
            </p>
          )}
          {dates && (
            <p className="font-cormorant italic text-[14px] text-[rgba(13,27,42,0.4)] mt-1">
              {fmt(dates.start)} → {fmt(dates.end)}
            </p>
          )}
        </div>

        {(villa?.wifi_name || villa?.wifi_password) && (
          <section className="mb-8">
            <h2 className="text-[8px] tracking-[0.24em] uppercase text-[#D4AF37] mb-4">Wi-Fi & accès</h2>
            {villa.wifi_name && (
              <p className="font-cormorant text-[16px] text-[#0D1B2A]">
                Réseau : <strong>{villa.wifi_name}</strong>
              </p>
            )}
            {villa.wifi_password && (
              <p className="font-cormorant text-[16px] text-[#0D1B2A]">
                Mot de passe :{" "}
                <code className="bg-[#FAFAF8] border border-[rgba(13,27,42,0.08)] px-2 py-0.5 text-sm">
                  {villa.wifi_password}
                </code>
              </p>
            )}
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-[8px] tracking-[0.24em] uppercase text-[#D4AF37] mb-4">Check-in / Check-out</h2>
          <p className="font-cormorant text-[16px] text-[#0D1B2A]">Check-in : À partir de 16h00</p>
          <p className="font-cormorant text-[16px] text-[#0D1B2A]">Check-out : Avant 11h00</p>
          {villa?.checkout_instructions && (
            <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.7)] whitespace-pre-line leading-relaxed mt-3">
              {villa.checkout_instructions}
            </p>
          )}
        </section>

        {villa?.local_recommendations && (
          <section className="mb-8">
            <h2 className="text-[8px] tracking-[0.24em] uppercase text-[#D4AF37] mb-4">À proximité</h2>
            <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.7)] whitespace-pre-line leading-relaxed">
              {villa.local_recommendations}
            </p>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-[8px] tracking-[0.24em] uppercase text-[#D4AF37] mb-4">Urgences</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "SAMU", number: "15" },
              { name: "Police", number: "17" },
              { name: "Pompiers", number: "18" },
              { name: "Urgences Europe", number: "112" },
            ].map(({ name, number }) => (
              <p key={name} className="font-cormorant text-[15px] text-[#0D1B2A]">
                <span className="text-[rgba(13,27,42,0.45)]">{name} — </span>
                <strong>{number}</strong>
              </p>
            ))}
          </div>
          {villa?.emergency_contacts && (
            <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.6)] mt-3 whitespace-pre-line">
              {villa.emergency_contacts}
            </p>
          )}
        </section>

        <div className="pt-6 border-t border-[rgba(13,27,42,0.08)]">
          <p className="text-[8px] tracking-[0.2em] uppercase text-[rgba(13,27,42,0.25)]">
            Diamant Noir · Conciergerie de luxe, Martinique
          </p>
        </div>
      </div>
    </>
  );
}
