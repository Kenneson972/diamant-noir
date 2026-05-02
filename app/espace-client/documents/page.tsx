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
          <p className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#D4AF37]">
            Documents
          </p>
          <h1 className="font-display text-2xl font-normal text-[#0D1B2A] mt-2 leading-none">
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
            <p className="font-display text-[16px] text-[#0D1B2A]">Aucun document disponible</p>
            <p className="font-cormorant italic text-[14px] text-[rgba(13,27,42,0.4)] mt-1">
              Vos documents apparaîtront ici après confirmation de votre séjour.
            </p>
          </div>
        ) : (
          <div className="space-y-[1px] border border-[rgba(13,27,42,0.07)] bg-[rgba(13,27,42,0.04)]">
            {bookings.map((b) => (
              <div key={b.id} className="bg-[#FAFAF8] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.35)] mb-1">
                      Séjour
                    </p>
                    <p className="text-[13px] font-medium text-[#0D1B2A]">{b.villa_name}</p>
                    <p className="font-cormorant italic text-[13px] text-[rgba(13,27,42,0.4)] mt-0.5">
                      {fmt(b.start_date)} – {fmt(b.end_date)}
                    </p>
                  </div>
                </div>
                {/* Documents liés */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/espace-client/livret/print"
                    className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[rgba(13,27,42,0.45)] border border-[rgba(13,27,42,0.12)] bg-white px-3 py-2 no-underline hover:border-[rgba(13,27,42,0.25)] hover:text-[#0D1B2A] transition-colors"
                  >
                    <BookOpen size={11} strokeWidth={1.5} />
                    Livret d&apos;accueil PDF
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-[rgba(13,27,42,0.35)] leading-relaxed border-t border-[rgba(13,27,42,0.06)] pt-6">
          Pour récupérer un contrat ou une facture, contactez notre équipe via la messagerie.
        </p>
      </div>
    </>
  );
}
