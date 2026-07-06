"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "kayvila-cookie-consent";

type ConsentState = {
  essentials: true;
  analytics: boolean;
  marketing: boolean;
};

const STRINGS = {
  fr: {
    description: "Kayvila utilise des cookies pour améliorer votre expérience. Vous pouvez personnaliser vos préférences.",
    acceptAll: "Tout accepter",
    rejectAll: "Tout refuser",
    customize: "Personnaliser",
    save: "Enregistrer",
    essentials: "Essentiels",
    analytics: "Analytics",
    marketing: "Marketing",
    cookiePolicy: "Politique cookies",
  },
  en: {
    description: "Kayvila uses cookies to improve your experience. You can customize your preferences.",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    customize: "Customize",
    save: "Save",
    essentials: "Essential",
    analytics: "Analytics",
    marketing: "Marketing",
    cookiePolicy: "Cookie policy",
  },
  es: {
    description: "Kayvila utiliza cookies para mejorar su experiencia. Puede personalizar sus preferencias.",
    acceptAll: "Aceptar todo",
    rejectAll: "Rechazar todo",
    customize: "Personalizar",
    save: "Guardar",
    essentials: "Esenciales",
    analytics: "Analytics",
    marketing: "Marketing",
    cookiePolicy: "Política de cookies",
  },
} as const;

type Locale = keyof typeof STRINGS;

function getLocale(): Locale {
  try {
    const stored = localStorage.getItem("dn_locale") as Locale | null;
    if (stored && stored in STRINGS) return stored;
  } catch {}
  return "fr";
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [locale, setLocale] = useState<Locale>("fr");
  const [prefs, setPrefs] = useState<ConsentState>({ essentials: true, analytics: false, marketing: false });

  useEffect(() => {
    setLocale(getLocale());
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function save(consent: ConsentState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  const s = STRINGS[locale];
  const cookiesPath = locale === "en" ? "/en/cookies" : locale === "es" ? "/es/cookies" : "/cookies";

  return (
    <div
      role="dialog"
      aria-label={s.cookiePolicy}
      aria-modal="true"
      className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up border-t border-navy/10 bg-offwhite px-4 py-5 shadow-lg sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-none sm:border"
    >
      <p className="text-[11px] leading-relaxed text-navy/70">
        {s.description}{" "}
        <Link href={cookiesPath} className="underline underline-offset-2 hover:text-navy">
          {s.cookiePolicy}
        </Link>
      </p>

      {customizing && (
        <div className="mt-3 space-y-2 border-t border-navy/10 pt-3">
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>{s.essentials}</span>
            <input type="checkbox" checked disabled className="accent-gold" />
          </label>
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>{s.analytics}</span>
            <input
              type="checkbox"
              checked={prefs.analytics}
              onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
              className="accent-gold"
            />
          </label>
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>{s.marketing}</span>
            <input
              type="checkbox"
              checked={prefs.marketing}
              onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
              className="accent-gold"
            />
          </label>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => save({ essentials: true, analytics: true, marketing: true })}
          className="min-h-[44px] bg-gold px-4 text-[11px] font-semibold text-white transition-colors hover:bg-gold/90"
        >
          {s.acceptAll}
        </button>
        <button
          onClick={() => save({ essentials: true, analytics: false, marketing: false })}
          className="min-h-[44px] border border-navy/15 px-4 text-[11px] text-navy/70 transition-colors hover:bg-navy/5"
        >
          {s.rejectAll}
        </button>
        {!customizing ? (
          <button
            onClick={() => setCustomizing(true)}
            className="min-h-[44px] px-4 text-[11px] text-navy/50 underline underline-offset-2"
          >
            {s.customize}
          </button>
        ) : (
          <button
            onClick={() => save(prefs)}
            className="min-h-[44px] border border-navy/15 px-4 text-[11px] text-navy/70 transition-colors hover:bg-navy/5"
          >
            {s.save}
          </button>
        )}
      </div>
    </div>
  );
}
