import type { ReactNode } from "react";
import { OwnerSidebar } from "./OwnerSidebar";
import { OwnerHeader } from "./OwnerHeader";
import { CopilotProvider } from "./CopilotContext";
import { CopilotButton } from "./CopilotButton";
import { CopilotPanel } from "./CopilotPanel";

interface OwnerLayoutProps {
  children: ReactNode;
}

export function OwnerLayout({ children }: OwnerLayoutProps) {
  return (
    <CopilotProvider>
      {/* Skip link — premier élément tabulable */}
      <a
        href="#proprio-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg"
      >
        Aller au contenu principal
      </a>

      <div className="min-h-screen bg-cream">
        <OwnerSidebar />
        <div className="lg:pl-60">
          <OwnerHeader />
          <main id="proprio-main" role="main" aria-label="Contenu principal du tableau de bord" className="p-6 lg:p-8">{children}</main>
        </div>
        <CopilotButton />
        <CopilotPanel />
      </div>
    </CopilotProvider>
  );
}
