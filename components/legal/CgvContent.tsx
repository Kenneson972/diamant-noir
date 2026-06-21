import { CGV_TEXT } from "@/lib/legal";

/** Contenu prose des CGV — utilisé par la page /cgv (variante simple) et le modal checkout. */
export function CgvContent() {
  return (
    <div className="text-navy/70">
      <h2 className="mb-2 mt-6 font-display text-lg text-navy first:mt-0">Objet</h2>
      <p className="mb-6">{CGV_TEXT.objet}</p>
      <h2 className="mb-2 mt-6 font-display text-lg text-navy">Réservation &amp; paiement</h2>
      <p className="mb-6">{CGV_TEXT.reservationPaiement}</p>
      <h2 className="mb-2 mt-6 font-display text-lg text-navy">Annulation</h2>
      <p className="mb-6">{CGV_TEXT.annulation}</p>
      <h2 className="mb-2 mt-6 font-display text-lg text-navy">Responsabilité</h2>
      <p className="mb-6">{CGV_TEXT.responsabilite}</p>
    </div>
  );
}
