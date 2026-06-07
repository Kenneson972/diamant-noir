import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getCommissionRate } from "@/lib/revenue/booking-revenue";
import { renderToBuffer } from "@react-pdf/renderer";
import { RelevePDF } from "@/components/dashboard/proprio/RelevePDF";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Paramètre month requis (YYYY-MM)" }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: villas } = await supabase.from("villas").select("id, name").eq("owner_id", user.id);
  const villaMap = new Map((villas ?? []).map((v) => [v.id, v.name]));
  const villaIds = (villas ?? []).map((v) => v.id);

  const monthStart = `${month}-01`;
  const [year, mon] = month.split("-");
  const monthEnd = new Date(Number(year), Number(mon), 0).toISOString().slice(0, 10);

  const admin = supabaseAdmin();
  const { data: bookings } = villaIds.length > 0
    ? await admin
        .from("bookings")
        .select("id, start_date, villa_id, guest_name, price, cleaning_fee, service_fee, source")
        .in("villa_id", villaIds)
        .in("status", ["confirmed", "paid"])
        .gte("start_date", monthStart)
        .lte("start_date", monthEnd)
        .order("start_date", { ascending: true })
    : { data: [] };

  const rows = (bookings ?? []).map((b: any) => {
    const stayCents = Math.round((b.price ?? 0) * 100);
    const cleaningCents = Math.round((b.cleaning_fee ?? 0) * 100);
    const serviceCents = Math.round((b.service_fee ?? 0) * 100);
    const grossCents = stayCents + cleaningCents + serviceCents;
    const rate = getCommissionRate(b.source ?? null);
    const commissionCents = Math.round(stayCents * (rate / 100)) + cleaningCents + serviceCents;
    const netCents = grossCents - commissionCents;
    return {
      date: b.start_date,
      villa: villaMap.get(b.villa_id) ?? "—",
      guest: b.guest_name ?? "—",
      gross: (grossCents / 100).toFixed(0),
      commission: (commissionCents / 100).toFixed(0),
      net: (netCents / 100).toFixed(0),
    };
  });

  const totalGross = rows.reduce((s, r) => s + Number(r.gross), 0);
  const totalCommission = rows.reduce((s, r) => s + Number(r.commission), 0);
  const totalNet = rows.reduce((s, r) => s + Number(r.net), 0);

  const monthLabel = new Date(monthStart).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const pdfBuffer = await renderToBuffer(
    RelevePDF({ month, monthLabel, rows, totalGross, totalCommission, totalNet })
  );
  const pdfUint8 = new Uint8Array(pdfBuffer);

  return new NextResponse(pdfUint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="releve-${month}-kayvila.pdf"`,
    },
  });
}
