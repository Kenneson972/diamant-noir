import { CONFIDENTIALITE_TEXT } from "@/lib/legal";

/** Contenu prose de la politique de confidentialité — page /confidentialite + modal checkout. */
export function ConfidentialiteContent() {
  return (
    <div className="text-navy/70">
      <p className="mb-6">{CONFIDENTIALITE_TEXT.protection}</p>
      <p className="mb-6 text-sm text-navy/80">{CONFIDENTIALITE_TEXT.rgpd}</p>
    </div>
  );
}
