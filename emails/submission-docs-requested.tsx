import { Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";

export type SubmissionDocsRequestedProps = {
  ownerName: string;
  villaName: string;
};

export default function SubmissionDocsRequested({
  ownerName,
  villaName,
}: SubmissionDocsRequestedProps) {
  return (
    <EmailLayout preview={`Documents demandés — ${villaName}`}>
      <Text style={title}>Bonjour {ownerName},</Text>
      <Text>
        Pour poursuivre l&apos;étude de <strong>{villaName}</strong>, merci de nous transmettre les documents suivants :
      </Text>
      <Text style={list}>
        • Titre de propriété
        <br />
        • Diagnostic de performance énergétique (DPE)
        <br />
        • Dernier avis de taxe foncière
        <br />
        • Photos supplémentaires (si disponibles)
      </Text>
      <Text>Vous pouvez répondre directement à cet email avec les documents en pièce jointe.</Text>
    </EmailLayout>
  );
}

const title = { color: "#0a1929", fontSize: "20px", margin: "0 0 16px" };
const list = { color: "#334155", fontSize: "14px", lineHeight: "2", padding: "8px 0" };
