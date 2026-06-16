"use client";

import { Home } from "lucide-react";
import { KayvilaEmptyState } from "@/components/ui/pro";

export function EmptyDashboard() {
  return (
    <KayvilaEmptyState
      icon={<Home />}
      title="Bienvenue sur votre espace"
      description="Vous n'avez pas encore de villa. Ajoutez votre première propriété pour commencer."
      actionLabel="Ajouter ma première villa"
      actionHref="/dashboard/villas/nouvelle"
      className="flex min-h-[60vh] items-center justify-center border-0 bg-transparent p-4"
    />
  );
}
