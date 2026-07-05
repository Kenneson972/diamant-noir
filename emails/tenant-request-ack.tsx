import { Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";

export type TenantRequestAckProps = {
  label: string;
};

export default function TenantRequestAckEmail({ label }: TenantRequestAckProps) {
  return (
    <EmailLayout preview={`Reçu — ${label}`}>
      <Text style={greeting}>Bonjour,</Text>
      <Text style={body}>
        Nous avons bien reçu votre demande <strong>« {label} »</strong>.
      </Text>
      <Text style={body}>
        Notre équipe revient vers vous très rapidement.
      </Text>
      <Text style={signature}>L&apos;équipe Kayvila</Text>
    </EmailLayout>
  );
}

const greeting = { color: "#0a1929", fontSize: "22px", margin: "0 0 4px" };
const body = { color: "#334155", fontSize: "15px", lineHeight: "1.75", margin: "0 0 16px" };
const signature = { color: "#64748b", fontSize: "14px", margin: "24px 0 0" };
