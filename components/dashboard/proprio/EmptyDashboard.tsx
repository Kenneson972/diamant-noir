"use client";

import { Home } from "lucide-react";
import { KayvilaEmptyState } from "@/components/ui/pro";

export function EmptyDashboard() {
  return (
    <KayvilaEmptyState
      icon={<Home />}
      title="Bienvenue sur votre espace"
      description="Vous n'avez pas encore de villa. Contactez votre gestionnaire pour configurer votre première propriété."
      actionLabel="Contacter le gestionnaire"
      actionHref="/contact"
      className="flex min-h-[60vh] items-center justify-center border-0 bg-transparent p-4"
    />
  );
}
