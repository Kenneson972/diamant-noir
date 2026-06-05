"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { tenantBookingsOrFilter } from "@/lib/booking-tenant";
import { Button } from "@heroui/react";
import { PageTopbar } from "@/components/espace-client/PageTopbar";
import { TenantSectionHeader } from "@/components/espace-client/TenantSectionHeader";
import { Spinner } from "@/components/espace-client/tenant-ui";
import { KayvilaEmptyState, KayvilaTenantWidget } from "@/components/ui/pro";
import { FileText, BookOpen } from "lucide-react";
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
        .or(tenantBookingsOrFilter(session.user.id, session.user.email))
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

  const pastBookings = bookings.filter((b) => new Date(b.end_date) < new Date());

  const printInvoice = (b: BookingDoc) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Facture Kayvila</title><style>body{font-family:Georgia,serif;max-width:600px;margin:60px auto;padding:20px;color:#0A0A0A}h1{font-size:24px;margin-bottom:4px}.gold{color:#D4AF37}.line{height:1px;background:#D4AF37;margin:20px 0}.footer{margin-top:40px;font-size:11px;color:#8B8B8B;line-height:1.6}</style></head><body><h1>Kayvila</h1><p class="gold">Conciergerie de luxe — Martinique</p><div class="line"></div><p><strong>Séjour :</strong> ${b.villa_name}</p><p><strong>Dates :</strong> ${fmt(b.start_date)} → ${fmt(b.end_date)}</p><div class="line"></div><div class="footer"><p>Kayvila Conciergerie</p><p>contact@kayvila.com — +596 696 00 00 00</p><p>Facture générée le ${new Date().toLocaleDateString("fr-FR")}</p></div></body></html>`
    );
    w.document.close();
    window.setTimeout(() => w.print(), 300);
  };

  return (
    <>
      <PageTopbar title="Documents" />
      <div className="mx-auto max-w-2xl space-y-8">
        <TenantSectionHeader
          eyebrow="Documents"
          title="Mes documents"
          description="Contrats, livret d'accueil et factures de séjour."
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-gold" />
          </div>
        ) : bookings.length === 0 ? (
          <KayvilaEmptyState
            icon={<FileText strokeWidth={1} aria-hidden />}
            title="Aucun document disponible"
            description="Vos documents apparaîtront ici après confirmation de votre séjour."
            actionLabel="Découvrir nos villas"
            actionHref="/villas"
          />
        ) : (
          <>
            <KayvilaTenantWidget title="Séjours confirmés" description="Documents liés à vos réservations">
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.id} className="border border-navy/8 bg-offwhite px-5 py-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-navy/50">Séjour</p>
                    <p className="mt-1 text-[13px] font-medium text-navy">{b.villa_name}</p>
                    <p className="mt-0.5 font-display text-[13px] italic text-navy/40">
                      {fmt(b.start_date)} – {fmt(b.end_date)}
                    </p>
                    <div className="mt-4">
                      <Link
                        href="/espace-client/livret/print"
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-none border border-navy/15 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-navy/55 no-underline transition-colors hover:border-gold hover:text-gold"
                      >
                        <BookOpen size={12} aria-hidden />
                        Livret d&apos;accueil PDF
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </KayvilaTenantWidget>

            {pastBookings.length > 0 ? (
              <KayvilaTenantWidget title="Factures" description="Séjours terminés">
                <div className="space-y-3">
                  {pastBookings.map((b) => (
                    <div
                      key={`invoice-${b.id}`}
                      className="flex flex-col gap-3 border border-navy/8 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-[13px] font-medium text-navy">{b.villa_name}</p>
                        <p className="mt-0.5 text-[11px] text-navy/55">
                          {fmt(b.start_date)} → {fmt(b.end_date)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => printInvoice(b)}
                        className="min-h-[44px] shrink-0 rounded-none border-navy/20 text-[10px] font-bold uppercase tracking-[0.14em] text-navy/60 data-[hover=true]:border-navy data-[hover=true]:text-navy"
                      >
                        <FileText size={14} aria-hidden />
                        Télécharger
                      </Button>
                    </div>
                  ))}
                </div>
              </KayvilaTenantWidget>
            ) : null}
          </>
        )}

        <p className="border-t border-navy/[0.06] pt-6 text-[11px] leading-relaxed text-navy/50">
          Pour toute autre demande, contactez notre équipe via la messagerie.
        </p>
      </div>
    </>
  );
}
