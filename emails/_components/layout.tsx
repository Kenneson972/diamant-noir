import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { SITE_BRAND_DISPLAY } from "@/data/site-brand";

type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>{SITE_BRAND_DISPLAY.toUpperCase()}</Heading>
          </Section>
          <Section style={content}>{children}</Section>
          <Hr style={hr} />
          <Text style={footer}>
            {SITE_BRAND_DISPLAY} Conciergerie — Martinique
            <br />
            Cet email a été envoyé automatiquement.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f8fafc",
  fontFamily: "Georgia, 'Playfair Display', serif",
  margin: 0,
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "4px",
  margin: "0 auto",
  maxWidth: "480px",
  overflow: "hidden" as const,
};

const header = {
  backgroundColor: "#0a1929",
  padding: "24px 32px",
};

const logo = {
  color: "#d4af37",
  fontSize: "22px",
  fontWeight: 400,
  letterSpacing: "0.2em",
  margin: 0,
  textAlign: "center" as const,
};

const content = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "1.6",
  padding: "28px 32px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "0 32px",
};

const footer = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.5",
  padding: "16px 32px 24px",
  textAlign: "center" as const,
};
