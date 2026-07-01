import { PageTopbar } from "@/components/espace-client/PageTopbar";
import { TenantSectionHeader } from "@/components/espace-client/TenantSectionHeader";
import { KayvilaTenantWidget } from "@/components/ui/pro";
import { AlertTriangle } from "lucide-react";
import { KayvilaPngIcon, type KayvilaPngName } from "@/components/icons/KayvilaPngIcon";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

const CONTACTS: { label: string; value: string; sub: string; href: string; icon: LucideIcon | KayvilaPngName; gold: boolean }[] = [
  {
    label: "Urgences 24h/24",
    value: "+596 696 68 18 69",
    sub: "Disponible en permanence",
    href: "tel:+596696681869",
    icon: AlertTriangle,
    gold: true,
  },
  {
    label: "Téléphone",
    value: "+596 696 68 18 69",
    sub: "Lun – Sam, 8h – 20h",
    href: "tel:+596696681869",
    icon: "phone",
    gold: false,
  },
  {
    label: "Email",
    value: "contact@kayvila.com",
    sub: "Réponse sous 24h",
    href: "mailto:contact@kayvila.com",
    icon: "mail",
    gold: false,
  },
];

const HOURS = [
  { day: "Lundi – Vendredi", hours: "8h00 – 20h00" },
  { day: "Samedi", hours: "9h00 – 18h00" },
  { day: "Dimanche & jours fériés", hours: "Urgences uniquement" },
];

const SERVICES = [
  { label: "Ménage supplémentaire", price: "À partir de 80 €", desc: "Nettoyage complet en cours de séjour" },
  { label: "Changement de linge", price: "À partir de 40 €", desc: "Draps, serviettes, torchons renouvelés" },
  { label: "Remplissage gaz / eau", price: "Sur devis", desc: "Bouteille de gaz ou bonbonne d'eau remplacée" },
];

export default function ConciergeriePage() {
  return (
    <>
      <PageTopbar title="Conciergerie" />
      <div className="mx-auto max-w-2xl space-y-8">
        <TenantSectionHeader
          eyebrow="Conciergerie"
          title="Contacts & urgences"
          description="Notre équipe est à votre disposition avant, pendant et après votre séjour."
        />

        <KayvilaTenantWidget title="Nous joindre">
          <div className="divide-y divide-navy/5 -mx-6 -my-5">
            {CONTACTS.map(({ label, value, sub, href, icon: Icon, gold }) => (
              <a
                key={label}
                href={href}
                className="flex items-center gap-5 px-6 py-5 no-underline transition-colors hover:bg-navy/[0.02] group"
              >
                {typeof Icon === "string" ? (
                  <KayvilaPngIcon name={Icon} size={20} alt="" className={gold ? "shrink-0" : "shrink-0 opacity-60 transition-opacity group-hover:opacity-90"} />
                ) : (
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    className={
                      gold ? "shrink-0 text-gold" : "shrink-0 text-navy/50 transition-colors group-hover:text-gold/60"
                    }
                    aria-hidden
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`mb-0.5 text-[9px] font-bold uppercase tracking-[0.28em] ${gold ? "text-gold" : "text-navy/55"}`}>
                    {label}
                  </p>
                  <p className="text-[14px] font-medium text-navy">{value}</p>
                  <p className="mt-0.5 font-display text-[13px] font-light italic text-navy/50">{sub}</p>
                </div>
              </a>
            ))}
          </div>
        </KayvilaTenantWidget>

        <KayvilaTenantWidget
          title="Horaires"
          action={<KayvilaPngIcon name="clock" size={18} alt="" className="opacity-60" />}
        >
          <div className="divide-y divide-navy/5">
            {HOURS.map(({ day, hours }) => (
              <div key={day} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <p className="text-[11px] text-navy/55">{day}</p>
                <p className="text-[11px] font-medium text-navy">{hours}</p>
              </div>
            ))}
          </div>
        </KayvilaTenantWidget>

        <KayvilaTenantWidget title="Services ponctuels" description="Cliquez pour faire une demande — tarif confirmé par l'équipe">
          <div className="divide-y divide-navy/5 -mx-6 -my-5">
            {SERVICES.map((s) => (
              <Link
                key={s.label}
                href="/espace-client/demandes"
                className="flex items-center justify-between px-6 py-4 no-underline transition-colors hover:bg-navy/[0.02] group"
              >
                <div>
                  <p className="text-sm font-medium text-navy">{s.label}</p>
                  <p className="mt-0.5 text-[11px] text-navy/55">{s.desc}</p>
                </div>
                <span className="ml-4 shrink-0 text-[11px] font-semibold text-navy/50 transition-colors group-hover:text-gold">
                  {s.price} →
                </span>
              </Link>
            ))}
          </div>
        </KayvilaTenantWidget>

        <p className="border-t border-navy/[0.06] pt-6 text-[11px] leading-relaxed text-navy/50">
          Pour toute demande non urgente, privilégiez la messagerie — elle conserve un historique de votre échange avec
          notre équipe.
        </p>
      </div>
    </>
  );
}
