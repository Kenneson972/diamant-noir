import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { SITE_BRAND_DISPLAY } from "@/data/site-brand";

const EMAIL_BANNER_URL =
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
          <Img src={EMAIL_BANNER_URL} width="100%" alt={SITE_BRAND_DISPLAY} style={banner} />
          <Section style={content}>{children}</Section>
          <Hr style={hr} />
          <Text style={footer}>
            {SITE_BRAND_DISPLAY} — Conciergerie en Martinique
            <br />
            Cet email a été envoyé automatiquement. Pour toute question, contactez-nous.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#fafaf8",
  fontFamily: "Georgia, 'Playfair Display', serif",
  margin: 0,
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "560px",
};

const banner = {
  display: "block",
  width: "100%",
  maxWidth: "560px",
};

const content = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "1.7",
  padding: "32px 36px 4px",
};

const hr = {
  borderColor: "#d4af37",
  borderStyle: "solid",
  margin: "24px 36px 0",
};

const footer = {
  color: "#94a3b8",
  fontSize: "11px",
  lineHeight: "1.6",
  padding: "12px 36px 28px",
  textAlign: "center" as const,
};
