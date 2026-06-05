# Kayvilla — Prompts Cursor Post-Audit 29 Mai 2026

Généré par Élise après audit 5 sous-agents.
Stack : Next.js 15, TypeScript, Tailwind, Supabase, Stripe Connect.
Repo : /opt/data/repos/diamant-noir

---

## ✅ DÉJÀ FIXÉ (par Élise)

- `SearchResults.tsx` : `v.guests` → `v.capacity` (filtre capacité)
- `VillaSelectionCard.tsx` : `villa.guests` → `villa.capacity`
- `app/login/page.tsx` : open redirect fix (validation `redirectTo` relatif)

---

## BATCH 1 — 🚨 PRIX & PAIEMENT (2h)

### PROMPT 1.1 — cleaningFee depuis la DB

**Problème** : `cleaningFee` est hardcodé à 150€ dans `CheckoutView.tsx`, `BookingForm.tsx`, `PriceCalculator.tsx`. La DB a `villa.cleaning_fee_cents`.

**Fichiers à modifier** :
- `components/booking/CheckoutView.tsx` (l.143)
- `components/BookingForm.tsx` (l.179)
- `components/PriceCalculator.tsx` (l.44)

**À faire** :
1. Dans `CheckoutView.tsx`, remplacer `const cleaningFee = 150` par `const cleaningFee = (villa.cleaning_fee_cents || 0) / 100`
2. S'assurer que `villa.cleaning_fee_cents` est dans le type passé au composant
3. Faire de même dans `BookingForm.tsx` et `PriceCalculator.tsx`
4. Vérifier que l'API `/api/booking/route.ts` lit bien `villa.cleaning_fee_cents` (l.145) — c'est déjà bon côté serveur

### PROMPT 1.2 — Price Engine combinatoire

**Fichier** : `lib/price-engine.ts`

**Problème** : Seulement 3 cas discrets (semaine exacte, weekend exact, journalier). 8 nuits = 8000€ vs 7 nuits = 3000€. Absurde.

**À faire** :
1. Ajouter une logique combinatoire : N nuits = X semaines × tarif_semaine + Y weekends × tarif_weekend + Z jours × tarif_journalier
2. `isWeekendRange` → renommer en `countWeekendNights` qui couvre Ven-Dim ET Sam-Dim
3. Priorité : d'abord les semaines complètes (7 nuits), puis les weekends (2 nuits), puis les jours restants
4. Tests à ajouter dans le même fichier (commentaires avec exemples)

### PROMPT 1.3 — PriceCalculator affiche les frais réels

**Fichier** : `components/PriceCalculator.tsx`

**Problème** : `conciergeRate = 0` par défaut → pas de frais de service affichés. L'utilisateur voit un prix sur la fiche puis un prix plus élevé au checkout.

**À faire** :
1. Mettre `serviceFeePercent = 5` par défaut
2. Afficher les frais de service ET les frais de ménage dans le calculateur
3. Le prix total affiché doit correspondre au prix final checkout

---

## BATCH 2 — 🌐 I18N MASSIF (2-3 jours)

### PROMPT 2.1 — Middleware locale + tServer

**Fichiers** : `middleware.ts`, `lib/i18n.ts`

**Problème** : Le middleware n'a aucune logique de locale. Les server components ne peuvent pas savoir la langue.

**À faire** :
1. Dans `middleware.ts`, lire le cookie `dn_locale` et l'injecter dans les headers (ex: `x-dn-locale`)
2. Dans `lib/i18n.ts`, créer `tServer(locale: string, key: string, vars?: Record<string, string | number>): string`
3. Même logique que `t()` mais prend la locale en paramètre au lieu de `useLocale()`

### PROMPT 2.2 — Fiche villa server component

**Fichier** : `app/villas/[id]/page.tsx`

**Problème** : 100+ strings en français dur. Server component ne peut pas utiliser `useLocale()`.

**À faire** :
1. Lire `x-dn-locale` depuis `cookies()` ou `headers()`
2. Utiliser `tServer(locale, key)` pour tous les textes : description, expérience, concierge, équipements, chambres, disponibilités, alentours, recommandations
3. Ajouter les clés manquantes dans le dictionnaire `lib/i18n.ts`

### PROMPT 2.3 — Checkout + Booking i18n

**Fichiers** : `components/booking/CheckoutView.tsx`, `components/BookingForm.tsx`

**Problème** : 60+ strings en français dur. Tout le flux de réservation est uniquement en FR.

**À faire** :
1. Importer `useLocale()` dans les deux composants
2. Remplacer TOUS les textes en dur par `t('booking.xxx')` ou `t('checkout.xxx')`
3. Ajouter les clés EN manquantes dans `lib/i18n.ts`

### PROMPT 2.4 — Home + Prestations + Contact i18n

**Fichiers** : `components/home/*.tsx`, `app/prestations/*.tsx`, `app/contact/*.tsx`

**Problème** : Toutes les pages marketing sont en français dur.

**À faire** :
1. `t()` dans tous les composants home (HomeServicesSection, HomeOwnersSection, HomeFeaturedAudience, HomeBottomCta, HomeTrustBand, HomeValueProps)
2. `t()` dans les pages prestations et contact
3. `t()` dans le footer (liens légaux, copyright, description branding)

### PROMPT 2.5 — Métadonnées SEO multilingues

**Fichiers** : `app/layout.tsx`, `app/villas/[id]/page.tsx`

**Problème** : `og:locale = fr_FR` en dur, `title` et `description` en FR uniquement.

**À faire** :
1. `generateMetadata` dynamique selon la locale
2. `title` et `description` en FR + EN
3. `openGraph.locale` dynamique
4. Balises `alternate` hreflang

---

## BATCH 3 — 💰 DEVISES (1 jour)

### PROMPT 3.1 — formatPrice partout

**Problème** : `toLocaleString("fr-FR") €` en dur dans 6+ composants. `formatPrice()` n'est utilisé que dans 2.

**Fichiers à modifier** :
- `components/VillasMapView.tsx` (l.178, l.201)
- `components/VillaQuickView.tsx` (l.162)
- `components/HomeFeaturedAudience.tsx` (l.83)
- `components/booking/VillaSelectionCard.tsx` (affichage prix)
- `components/booking/SearchResults.tsx` (l.186)
- `components/VillaFilterBar.tsx` (l.112 — chips budget)

**À faire** :
1. Importer `useLocale()` dans chaque composant
2. Remplacer `villa.price.toLocaleString("fr-FR") €` par `formatPrice(villa.price)`
3. `VillaFilterBar` : rendre les chips budget dynamiques (`< 800 €` → utiliser `formatPrice(800)`)

### PROMPT 3.2 — Calendrier locale dynamique

**Fichier** : `components/AvailabilityCalendar.tsx`

**Problème** : `locale="fr"` et `import frLocale` en dur. Jamais en anglais.

**À faire** :
1. Importer `enLocale` depuis `@fullcalendar/core/locales/en-gb`
2. Utiliser `useLocale().locale` pour choisir la locale
3. `locales={[frLocale, enLocale]}` et `locale={locale.startsWith("en") ? "en-gb" : "fr"}`

---

## BATCH 4 — 💳 STRIPE (1 jour)

### PROMPT 4.1 — Webhook payment_intent

**Fichier** : `app/api/webhooks/stripe/route.ts`

**Problème** : Pas de handler pour `payment_intent.succeeded` ni `payment_intent.payment_failed`. Paiements asynchrones (SEPA, SOFORT) confirmés avant capture.

**À faire** :
1. Ajouter `payment_intent.succeeded` : mettre à jour `payment_status = "paid"` sur le booking
2. Ajouter `payment_intent.payment_failed` : marquer `payment_status = "failed"`, notifier
3. Idempotence : utiliser upsert sur `stripe_events_processed` au lieu de SELECT + INSERT
4. Race condition `expired` vs `completed` : UPDATE avec `.eq("status", "pending")`

### PROMPT 4.2 — Reverse transfer sur refund

**Fichier** : `app/api/webhooks/stripe/route.ts`

**Problème** : `checkout.session.expired` refund sans `reverse_transfer` → Kayvila paie la différence.

**À faire** :
1. Avant `stripe.refunds.create()`, vérifier si un transfer Connect a eu lieu
2. Si oui, créer `stripe.transfers.createReversal()` d'abord
3. Alternative : passer `reverse_transfer: true` dans les options de refund

### PROMPT 4.3 — Webhook account.application.deauthorized

**Fichier** : `app/api/webhooks/stripe/route.ts`

**À faire** :
1. Ajouter le handler pour `account.application.deauthorized`
2. Marquer `stripe_connect_onboarding_completed = false` sur le profil proprio
3. Notifier l'admin

---

## BATCH 5 — 🔐 AUTH (1 jour)

### PROMPT 5.1 — Uniformiser l'auth API

**Fichiers** : `app/api/dashboard/create-villa/route.ts`, `app/api/dashboard/delete-booking/route.ts`, `app/api/dashboard/owner-assistant/route.ts`, `app/api/admin/chat/route.ts`

**Problème** : 3 mécanismes d'auth différents (token Bearer, cookie session, rien).

**À faire** :
1. Remplacer toutes les auth inline par `requireAuth()` et `requireAdmin()` de `lib/auth/server.ts`
2. `owner-assistant` : ajouter vérification que l'utilisateur a le rôle `owner`
3. `admin/chat` : remplacer l'allowlist par `requireAdmin()`

### PROMPT 5.2 — AuthContext role cohérent

**Fichier** : `contexts/AuthContext.tsx`

**Problème** : Le rôle est lu uniquement depuis le JWT (`user_metadata.role`), qui peut être stale.

**À faire** :
1. Au chargement, fetcher `profiles.role` en plus du JWT
2. Utiliser `profiles.role` comme source primaire, JWT comme fallback
3. Exposer une fonction `refreshRole()` pour forcer la mise à jour

### PROMPT 5.3 — Gestion session expirée côté client

**Fichiers** : `contexts/AuthContext.tsx`

**Problème** : Si le refresh token expire, les appels API échouent en 401 sans feedback.

**À faire** :
1. Écouter `onAuthStateChange` avec l'événement `SIGNED_OUT`
2. Afficher un toast "Session expirée, veuillez vous reconnecter"
3. Rediriger vers `/login`

---

## BATCH 6 — 🎨 DESIGN & ERGONOMIE (2 jours)

### PROMPT 6.1 — Contraste WCAG AA

**Problème** : `text-navy/55` sur `bg-offwhite` → ratio ~4.2:1, ne passe pas WCAG AA. Utilisé massivement.

**Fichiers** : global — tous les `text-navy/55`, `text-navy/40`, `text-navy/35`

**À faire** :
1. Remplacer `text-navy/55` par `text-navy/60` (ratio ~4.7:1)
2. Remplacer `text-navy/40` par `text-navy/55` minimum
3. Remplacer `text-navy/35` par `text-navy/50` minimum
4. Utiliser find-replace global dans tous les fichiers `.tsx`

### PROMPT 6.2 — Harmoniser le design system

**Fichiers** : `components/ui/card.tsx`, `components/ui/button.tsx`, `components/ui/tabs.tsx`, `components/ui/input.tsx`

**Problème** : Composants shadcn/ui jamais adaptés au thème marine/or.

**À faire** :
1. `card.tsx` : `rounded-3xl` → `rounded-none`
2. `button.tsx` variant `outline` : `slate` → `navy` (border, text, hover)
3. `tabs.tsx` : tout le composant → tokens `navy`/`gold`/`offwhite`
4. `input.tsx` : `rounded-xl` → `rounded-none`

### PROMPT 6.3 — Footer mobile branding

**Fichier** : `components/layout/Footer.tsx`

**Problème** : Logo Kayvila + description disparaissent sur mobile. Perte de branding.

**À faire** :
1. Sur mobile, afficher le logo + description en haut du footer (avant la grille 2×2)
2. Garder la grille en dessous

### PROMPT 6.4 — Images perf + placeholder blur

**Fichiers** : Tous les composants avec `<Image>` (~20 instances)

**Problème** : Aucun `placeholder="blur"` → LCP flash blanc.

**À faire** :
1. Générer des `blurDataURL` (base64 minuscule) via plaiceholder ou sharp
2. Ajouter `placeholder="blur"` + `blurDataURL` sur toutes les `<Image>`
3. Remplacer `<img>` par `<Image>` dans `VillaHostCard` et `VillaReviews`

### PROMPT 6.5 — VillaReviews erreur silencieuse

**Fichier** : `components/VillaReviews.tsx`

**Problème** : `.catch(() => {})` → si l'API échoue, l'utilisateur voit "0 avis" sans savoir.

**À faire** :
1. Gérer l'état `error` avec un message ou un toast
2. Afficher "Impossible de charger les avis" + bouton "Réessayer"

---

## BATCH 7 — 🧠 LOGIQUE MÉTIER (1 jour)

### PROMPT 7.1 — Migration external_id OTA

**Fichiers** : `lib/ota-hub.ts`, `lib/ical-sync.ts`

**Problème** : `ical-sync` utilise `event.uid`, `ota-hub` utilise `buildExternalId(source, uid)`. Migration → doublons.

**À faire** :
1. Ajouter une fonction de migration qui détecte les anciens `external_id` (sans préfixe)
2. Les mettre à jour vers le nouveau format avant la première synchro
3. Ou : faire un backfill SQL sur la table `booking_calendar_slots`

### PROMPT 7.2 — seasonal_prices dans le calcul

**Fichiers** : `lib/price-engine.ts`

**Problème** : `Villa.seasonal_prices` n'est jamais utilisé dans `calculatePrice()`.

**À faire** :
1. Ajouter un paramètre `seasonalPrices?: SeasonalPrice[]` à `calculatePrice()`
2. Déterminer la saison applicable selon les dates
3. Utiliser le prix saisonnier comme base au lieu de `pricePerNight`

### PROMPT 7.3 — DELETE booking cohérence

**Fichiers** : dashboard `delete-booking`, `app/api/booking/cancel/route.ts`

**Problème** : Dashboard = hard delete, API cancel = soft delete (status=cancelled).

**À faire** :
1. Aligner les deux : utiliser soft delete partout
2. Garder l'historique pour la compta et les stats
3. Ajouter une colonne `cancelled_at` + `cancelled_by`

---

## BATCH 8 — 🧪 TESTS (1 jour)

### PROMPT 8.1 — Tests login complets

**Fichier** : `tests/login.spec.ts`

**À faire** :
- Login réussi (admin, proprio, tenant)
- Login échoué (mauvais mot de passe)
- Signup avec confirmation email
- Forgot password
- Redirection par rôle après login
- Open redirect bloqué
- Validation des champs
- Mode loading

### PROMPT 8.2 — Tests accessibilité

**Nouveau fichier** : `tests/a11y.spec.ts`

**À faire** :
1. Installer `@axe-core/playwright`
2. Tester les pages principales : home, villas, villa detail, login, checkout
3. Vérifier les landmarks, contrastes, navigation clavier
