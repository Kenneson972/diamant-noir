import { Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";

export type SubmissionReceivedProps = {
  ownerName: string;
  villaName: string;
};

export default function SubmissionReceived({ ownerName, villaName }: SubmissionReceivedProps) {
  return (
    <EmailLayout preview={`Bien reçu — ${villaName}`}>
      <Text style={greeting}>Bonjour {ownerName},</Text>
      <Text style={subtitle}>Nous avons bien reçu votre demande pour {villaName || "votre villa"}.</Text>
      <Text style={body}>
        Notre équipe étudie votre dossier et vous recontacte sous <strong>24h</strong> pour
        vous proposer une estimation personnalisée et organiser une visite si nécessaire.
      </Text>
      <Text style={body}>
        Vous pouvez également nous joindre au <strong>+596 696 68 18 69</strong> pour toute question.
      </Text>
      <Text style={signature}>À très bientôt,<br />L&apos;équipe Kayvila</Text>
    </EmailLayout>
  );
}

const greeting = { color: "#0a1929", fontSize: "22px", margin: "0 0 4px" };
const subtitle = { color: "#334155", fontSize: "15px", margin: "0 0 24px" };
const body = { color: "#334155", fontSize: "15px", lineHeight: "1.75", margin: "0 0 16px" };
const signature = { color: "#64748b", fontSize: "14px", margin: "24px 0 0" };
