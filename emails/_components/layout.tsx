import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { SITE_BRAND_DISPLAY } from "@/data/site-brand";

const LOGO_URL =
  "https://wsdawdxucyuyopkpgjij.supabase.co/storage/v1/object/public/brand/DN3-Photoroom.png";

const FOOTER_BANNER_URL =
  "https://wsdawdxucyuyopkpgjij.supabase.co/storage/v1/object/public/brand/hf_20260607_202403_3eba3c06-74d5-4e1c-8688-324d25b6bfc4.png";

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
            <Img src={LOGO_URL} width="120" height="auto" alt={SITE_BRAND_DISPLAY} style={logo} />
            <Hr style={goldLine} />
          </Section>
          <Section style={content}>{children}</Section>
          <Img src={FOOTER_BANNER_URL} width="100%" alt="" style={banner} />
          <Text style={footer}>
            {SITE_BRAND_DISPLAY} — Conciergerie en Martinique
            <br />
            <span style={footerMeta}>Cet email a été envoyé automatiquement.</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#fafaf8",
  fontFamily: "Georgia, serif",
  margin: 0,
  padding: "32px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "520px",
};

const header = {
  padding: "40px 48px 0",
  textAlign: "center" as const,
};

const logo = {
  display: "block",
  margin: "0 auto",
};

const goldLine = {
  borderColor: "#d4af37",
  borderStyle: "solid" as const,
  margin: "20px auto 0",
  width: "40px",
};

const content = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "1.75",
  padding: "32px 48px 20px",
};

const banner = {
  display: "block",
  width: "100%",
};

const footer = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "1.8",
  padding: "16px 48px 36px",
  textAlign: "center" as const,
};

const footerMeta = {
  color: "#94a3b8",
  fontSize: "11px",
};
