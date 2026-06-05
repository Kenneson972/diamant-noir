import { redirect } from "next/navigation";

/** Ancienne URL conservée : tout le contenu « formule » est sur /prestations */
export default function NosFormulesRedirectPage() {
  redirect("/prestations");
}
