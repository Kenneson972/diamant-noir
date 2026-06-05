import { redirect } from "next/navigation";

/** Parrainage désactivé — redirection vers l'accueil espace client. */
export default function ParrainagePage() {
  redirect("/espace-client");
}
