"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Locale,
  Currency,
  SUPPORTED_LOCALES,
  SUPPORTED_CURRENCIES,
  DEFAULT_LOCALE,
  DEFAULT_CURRENCY,
  formatPrice as formatPriceUtil,
  t as tUtil,
} from "@/lib/i18n";

const STORAGE_PREFIX = "dn_";

function getPersisted(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_PREFIX + key) ?? null;
  } catch {
    return null;
  }
}

function setPersisted(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, value);
  } catch {
    // localStorage peut être bloqué (navigation privée)
  }
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
}

type LocaleContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  t: (key: string) => string;
  formatPrice: (amount: number) => string;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

type LocaleProviderProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialCurrency?: Currency;
};

function isLocale(value: string | null): value is Locale {
  return Boolean(value) && SUPPORTED_LOCALES.includes(value as Locale);
}

function isCurrency(value: string | null): value is Currency {
  return Boolean(value) && SUPPORTED_CURRENCIES.includes(value as Currency);
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
  initialCurrency = DEFAULT_CURRENCY,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);

  useEffect(() => {
    const l = getPersisted("locale");
    const c = getPersisted("currency");
    if (isLocale(l) && l !== locale) setLocaleState(l);
    if (isCurrency(c) && c !== currency) setCurrencyState(c);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setPersisted("locale", l);
    setCookie("dn_locale", l);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    setPersisted("currency", c);
    setCookie("dn_currency", c);
  }, []);

  const t = useCallback((key: string) => tUtil(locale, key), [locale]);
  const formatPrice = useCallback((amount: number) => formatPriceUtil(amount, currency), [currency]);

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, currency, setCurrency, t, formatPrice }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
