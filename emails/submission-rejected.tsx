import { Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";

export type SubmissionRejectedProps = {
  ownerName: string;
  villaName: string;
};

export default function SubmissionRejected({
  ownerName,
  villaName,
}: SubmissionRejectedProps) {
  return (
    <EmailLayout preview={`Réponse — ${villaName}`}>
      <Text style={title}>Bonjour {ownerName},</Text>
      <Text>
        Nous avons bien étudié votre dossier pour <strong>{villaName}</strong>.
      </Text>
      <Text>
        Après examen, nous ne pouvons malheureusement pas donner suite pour le moment.
        Les raisons peuvent être liées à la localisation, au type de bien ou à nos
        capacités actuelles.
      </Text>
      <Text>
        Nous vous remercions de l&apos;intérêt porté à Kayvila et vous souhaitons
        une excellente continuation dans la gestion de votre bien.
      </Text>
      <Text style={detail}>L&apos;équipe Kayvila</Text>
    </EmailLayout>
  );
}

const title = { color: "#0a1929", fontSize: "20px", margin: "0 0 16px" };
const detail = { color: "#64748b", fontSize: "14px", marginTop: "16px" };
