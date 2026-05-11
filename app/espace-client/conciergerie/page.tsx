import { PageTopbar } from "@/components/espace-client/PageTopbar";
import { Phone, Mail, Clock, AlertTriangle } from "lucide-react";

const CONTACTS = [
  {
    label: "Urgences 24h/24",
    value: "+596 696 00 00 00",
    sub: "Disponible en permanence",
    href: "tel:+596696000000",
    icon: AlertTriangle,
    gold: true,
  },
  {
    label: "Téléphone",
    value: "+596 696 00 00 00",
    sub: "Lun – Sam, 8h – 20h",
    href: "tel:+596696000000",
    icon: Phone,
    gold: false,
  },
  {
    label: "Email",
    value: "contact@kayvila.com",
    sub: "Réponse sous 24h",
    href: "mailto:contact@kayvila.com",
    icon: Mail,
    gold: false,
  },
];

const HOURS = [
  { day: "Lundi – Vendredi", hours: "8h00 – 20h00" },
  { day: "Samedi", hours: "9h00 – 18h00" },
  { day: "Dimanche & jours fériés", hours: "Urgences uniquement" },
];

export default function ConciergeriePage() {
  return (
    <>
      <PageTopbar title="Conciergerie" />
      <div className="space-y-10">
        {/* Header */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Conciergerie
          </p>
          <h1 className="font-display text-2xl font-normal text-navy mt-2 leading-none">
            Contacts &amp; urgences
          </h1>
          <span className="mt-3 block h-px w-8 bg-gold/50" />
          <p className="font-display italic text-[15px] font-light text-navy/40 mt-3">
            Notre équipe est à votre disposition avant, pendant et après votre séjour.
          </p>
        </div>

        {/* Contacts */}
        <div className="space-y-[1px] border border-navy/[0.07] bg-navy/[0.04]">
          {CONTACTS.map(({ label, value, sub, href, icon: Icon, gold }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-5 bg-offwhite px-6 py-5 no-underline hover:bg-white transition-colors group"
            >
              <Icon
                size={16}
                strokeWidth={1.25}
                className={gold ? "text-gold shrink-0" : "text-navy/25 shrink-0 group-hover:text-gold/60 transition-colors"}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-[9px] font-bold uppercase tracking-[0.28em] mb-0.5 ${gold ? "text-gold" : "text-navy/40"}`}>
                  {label}
                </p>
                <p className={`text-[14px] font-medium ${gold ? "text-navy" : "text-navy"}`}>
                  {value}
                </p>
                <p className="font-display italic text-[13px] font-light text-navy/35 mt-0.5">
                  {sub}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Horaires */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={13} strokeWidth={1.25} className="text-navy/25" />
            <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-navy/35">
              Horaires
            </p>
          </div>
          <div className="divide-y divide-navy/[0.06] border border-navy/[0.07] bg-white">
            {HOURS.map(({ day, hours }) => (
              <div key={day} className="flex items-center justify-between px-5 py-3.5">
                <p className="text-[11px] text-[rgba(13,27,42,0.55)]">{day}</p>
                <p className="text-[11px] font-medium text-navy">{hours}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Services ponctuels */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold mb-4">Services ponctuels</p>
          <div className="space-y-[1px] border border-navy/[0.07] bg-navy/[0.04]">
            {[
              { label: "Ménage supplémentaire", price: "À partir de 80 €", desc: "Nettoyage complet en cours de séjour" },
              { label: "Changement de linge", price: "À partir de 40 €", desc: "Draps, serviettes, torchons renouvelés" },
              { label: "Remplissage gaz / eau", price: "Sur devis", desc: "Bouteille de gaz ou bonbonne d'eau remplacée" },
            ].map((s) => (
              <a
                key={s.label}
                href="/espace-client/demandes"
                className="flex items-center justify-between bg-offwhite px-5 py-4 no-underline hover:bg-white transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-navy">{s.label}</p>
                  <p className="text-[11px] text-navy/40 mt-0.5">{s.desc}</p>
                </div>
                <span className="text-[11px] font-semibold text-navy/50 group-hover:text-gold transition-colors shrink-0 ml-4">{s.price} →</span>
              </a>
            ))}
          </div>
          <p className="text-[11px] text-navy/30 mt-2">Cliquez pour faire une demande — l&apos;équipe Kayvila vous confirmera le tarif exact.</p>
        </div>

        {/* Note */}
        <p className="text-[11px] text-navy/35 leading-relaxed border-t border-navy/[0.06] pt-6">
          Pour toute demande non urgente, privilégiez la messagerie ci-dessous — elle conserve un historique de votre échange avec notre équipe.
        </p>
      </div>
    </>
  );
}
