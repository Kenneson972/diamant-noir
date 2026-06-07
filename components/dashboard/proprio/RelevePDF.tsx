import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 24, borderBottom: "1 solid #D4AF37", paddingBottom: 12 },
  title: { fontSize: 18, color: "#0a1929", marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#666" },
  table: { width: "100%", marginTop: 16 },
  th: { flexDirection: "row", borderBottom: "1 solid #0a1929", paddingBottom: 8, marginBottom: 8 },
  thCell: { flex: 1, fontFamily: "Helvetica-Bold", color: "#0a1929" },
  tr: { flexDirection: "row", paddingVertical: 4, borderBottom: "1 solid #eee" },
  td: { flex: 1, color: "#333" },
  totals: { marginTop: 16, borderTop: "1 solid #0a1929", paddingTop: 8 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#999", textAlign: "center" },
});

interface Row {
  date: string;
  villa: string;
  guest: string;
  gross: string;
  commission: string;
  net: string;
}

interface RelevePDFProps {
  month: string;
  monthLabel: string;
  rows: Row[];
  totalGross: number;
  totalCommission: number;
  totalNet: number;
}

export function RelevePDF({ month, monthLabel, rows, totalGross, totalCommission, totalNet }: RelevePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Relevé de revenus — Kayvila</Text>
          <Text style={styles.subtitle}>{monthLabel}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={styles.thCell}>Date</Text>
            <Text style={styles.thCell}>Villa</Text>
            <Text style={styles.thCell}>Voyageur</Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>Brut</Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>Commission</Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>Net</Text>
          </View>
          {rows.map((r, i) => (
            <View style={styles.tr} key={i}>
              <Text style={styles.td}>{new Date(r.date).toLocaleDateString("fr-FR")}</Text>
              <Text style={styles.td}>{r.villa}</Text>
              <Text style={styles.td}>{r.guest}</Text>
              <Text style={{ ...styles.td, textAlign: "right" }}>{r.gross} €</Text>
              <Text style={{ ...styles.td, textAlign: "right" }}>{r.commission} €</Text>
              <Text style={{ ...styles.td, textAlign: "right" }}>{r.net} €</Text>
            </View>
          ))}
        </View>
        <View style={styles.totals}>
          <View style={styles.tr}>
            <Text style={styles.thCell}>Totaux</Text>
            <Text style={styles.td}></Text>
            <Text style={styles.td}></Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>{totalGross} €</Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>{totalCommission} €</Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>{totalNet} €</Text>
          </View>
        </View>
        <Text style={styles.footer}>
          Kayvila — {new Date().toLocaleDateString("fr-FR")} — Ce document est généré automatiquement.
        </Text>
      </Page>
    </Document>
  );
}
