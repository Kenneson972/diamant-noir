import Link from "next/link";
import { Home } from "lucide-react";

export function EmptyDashboard() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-navy-900/5">
        <Home className="h-10 w-10 text-muted" aria-hidden />
      </div>
      <h2 className="font-display text-2xl font-semibold text-navy-900">
        Bienvenue sur votre espace
      </h2>
      <p className="mt-3 max-w-md text-muted">
        Vous n&apos;avez pas encore de villa. Contactez votre gestionnaire
        pour configurer votre première propriété.
      </p>
      <Link
        href="/contact"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-navy-900 px-8 text-sm font-medium text-white transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2"
      >
        Contacter le gestionnaire
      </Link>
    </div>
  );
}
