import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { VillaCreateForm } from "@/components/dashboard/villa-editor/VillaCreateForm";

export const metadata: Metadata = {
  title: "Ajouter une villa — Administration Kayvila",
};

export default function AdminAddVillaPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/villas"
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Toutes les villas
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Ajouter une villa</h1>
        <p className="mt-1 text-sm text-muted">
          Renseignez la carte d&apos;identité. La villa est créée en brouillon non publié —
          le reste se complète dans l&apos;éditeur.
        </p>
      </div>
      <VillaCreateForm redirectBase="/admin/villas" />
    </div>
  );
}
