import { Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { formatDateFr } from "@/lib/emails/format";

export type SubmissionVisitScheduledProps = {
  ownerName: string;
  villaName: string;
  visitDate: string;
};

export default function SubmissionVisitScheduled({
  ownerName,
  villaName,
  visitDate,
}: SubmissionVisitScheduledProps) {
  return (
    <EmailLayout preview={`Visite programmée — ${villaName}`}>
      <Text style={title}>Bonjour {ownerName},</Text>
      <Text>
        Nous passerons visiter <strong>{villaName}</strong> le{" "}
        <strong>{formatDateFr(visitDate)}</strong>.
      </Text>
      <Text style={detail}>
        Notre équipe évaluera le potentiel de votre bien et répondra à toutes vos questions
        sur nos services de conciergerie.
      </Text>
    </EmailLayout>
  );
}

const title = { color: "#0a1929", fontSize: "20px", margin: "0 0 16px" };
const detail = { color: "#64748b", fontSize: "14px", fontStyle: "italic" };
