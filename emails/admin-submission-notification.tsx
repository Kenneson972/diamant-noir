import { Text, Link } from "@react-email/components";
import { EmailLayout } from "./_components/layout";

export type AdminSubmissionNotificationProps = {
  name: string;
  email: string;
  phone?: string;
  villaName: string;
  details: string;
  airbnbUrl?: string;
  message?: string;
  submissionId: string;
};

export default function AdminSubmissionNotificationEmail({
  name,
  email: ownerEmail,
  phone,
  villaName,
  details,
  airbnbUrl,
  message,
  submissionId,
}: AdminSubmissionNotificationProps) {
  return (
    <EmailLayout preview={`Nouvelle soumission — ${villaName}`}>
      <Text style={sectionLabel}>Nouvelle soumission villa</Text>

      <Text style={detail}>
        <strong>Nom :</strong> {name}
        <br />
        <strong>Email :</strong> {ownerEmail}
        {phone ? <><br /><strong>Tél. :</strong> {phone}</> : null}
      </Text>

      <Text style={villaBlock}>
        <strong>{villaName}</strong>
        <br />
        {details}
      </Text>

      {airbnbUrl ? (
        <Text style={detail}>
          <strong>Airbnb :</strong>{" "}
          <Link href={airbnbUrl} style={link}>{airbnbUrl}</Link>
        </Text>
      ) : null}

      {message ? (
        <Text style={quote}>« {message} »</Text>
      ) : null}

      <Text style={ref}>Réf. {submissionId}</Text>
    </EmailLayout>
  );
}

const sectionLabel = { color: "#d4af37", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", margin: "0 0 8px", textTransform: "uppercase" as const };
const detail = { color: "#0a1929", fontSize: "15px", lineHeight: "1.8", margin: "0 0 12px" };
const villaBlock = { color: "#0a1929", fontSize: "15px", lineHeight: "1.8", margin: "16px 0 8px" };
const link = { color: "#d4af37", fontSize: "13px" };
const quote = { color: "#64748b", fontSize: "14px", fontStyle: "italic" as const, margin: "12px 0", padding: "8px 0", borderLeft: "2px solid #d4af37", paddingLeft: "12px" };
const ref = { color: "#94a3b8", fontSize: "11px", margin: "16px 0 0" };
