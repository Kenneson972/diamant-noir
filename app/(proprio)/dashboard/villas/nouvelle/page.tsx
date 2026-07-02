import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { VillaEditor } from "@/components/dashboard/villa-editor/VillaEditor";

export const metadata: Metadata = {
  title: "Ajouter une villa — Kayvila",
};

export default function NewVillaPage() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/villas"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux villas
      </Link>

      {/* Title */}
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Ajouter une villa
        </h1>
        <p className="mt-1 text-sm text-muted">
          Renseignez les informations principales. La villa sera créée en mode
          non publiée — vous pourrez ensuite ajouter les photos et la soumettre à
          votre gestionnaire.
        </p>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <VillaEditor />
        </div>
      </div>
    </div>
  );
}
