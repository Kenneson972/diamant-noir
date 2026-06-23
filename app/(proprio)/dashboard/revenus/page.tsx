import { getSupabaseServer } from "@/lib/supabase-server";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import type { Metadata } from "next";
import { RevenueChart } from "@/components/dashboard/proprio/RevenueChart";
import { RevenueSummary } from "@/components/dashboard/proprio/RevenueSummary";
import { calculateTransferAmounts } from "@/lib/stripe/connect";
import { getCommissionRate } from "@/lib/revenue/booking-revenue";
import { RevenuePageClient } from "@/components/dashboard/proprio/RevenuePageClient";
import type { RevenueRow } from "@/components/dashboard/proprio/RevenueBreakdownTable";

export const metadata: Metadata = {
  title: "Revenus — Kayvila",
};

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];


export default async function RevenusPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: villas } = await supabase
    .from("villas")
    .select("id, name, commission_rate")
    .eq("owner_id", user!.id);

  const villaIds = villas?.map((v) => v.id) ?? [];
  const commissionByVilla = new Map(
    (villas ?? []).map((v) => [v.id, v.commission_rate ?? 25])
  );
  const villaNameMap = new Map((villas ?? []).map((v) => [v.id, v.name]));

  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  // Fetch last 6 months of confirmed/paid bookings
  const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1).toISOString();

  const { data: bookings } = villaIds.length > 0
    ? await supabase
        .from("bookings")
        .select("id, price, cleaning_fee, service_fee, villa_id, start_date, end_date, guest_name, source, status, payment_status, stripe_transfer_id, stripe_transfer_date, stripe_transfer_status")
        .in("villa_id", villaIds)
        .in("status", ["confirmed", "paid"])
        .gte("start_date", sixMonthsAgo)
    : { data: [] };

  const revenueRows: RevenueRow[] = (bookings ?? []).map((b: any) => {
    const stayCents = Math.round((b.price ?? 0) * 100);
    const cleaningCents = Math.round((b.cleaning_fee ?? 0) * 100);
    const serviceCents = Math.round((b.service_fee ?? 0) * 100);
    const commissionRate = commissionByVilla.get(b.villa_id) ?? 25;
    const rate = getCommissionRate(b.source ?? null);
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
      commissionRate,
      commission: platformFeeCents,
      cleaningFee: cleaningCents,
      net: ownerAmountCents,
      paymentStatus: b.payment_status ?? "pending",
      stripeTransferId: b.stripe_transfer_id ?? null,
      stripeTransferDate: b.stripe_transfer_date ?? null,
      stripeTransferStatus: b.stripe_transfer_status ?? null,
      villaId: b.villa_id,
    };
  });

  function ownerNetCents(b: {
    price?: number | null;
    cleaning_fee?: number | null;
    service_fee?: number | null;
    villa_id?: string | null;
  }) {
    const stayCents = Math.round((b.price ?? 0) * 100);
    const cleaningCents = Math.round((b.cleaning_fee ?? 0) * 100);
    const serviceCents = Math.round((b.service_fee ?? 0) * 100);
    const rate = commissionByVilla.get(b.villa_id ?? "") ?? 25;
    return calculateTransferAmounts(stayCents, cleaningCents, serviceCents, rate)
      .ownerAmountCents;
  }

  const currentPeriod = `${now.toLocaleString("fr-FR", { month: "long" })} ${now.getFullYear()}`;

  const monthMap: Record<number, number> = {};
  for (const b of bookings ?? []) {
    const d = new Date(b.start_date);
    const monthIndex = d.getMonth();
    monthMap[monthIndex] = (monthMap[monthIndex] ?? 0) + ownerNetCents(b);
  }

  // Build 6-month series (oldest → newest)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    const revenue = Math.round((monthMap[monthIndex] ?? 0) / 100);
    return {
      month: MONTH_LABELS[monthIndex],
      revenue,
      isCurrent: monthIndex === currentMonth,
    };
  });

  const totalMonth = monthlyData.find((m) => m.isCurrent)?.revenue ?? 0;
  const totalYear = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const paidMonths = monthlyData.filter((m) => m.revenue > 0);
  const averagePerNight = paidMonths.length > 0
    ? Math.round(totalYear / paidMonths.length)
    : 0;
  const prevMonthIndex = (currentMonth - 1 + 12) % 12;
  const comparisonMonth = Math.round((monthMap[prevMonthIndex] ?? 0) / 100);

  const hasEnoughHistory = monthlyData.filter((m) => m.revenue > 0).length >= 3;

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
            totalMonth={totalMonth}
            totalYear={totalYear}
            averagePerNight={averagePerNight}
            comparisonMonth={comparisonMonth}
          />

          <RevenueChart data={monthlyData} hasEnoughHistory={hasEnoughHistory} />

          <RevenuePageClient rows={revenueRows} period={currentPeriod} />
        </div>
      </div>
    </div>
  );
}
