import { Text, Section } from "@react-email/components";
import { EmailLayout } from "./_components/layout";

export type AdminProactiveSummaryProps = {
  title: string;
  blocks: { label: string; items: string[] }[];
};

export default function AdminProactiveSummaryEmail({
  title,
  blocks,
}: AdminProactiveSummaryProps) {
  return (
    <EmailLayout preview={title}>
      <Text style={heading}>{title}</Text>
      {blocks.map((block, i) => (
        <Section key={i} style={blockSection}>
          <Text style={blockLabel}>{block.label}</Text>
          {block.items.map((item, j) => (
            <Text key={j} style={itemText}>
              {item}
            </Text>
          ))}
        </Section>
      ))}
    </EmailLayout>
  );
}

const heading = {
  color: "#0a1929",
  fontSize: "20px",
  margin: "0 0 20px",
};

const blockSection = {
  margin: "0 0 20px",
};

const blockLabel = {
  color: "#d4af37",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const itemText = {
  color: "#334155",
  fontSize: "14px",
  lineHeight: "1.7",
  margin: "0 0 4px",
};
