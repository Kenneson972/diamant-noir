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

const COOKIE_LOCALE = "dn_locale";
const COOKIE_CURRENCY = "dn_currency";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};path=/;max-age=${days * 24 * 60 * 60};SameSite=Lax`;
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
    const l = getCookie(COOKIE_LOCALE);
    const c = getCookie(COOKIE_CURRENCY);
    if (isLocale(l) && l !== locale) setLocaleState(l);
    if (isCurrency(c) && c !== currency) setCurrencyState(c);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setCookie(COOKIE_LOCALE, l);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    setCookie(COOKIE_CURRENCY, c);
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
