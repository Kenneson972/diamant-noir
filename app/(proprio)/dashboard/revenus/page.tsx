import { getSupabaseServer, getCurrentUser, getOwnerVillas } from "@/lib/supabase-server";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import type { Metadata } from "next";
import { RevenueChart } from "@/components/dashboard/proprio/RevenueChart";
import { RevenueSummary } from "@/components/dashboard/proprio/RevenueSummary";
import { calculateTransferAmounts } from "@/lib/stripe/connect";
import {
  getCommissionRate,
  stayCentsFromBooking,
  ownerNetCents,
} from "@/lib/revenue/booking-revenue";
import { RevenuePageClient } from "@/components/dashboard/proprio/RevenuePageClient";
import type { RevenueRow } from "@/components/dashboard/proprio/RevenueBreakdownTable";

export const metadata: Metadata = {
  title: "Revenus",
};

export const dynamic = "force-dynamic";

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default async function RevenusPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await getCurrentUser();

  const { data: villas } = await getOwnerVillas(user!.id);

  const villaIds = villas?.map((v) => v.id) ?? [];
  const commissionByVilla = new Map(
    (villas ?? []).map((v) => [v.id, v.commission_rate ?? 22])
  );
  const villaNameMap = new Map((villas ?? []).map((v) => [v.id, v.name]));

  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  // Fetch last 6 months of confirmed/paid bookings
  const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1).toISOString();

  // NB : ne sélectionner que des colonnes existantes — les colonnes
  // stripe_transfer_* n'existent pas dans bookings ; les demander faisait
  // échouer silencieusement toute la requête → page à 0 € (P1 audit préprod).
  const { data: bookings, error: bookingsError } = villaIds.length > 0
    ? await supabase
        .from("bookings")
        .select("id, price, cleaning_fee, service_fee, total_price_cents, villa_id, start_date, end_date, guest_name, source, status, payment_status")
        .in("villa_id", villaIds)
        .in("status", ["confirmed", "paid"])
        .gte("start_date", sixMonthsAgo)
    : { data: [], error: null };

  if (bookingsError) {
    console.error("[dashboard/revenus] bookings fetch failed:", bookingsError.message);
  }

  // Build revenue rows using unified functions (consistent with admin revenue)
  const revenueRows: RevenueRow[] = (bookings ?? []).map((b: any) => {
    const stayCents = stayCentsFromBooking(b);
    const cleaningCents = Math.round((b.cleaning_fee ?? 0) * 100);
    const serviceCents = Math.round((b.service_fee ?? 0) * 100);
    const source = b.source as string | null;
    const rate = getCommissionRate(source); // 20% OTA / 22% direct — consistent with admin
    const { ownerAmountCents, platformFeeCents } = calculateTransferAmounts(stayCents, cleaningCents, serviceCents, rate);
    const gross = stayCents + cleaningCents + serviceCents;
    const nights =
      b.start_date && b.end_date
        ? Math.round(
            (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) /
              86400000
          )
        : 1;
    return {
      id: b.id,
      checkIn: b.start_date,
      guestName: b.guest_name ?? "Anonyme",
      villaName: villaNameMap.get(b.villa_id) ?? "—",
      nights,
      gross,
      commissionRate: rate, // affiche le taux réellement utilisé (source)
      commission: platformFeeCents,
      cleaningFee: cleaningCents,
      net: ownerAmountCents,
      paymentStatus: b.payment_status ?? "pending",
      // Colonnes stripe_transfer_* pas encore en base — la table les affiche
      // seulement si non-null.
      stripeTransferId: null,
      stripeTransferDate: null,
      stripeTransferStatus: null,
      villaId: b.villa_id,
    };
  });

  const currentPeriod = `${now.toLocaleString("fr-FR", { month: "long" })} ${now.getFullYear()}`;

  // Build 6-month chart data using unified ownerNetCents (consistent with dashboard KPI)
  // Même filtre paiement que le graphique du tableau de bord (paid ou legacy null).
  const monthMap: Record<string, number> = {}; // key = "YYYY-MM"
  for (const b of (bookings ?? []).filter(
    (b: any) => b.payment_status === "paid" || b.payment_status == null
  )) {
    const d = new Date(b.start_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    // Use unified function: fallback total_price_cents, source-based rate
    const net = ownerNetCents(b, getCommissionRate(b.source ?? null));
    monthMap[key] = (monthMap[key] ?? 0) + net;
  }

  // Last 6 months (oldest → newest)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyData.push({
      month: MONTH_LABELS[d.getMonth()],
      revenue: Math.round((monthMap[key] ?? 0) / 100),
      isCurrent: i === 0,
    });
  }

  // Cartes « ce mois » : même périmètre que le KPI « Revenus du mois » du
  // tableau de bord (mois courant par start_date + paiement validé ou legacy
  // sans payment_status), pour que les deux vues affichent le même chiffre.
  const paidBookingIds = new Set(
    (bookings ?? [])
      .filter((b: any) => b.payment_status === "paid" || b.payment_status == null)
      .map((b: any) => b.id)
  );
  const currentMonthRows = revenueRows.filter((r) => {
    if (!paidBookingIds.has(r.id)) return false;
    const d = new Date(r.checkIn);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalNet = Math.round(currentMonthRows.reduce((s, r) => s + r.net, 0) / 100);
  const totalGross = Math.round(currentMonthRows.reduce((s, r) => s + r.gross, 0) / 100);
  const totalCommission = Math.round(currentMonthRows.reduce((s, r) => s + r.commission, 0) / 100);

  // Enough history = at least 2 months with data (not just current)
  const monthsWithData = Object.values(monthMap).filter((v) => v > 0).length;
  const completedMonths = monthlyData.slice(0, -1).filter((m) => m.revenue > 0).length;
  const hasEnoughHistory = completedMonths >= 2 || monthsWithData >= 2;

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Revenus
          </h1>
          <p className="text-sm text-muted">Reversements nets après commission Kayvila</p>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <a
            href={`/api/proprio/releve?month=${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-white hover:bg-gold/90"
          >
            <KayvilaPngIcon name="download" size={20} />
            Télécharger le relevé
          </a>
        </div>

        <div className="space-y-6">
          <RevenueSummary
            totalNet={totalNet}
            totalGross={totalGross}
            totalCommission={totalCommission}
          />

          <RevenueChart data={monthlyData} hasEnoughHistory={hasEnoughHistory} />

          <RevenuePageClient rows={revenueRows} period={currentPeriod} />
        </div>
      </div>
    </div>
  );
}
