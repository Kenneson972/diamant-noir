import { Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";

export type SubmissionCallRequestedProps = {
  ownerName: string;
  villaName: string;
  phone?: string;
};

export default function SubmissionCallRequested({
  ownerName,
  villaName,
  phone = "+596 696 00 00 00",
}: SubmissionCallRequestedProps) {
  return (
    <EmailLayout preview={`Appel souhaité — ${villaName}`}>
      <Text style={title}>Bonjour {ownerName},</Text>
      <Text>
        Nous souhaiterions échanger avec vous au sujet de <strong>{villaName}</strong>.
      </Text>
      <Text>
        Pouvez-vous nous appeler au <strong>{phone}</strong> ?
      </Text>
      <Text style={detail}>
        Nous sommes disponibles du lundi au samedi, de 8h à 18h (heure Martinique).
      </Text>
    </EmailLayout>
  );
}

const title = { color: "#0a1929", fontSize: "20px", margin: "0 0 16px" };
const detail = { color: "#64748b", fontSize: "14px", fontStyle: "italic" };
