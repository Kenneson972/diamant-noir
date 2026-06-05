import { Link, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { formatDateFr, formatEuros } from "@/lib/emails/format";

export type AdminDisputeAlertEmailProps = {
  disputeId: string;
  amount: number;
  reason: string;
  evidenceDueBy?: string | null;
  villaName?: string;
  stripeDisputeUrl: string;
};

export default function AdminDisputeAlertEmail({
  disputeId,
  amount,
  reason,
  evidenceDueBy,
  villaName,
  stripeDisputeUrl,
}: AdminDisputeAlertEmailProps) {
  return (
    <EmailLayout preview={`Litige Stripe — ${formatEuros(amount)}`}>
      <Text style={title}>Litige Stripe</Text>
      <Text>
        <strong>Montant :</strong> {formatEuros(amount)}
        <br />
        <strong>Motif :</strong> {reason}
        <br />
        <strong>Référence :</strong> {disputeId}
        {villaName ? (
          <>
            <br />
            <strong>Villa :</strong> {villaName}
          </>
        ) : null}
      </Text>
      {evidenceDueBy ? (
        <Text>
          <strong>Date limite de réponse :</strong> {formatDateFr(evidenceDueBy)}
        </Text>
      ) : null}
      <Text>
        <Link href={stripeDisputeUrl} style={link}>
          Ouvrir le litige dans Stripe
        </Link>
      </Text>
    </EmailLayout>
  );
}

const title = { color: "#b45309", fontSize: "20px", margin: "0 0 16px" };
const link = { color: "#0a1929", textDecoration: "underline" };
