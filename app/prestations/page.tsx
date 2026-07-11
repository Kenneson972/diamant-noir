"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/contexts/LocaleContext";

const PrestationsPageClient = dynamic(
  () => import("./PrestationsPageClient"),
  {
    ssr: false,
    loading: PrestationsPageLoading,
  },
);

function PrestationsPageLoading() {
  const { t } = useLocale();
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-navy px-4 text-center text-white"
      role="status"
      aria-live="polite"
      aria-label={t("prestations.loading_aria")}
    >
      <p className="font-display text-[9px] uppercase tracking-[0.35em] text-gold/60">
        {t("prestations.loading_eyebrow")}
      </p>
      <p className="mt-3 font-display text-xl tracking-wide">{t("prestations.loading_title")}</p>
      <p className="mt-4 text-[10px] text-white/40">{t("prestations.loading_text")}</p>
    </div>
  );
}

export default function PrestationsPage() {
  return <PrestationsPageClient />;
}
