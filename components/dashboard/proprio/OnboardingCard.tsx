import Link from "next/link";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

const STEPS = [
  { label: "Compléter les photos de ma villa", href: "/dashboard/villas", icon: "home" },
  { label: "Vérifier mes tarifs et prix saisonniers", href: "/dashboard/villas", icon: "star" },
  { label: "Synchroniser mon calendrier (Airbnb, Booking)", href: "/dashboard/villas", icon: "calendar" },
  { label: "Ajouter le livret d'accueil", href: "/dashboard/villas", icon: "book" },
] as const;

export function OnboardingCard() {
  return (
    <section className="dashboard-card" data-testid="onboarding-card">
      <span className="dashboard-eyebrow">CONFIGURER MA VILLA</span>
      <p className="mt-2 text-sm text-navy/55">
        Votre espace est prêt. Quelques étapes pour maximiser vos réservations :
      </p>
      <ul className="mt-4 divide-y divide-navy/5">
        {STEPS.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="group flex min-h-[48px] items-center gap-3 py-2 text-sm text-navy no-underline transition-colors hover:text-gold"
            >
              <KayvilaPngIcon name={step.icon} size={18} alt="" className="shrink-0 opacity-60" />
              <span className="flex-1">{step.label}</span>
              <KayvilaPngIcon
                name="arrow-right"
                size={18}
                alt=""
                className="shrink-0 opacity-40 transition-opacity group-hover:opacity-80"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
