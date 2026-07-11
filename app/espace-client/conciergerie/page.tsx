import { headers } from "next/headers";
import { TenantSectionHeader } from "@/components/espace-client/TenantSectionHeader";
import { KayvilaTenantWidget } from "@/components/ui/pro";
import { AlertTriangle } from "lucide-react";
import { KayvilaPngIcon, type KayvilaPngName } from "@/components/icons/KayvilaPngIcon";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { KAYVILA_EMAIL, KAYVILA_PHONE_DISPLAY, KAYVILA_PHONE_TEL } from "@/lib/constants";
import { getServerLocale, tServer } from "@/lib/i18n";

function buildContacts(t: (key: string) => string): {
  label: string;
  value: string;
  sub: string;
  href: string;
  icon: LucideIcon | KayvilaPngName;
  gold: boolean;
}[] {
  return [
    {
      label: t("client.conciergerie_emergency_label"),
      value: KAYVILA_PHONE_DISPLAY,
      sub: t("client.conciergerie_emergency_sub"),
      href: `tel:${KAYVILA_PHONE_TEL}`,
      icon: AlertTriangle,
      gold: true,
    },
    {
      label: t("client.conciergerie_phone_label"),
      value: KAYVILA_PHONE_DISPLAY,
      sub: t("client.conciergerie_phone_sub"),
      href: `tel:${KAYVILA_PHONE_TEL}`,
      icon: "phone",
      gold: false,
    },
    {
      label: t("client.conciergerie_email_label"),
      value: KAYVILA_EMAIL,
      sub: t("client.conciergerie_email_sub"),
      href: `mailto:${KAYVILA_EMAIL}`,
      icon: "mail",
      gold: false,
    },
  ];
}

function buildHours(t: (key: string) => string) {
  return [
    { day: t("client.conciergerie_hours_weekdays"), hours: t("client.conciergerie_hours_weekdays_value") },
    { day: t("client.conciergerie_hours_saturday"), hours: t("client.conciergerie_hours_saturday_value") },
    { day: t("client.conciergerie_hours_sunday"), hours: t("client.conciergerie_hours_sunday_value") },
  ];
}

function buildServices(t: (key: string) => string) {
  return [
    {
      label: t("client.conciergerie_service_cleaning_label"),
      price: t("client.conciergerie_service_cleaning_price"),
      desc: t("client.conciergerie_service_cleaning_desc"),
    },
    {
      label: t("client.conciergerie_service_linen_label"),
      price: t("client.conciergerie_service_linen_price"),
      desc: t("client.conciergerie_service_linen_desc"),
    },
    {
      label: t("client.conciergerie_service_refill_label"),
      price: t("client.conciergerie_service_refill_price"),
      desc: t("client.conciergerie_service_refill_desc"),
    },
  ];
}

export default async function ConciergeriePage() {
  const locale = getServerLocale(await headers());
  const t = (key: string) => tServer(locale, key);
  const CONTACTS = buildContacts(t);
  const HOURS = buildHours(t);
  const SERVICES = buildServices(t);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
        <TenantSectionHeader
          title={t("client.conciergerie_title")}
          description={t("client.conciergerie_desc")}
        />

        <KayvilaTenantWidget title={t("client.conciergerie_reach_us")}>
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
          title={t("client.conciergerie_hours_title")}
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

        <KayvilaTenantWidget title={t("client.conciergerie_services_title")} description={t("client.conciergerie_services_desc")}>
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
          {t("client.conciergerie_footer_note")}
        </p>
    </div>
  );
}
