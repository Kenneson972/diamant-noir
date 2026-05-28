"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { PageTopbar } from "@/components/espace-client/PageTopbar";
import { FileText, Download, BookOpen } from "lucide-react";
import Link from "next/link";

interface BookingDoc {
  id: string;
  villa_name: string;
  start_date: string;
  end_date: string;
}

export default function DocumentsPage() {
  const supabase = getSupabaseBrowser();
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { setLoading(false); return; }

      const { data } = await supabase
        .from("bookings")
        .select("id, start_date, end_date, villa_id, villas(name)")
        .eq("guest_email", session.user.email)
        .eq("status", "confirmed")
        .order("start_date", { ascending: false });

      setBookings(
        (data || []).map((b: any) => ({
          id: b.id,
          villa_name: b.villas?.name ?? "Villa Kayvila",
          start_date: b.start_date,
          end_date: b.end_date,
        }))
      );
      setLoading(false);
    })();
  }, [supabase]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <PageTopbar title="Documents" />
      <div className="space-y-8">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.38em] text-gold">
            Documents
          </p>
          <h1 className="font-display text-2xl font-normal text-navy mt-2 leading-none">
            Mes documents
          </h1>
          <span className="mt-3 block h-px w-8 bg-[rgba(212,175,55,0.5)]" />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-[rgba(13,27,42,0.04)] animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="border border-[rgba(13,27,42,0.07)] bg-white px-8 py-14 text-center">
            <FileText size={32} strokeWidth={1} className="text-[rgba(13,27,42,0.12)] mx-auto mb-4" />
            <p className="font-display text-[16px] text-navy">Aucun document disponible</p>
            <p className="font-display italic text-[14px] text-[rgba(13,27,42,0.4)] mt-1">
              Vos documents apparaîtront ici après confirmation de votre séjour.
            </p>
          </div>
        ) : (
          <div className="space-y-[1px] border border-[rgba(13,27,42,0.07)] bg-[rgba(13,27,42,0.04)]">
            {bookings.map((b) => (
              <div key={b.id} className="bg-offwhite px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-navy/50 mb-1">
                      Séjour
                    </p>
                    <p className="text-[13px] font-medium text-navy">{b.villa_name}</p>
                    <p className="font-display italic text-[13px] text-[rgba(13,27,42,0.4)] mt-0.5">
                      {fmt(b.start_date)} – {fmt(b.end_date)}
                    </p>
                  </div>
                </div>
                {/* Documents liés */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/espace-client/livret/print"
                    className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-navy/45 border border-navy/15 bg-white px-3 py-2 no-underline hover:border-navy/25 hover:text-navy transition-colors"
                  >
                    <BookOpen size={11} strokeWidth={1.5} />
                    Livret d&apos;accueil PDF
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Factures — séjours passés */}
        {bookings.filter((b: any) => new Date(b.end_date) < new Date()).length > 0 && (
          <div className="mt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold mb-4">Factures</p>
            <div className="space-y-3">
              {bookings.filter((b: any) => new Date(b.end_date) < new Date()).map((b: any) => (
                <div key={`invoice-${b.id}`} className="flex items-center justify-between bg-white border border-navy/10 px-5 py-4">
                  <div>
                    <p className="text-[13px] font-medium text-navy">{b.villa_name}</p>
                    <p className="text-[11px] text-navy/55 mt-0.5">
                      {fmt(b.start_date)} → {fmt(b.end_date)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const w = window.open("", "_blank");
                      if (!w) return;
                      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Facture Kayvila</title><style>body{font-family:Georgia,serif;max-width:600px;margin:60px auto;padding:20px;color:#0A0A0A}h1{font-size:24px;margin-bottom:4px}.gold{color:#D4AF37}.line{height:1px;background:#D4AF37;margin:20px 0}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:8px 0;text-align:left;font-size:14px}th{border-bottom:1px solid #e5e3db;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.1em;color:#8B8B8B}.total{font-size:18px;font-weight:700}.footer{margin-top:40px;font-size:11px;color:#8B8B8B;line-height:1.6}</style></head><body><h1>Kayvila</h1><p class="gold">Conciergerie de luxe — Martinique</p><div class="line"></div><p><strong>Séjour :</strong> ${b.villa_name}</p><p><strong>Dates :</strong> ${fmt(b.start_date)} → ${fmt(b.end_date)}</p><div class="line"></div><div class="footer"><p>Kayvila Conciergerie</p><p>contact@kayvila.com — +596 696 00 00 00</p><p>Facture générée le ${new Date().toLocaleDateString("fr-FR")}</p></div></body></html>`);
                      w.document.close();
                      setTimeout(() => w.print(), 300);
                    }}
                    className="inline-flex items-center gap-2 border border-navy/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/60 hover:border-navy/40 hover:text-navy transition-colors"
                  >
                    <FileText size={14} />
                    Facture
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-navy/50 leading-relaxed border-t border-navy/[0.06] pt-6">
          Pour toute autre demande, contactez notre équipe via la messagerie.
        </p>
      </div>
    </>
  );
}
