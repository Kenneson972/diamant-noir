import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import frCommon from './locales/fr/common.json';
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';
import itCommon from './locales/it/common.json';

import frHome from './locales/fr/home.json';
import enHome from './locales/en/home.json';
import esHome from './locales/es/home.json';
import itHome from './locales/it/home.json';

import frProduct from './locales/fr/product.json';
import enProduct from './locales/en/product.json';
import esProduct from './locales/es/product.json';
import itProduct from './locales/it/product.json';

import frAccount from './locales/fr/account.json';
import enAccount from './locales/en/account.json';
import esAccount from './locales/es/account.json';
import itAccount from './locales/it/account.json';

import frSav from './locales/fr/sav.json';
import enSav from './locales/en/sav.json';
import esSav from './locales/es/sav.json';
import itSav from './locales/it/sav.json';

import frCart from './locales/fr/cart.json';
import enCart from './locales/en/cart.json';
import esCart from './locales/es/cart.json';
import itCart from './locales/it/cart.json';

const resources = {
  fr: {
    common: frCommon,
    home: frHome,
    product: frProduct,
    account: frAccount,
    sav: frSav,
    cart: frCart,
  },
  en: {
    common: enCommon,
    home: enHome,
    product: enProduct,
    account: enAccount,
    sav: enSav,
    cart: enCart,
  },
  es: {
    common: esCommon,
    home: esHome,
    product: esProduct,
    account: esAccount,
    sav: esSav,
    cart: esCart,
  },
  it: {
    common: itCommon,
    home: itHome,
    product: itProduct,
    account: itAccount,
    sav: itSav,
    cart: itCart,
  },
};

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: 'fr',
    defaultNS: 'common',
    ns: ['common', 'home', 'product', 'account', 'sav', 'cart'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
    },
  });

export default i18n;
