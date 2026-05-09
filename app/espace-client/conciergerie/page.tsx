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
          <p className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#D4AF37]">
            Conciergerie
          </p>
          <h1 className="font-display text-2xl font-normal text-[#0D1B2A] mt-2 leading-none">
            Contacts &amp; urgences
          </h1>
          <span className="mt-3 block h-px w-8 bg-[rgba(212,175,55,0.5)]" />
          <p className="font-display italic text-[15px] font-light text-[rgba(13,27,42,0.4)] mt-3">
            Notre équipe est à votre disposition avant, pendant et après votre séjour.
          </p>
        </div>

        {/* Contacts */}
        <div className="space-y-[1px] border border-[rgba(13,27,42,0.07)] bg-[rgba(13,27,42,0.04)]">
          {CONTACTS.map(({ label, value, sub, href, icon: Icon, gold }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-5 bg-[#FAFAF8] px-6 py-5 no-underline hover:bg-white transition-colors group"
            >
              <Icon
                size={16}
                strokeWidth={1.25}
                className={gold ? "text-[#D4AF37] shrink-0" : "text-[rgba(13,27,42,0.22)] shrink-0 group-hover:text-[rgba(212,175,55,0.6)] transition-colors"}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-[9px] font-bold uppercase tracking-[0.28em] mb-0.5 ${gold ? "text-[#D4AF37]" : "text-[rgba(13,27,42,0.4)]"}`}>
                  {label}
                </p>
                <p className={`text-[14px] font-medium ${gold ? "text-[#0D1B2A]" : "text-[#0D1B2A]"}`}>
                  {value}
                </p>
                <p className="font-display italic text-[13px] font-light text-[rgba(13,27,42,0.35)] mt-0.5">
                  {sub}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Horaires */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={13} strokeWidth={1.25} className="text-[rgba(13,27,42,0.25)]" />
            <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-[rgba(13,27,42,0.35)]">
              Horaires
            </p>
          </div>
          <div className="divide-y divide-[rgba(13,27,42,0.06)] border border-[rgba(13,27,42,0.07)] bg-white">
            {HOURS.map(({ day, hours }) => (
              <div key={day} className="flex items-center justify-between px-5 py-3.5">
                <p className="text-[11px] text-[rgba(13,27,42,0.55)]">{day}</p>
                <p className="text-[11px] font-medium text-[#0D1B2A]">{hours}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <p className="text-[11px] text-[rgba(13,27,42,0.35)] leading-relaxed border-t border-[rgba(13,27,42,0.06)] pt-6">
          Pour toute demande non urgente, privilégiez la messagerie ci-dessous — elle conserve un historique de votre échange avec notre équipe.
        </p>
      </div>
    </>
  );
}
