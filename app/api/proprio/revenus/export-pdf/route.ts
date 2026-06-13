export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#0A0A0A",
  },
  header: { marginBottom: 24 },
  title: { fontSize: 16, fontWeight: "bold", color: "#0A0A0A", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E3DB",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0EEE8",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  th: { fontSize: 8, fontWeight: "bold", color: "#666", flex: 1 },
  td: { fontSize: 9, color: "#0A0A0A", flex: 1 },
  tdGold: { fontSize: 9, color: "#D4AF37", fontWeight: "bold", flex: 1 },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderTopWidth: 1,
    borderTopColor: "#E5E3DB",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  footer: {
    marginTop: 24,
    fontSize: 8,
    color: "#999",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E3DB",
    paddingTop: 12,
  },
});

type PdfRow = {
  checkIn: string;
  guestName: string;
  villaName: string;
  gross: number;
  commission: number;
  net: number;
};

function formatEur(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}K€` : `${v}€`;
}

function RevenuePDF({
  rows,
  period,
  ownerName,
}: {
  rows: PdfRow[];
  period: string;
  ownerName: string;
}) {
  const totals = rows.reduce(
    (acc, r) => ({
      gross: acc.gross + r.gross,
      commission: acc.commission + r.commission,
      net: acc.net + r.net,
    }),
    { gross: 0, commission: 0, net: 0 }
  );

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          Text,
          { style: styles.title },
          "Relevé de reversements — Kayvila"
        ),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `${ownerName} · ${period}`
        )
      ),
      React.createElement(
        View,
        { style: styles.tableHeader },
        ...(["Arrivée", "Voyageur", "Villa", "Brut", "Commission", "Net reversé"] as const).map(
          (h) => React.createElement(Text, { style: styles.th, key: h }, h)
        )
      ),
      ...rows.map((r, i) =>
        React.createElement(
          View,
          { style: styles.tableRow, key: String(i) },
          React.createElement(
            Text,
            { style: styles.td },
            new Date(r.checkIn).toLocaleDateString("fr-FR")
          ),
          React.createElement(Text, { style: styles.td }, r.guestName),
          React.createElement(Text, { style: styles.td }, r.villaName),
          React.createElement(
            Text,
            { style: styles.td },
            formatEur(r.gross)
          ),
          React.createElement(
            Text,
            { style: styles.td },
            `-${formatEur(r.commission)}`
          ),
          React.createElement(
            Text,
            { style: styles.tdGold },
            formatEur(r.net)
          )
        )
      ),
      React.createElement(
        View,
        { style: styles.totalRow },
        React.createElement(
          Text,
          { style: { ...styles.th, flex: 3 } },
          "TOTAUX"
        ),
        React.createElement(
          Text,
          { style: styles.th },
          formatEur(totals.gross)
        ),
        React.createElement(
          Text,
          { style: styles.th },
          `-${formatEur(totals.commission)}`
        ),
        React.createElement(
          Text,
          { style: { ...styles.th, color: "#D4AF37" } },
          formatEur(totals.net)
        )
      ),
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          null,
          "Document généré automatiquement par Kayvila. Pour toute question : support@kayvila.com"
        )
      )
    )
  );
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { rows, period } = body as {
    rows: PdfRow[];
    period: string;
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const ownerName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : user.email ?? "Propriétaire";

  const buffer = await renderToBuffer(
    React.createElement(RevenuePDF, { rows, period, ownerName })
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="revenus-kayvila-${period
        .replace(/\s+/g, "-")
        .toLowerCase()}.pdf"`,
    },
  });
}
