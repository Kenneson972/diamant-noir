"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "kayvila-cookie-consent";

type ConsentState = {
  essentials: true;
  analytics: boolean;
  marketing: boolean;
};

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [prefs, setPrefs] = useState<ConsentState>({ essentials: true, analytics: false, marketing: false });

  useEffect(() => {
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

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      aria-modal="true"
      className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up border-t border-navy/10 bg-offwhite px-4 py-5 shadow-lg sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-none sm:border"
    >
      <p className="text-[11px] leading-relaxed text-navy/70">
        Kayvila utilise des cookies pour améliorer votre expérience. Vous pouvez
        personnaliser vos préférences.
      </p>

      {customizing && (
        <div className="mt-3 space-y-2 border-t border-navy/10 pt-3">
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>Essentiels</span>
            <input type="checkbox" checked disabled className="accent-gold" />
          </label>
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>Analytics</span>
            <input
              type="checkbox"
              checked={prefs.analytics}
              onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
              className="accent-gold"
            />
          </label>
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>Marketing</span>
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
          className="h-9 bg-gold px-4 text-[11px] font-semibold text-white transition-colors hover:bg-gold/90"
        >
          Tout accepter
        </button>
        <button
          onClick={() => save({ essentials: true, analytics: false, marketing: false })}
          className="h-9 border border-navy/15 px-4 text-[11px] text-navy/70 transition-colors hover:bg-navy/5"
        >
          Tout refuser
        </button>
        {!customizing ? (
          <button
            onClick={() => setCustomizing(true)}
            className="h-9 px-4 text-[11px] text-navy/50 underline underline-offset-2"
          >
            Personnaliser
          </button>
        ) : (
          <button
            onClick={() => save(prefs)}
            className="h-9 border border-navy/15 px-4 text-[11px] text-navy/70 transition-colors hover:bg-navy/5"
          >
            Enregistrer
          </button>
        )}
      </div>
    </div>
  );
}
