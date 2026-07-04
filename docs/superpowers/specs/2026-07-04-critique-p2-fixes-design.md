# Spec — Critique impeccable, items P2 (dates, frais, horaires, a11y carte)

**Date** : 2026-07-04
**Statut** : validé par Kenneson (brainstorming du 2026-07-04)

## Constat

Suite à `/impeccable:critique` (P1 déjà traités : retrait des tiers publics, adoucissement de la copy), deux clusters P2 restent :

1. **Incohérences là où la confiance est fragile** : date de séjour décalée d'un jour entre le widget de la fiche villa et le checkout ; libellé de frais différent selon l'écran ("Frais de service Kayvila" vs "Frais de conciergerie Kayvila (5 %)") ; heure de check-in contradictoire (résumé vs règlement intérieur codé en dur).
2. **Accessibilité de la carte villa** : le lien enveloppant l'image/carrousel n'a pas de nom accessible propre — un lecteur d'écran annonce les boutons du carrousel ("Previous slide Next slide"), jamais le nom de la propriété.

### Root causes identifiées à l'exploration

- **Date décalée** : `new Date("YYYY-MM-DD")` (sans heure) est interprété en **UTC minuit** par le moteur JS, puis affiché via `.toLocaleDateString()` dans le fuseau du navigateur. Pour un visiteur dans un fuseau négatif par rapport à UTC, ça affiche la veille. Instance précise : `components/BookingForm.tsx` fonction `dateLabel()`. Le même pattern non sécurisé est dupliqué dans ~30 fichiers du repo (admin, espace-proprio, espace-client) ; le helper partagé `lib/utils.ts formatDate()` en fait partie et cascade à ~15 consommateurs. Deux fichiers ont en plus leur **propre copie locale** du bug, indépendante du helper : `components/dashboard/proprio/QuickReservationsList.tsx` et `UpcomingBookings.tsx`.
- **Frais incohérents** : le montant est bien 5 % partout (calcul cohérent), seul le **libellé texte** diverge. La clé i18n `booking.service_fee` = "Frais de service Kayvila" existe déjà (fr/en/es) mais n'est utilisée nulle part de façon cohérente — `CheckoutPriceSummary.tsx` a son propre texte en dur "Frais de conciergerie Kayvila (5 %)". Le pourcentage 5 % est en plus dupliqué en dur (`0.05`) dans `BookingForm.tsx` et `CheckoutView.tsx`.
- **Découverte incidente (sécurité)** : `app/api/booking/route.ts` accepte `serviceFeePercent` depuis le corps de la requête client (`BookingRequestSchema`, `z.number().min(0).max(100).optional().default(5)`) et l'utilise tel quel pour calculer `serviceFeeCents` — un client peut envoyer `0` et réduire les frais Kayvila à volonté. Sans lien direct avec le bug de libellé, mais touché par la même passe de nettoyage.
- **Heure de check-in** : `CheckoutView.tsx`, le texte de secours du règlement intérieur (utilisé quand `villa.checkout_instructions` est vide) code en dur "Arrivée à partir de 17h, départ avant 10h..." alors que 2 lignes plus loin, le même composant affiche correctement `villa.check_in_time` réel. Le défaut DB/éditeur pour `check_in_time` est `"15:00"` — donc dès qu'une villa n'a pas d'instructions personnalisées, l'incohérence 15:00/17h se produit systématiquement.
- **A11y carrousel** : `components/villas/VillaListingCard.tsx` (~ligne 175), le `<Link href={href}>` enveloppant `<CardImageBlock>` (qui contient le carrousel `@heroui-pro/react`) n'a pas de `aria-label`. Son nom accessible se calcule donc à partir du contenu descendant — les boutons `Carousel.Previous`/`Carousel.Next` — jamais le nom de la villa, qui est rendu ailleurs (hors de ce lien).

## Décisions actées

| # | Question | Décision |
|---|----------|----------|
| 1 | Profondeur du fix date | Corriger le helper partagé `lib/utils.ts formatDate()` (pas seulement le tunnel de réservation) |
| 2 | Copies locales du bug de date | Corriger aussi `QuickReservationsList.tsx` et `UpcomingBookings.tsx` |
| 3 | Libellé des frais | Unifier sur la clé i18n existante `booking.service_fee` ("Frais de service Kayvila") |
| 4 | Filtres villas restants (7 chips post-P1) | Ne pas y toucher maintenant — à revoir quand le catalogue grandira |
| 5 | `serviceFeePercent` client-contrôlable | Durcir côté serveur (constante fixe, champ retiré du schéma accepté) |

## Architecture

### 1. Sécurisation des dates

- **`lib/utils.ts`** : ajouter une fonction interne `parseDateOnly(value: string): Date` — si `value` matche `/^\d{4}-\d{2}-\d{2}$/`, retourne `new Date(value + "T00:00:00")` (ancrage minuit **local**, même pattern que `formatIsoDateFr` déjà utilisé sur `/villas`) ; sinon retourne `new Date(value)` inchangé (préserve le comportement correct pour les vrais timestamps type `created_at`). `formatDate()` utilise `parseDateOnly` en interne au lieu de `new Date(dateStr)` directement. Signature externe de `formatDate()` inchangée — aucun appelant à modifier.
- **`components/BookingForm.tsx`** : `dateLabel()` utilise le même helper (`parseDateOnly` importé de `lib/utils.ts`, ou dupliqué localement si l'import créerait un cycle — à vérifier à l'implémentation) au lieu de `new Date(value)` direct.
- **`components/booking/CheckoutView.tsx`** : **aucun changement nécessaire**. Vérifié à l'exploration : l'affichage du résumé de séjour (`formatTripDateShort`/`formatTripDate`, lignes 28/36) utilise déjà un ancrage `"T12:00:00"` (midi local) — déjà timezone-safe, c'est précisément pour ça que le checkout affichait la bonne date pendant que le widget de la fiche villa (`BookingForm.tsx`) affichait la mauvaise. Les `new Date(checkin)`/`new Date(checkout)` passés à `calculatePrice` (lignes 67-68) ne servent qu'au calcul de nuits, non affecté (voir note ci-dessous).
- **`components/dashboard/proprio/QuickReservationsList.tsx`** et **`UpcomingBookings.tsx`** : remplacer la fonction locale `formatDate(dateStr)` dupliquée par un import de `parseDateOnly` (ou de `formatDate` de `lib/utils.ts` si la signature convient), même correctif.

**Note (non-régression)** : le calcul du nombre de nuits (`price-engine.ts diffDays`) n'est **pas** affecté par ce bug — les deux bornes (arrivée/départ) subissent le même décalage UTC, donc leur différence reste exacte. Seul l'**affichage** d'une date individuelle est faux. Pas de risque financier caché, confirmé à l'exploration.

### 2. Frais et heure de check-in

- **`lib/price-engine.ts`** : exporter une constante `export const SERVICE_FEE_PERCENT = 5;`.
- **`components/BookingForm.tsx`** et **`components/booking/CheckoutView.tsx`** : remplacer le `0.05` codé en dur par `SERVICE_FEE_PERCENT / 100`, importé de `lib/price-engine.ts`.
- **`components/BookingForm.tsx`** : remplacer le texte en dur `"Frais de service Kayvila"` par `t("booking.service_fee")` (le composant importe déjà `useLocale`, il suffit de destructurer `t` en plus de `formatPrice`).
- **`components/booking/CheckoutPriceSummary.tsx`** : importer `useLocale`, remplacer `"Frais de conciergerie Kayvila (5 %)"` par `` `${t("booking.service_fee")} (${SERVICE_FEE_PERCENT} %)` `` — garde l'info du pourcentage affichée mais avec le libellé unifié.
- **`app/api/booking/route.ts`** : le nom du line item Stripe ("Frais de service Kayvila") correspond déjà au libellé unifié — aucun changement de texte nécessaire. Retirer la déstructuration de `serviceFeePercent` depuis `parsed.data` ; utiliser directement `SERVICE_FEE_PERCENT` (importé de `lib/price-engine.ts`) dans le calcul `serviceFeeCents`.
- **`types/stripe.ts`** : retirer le champ `serviceFeePercent` de `BookingRequestSchema` (n'est plus accepté ni lu — un client qui l'envoie encore verra le champ simplement ignoré par Zod, comportement par défaut sans `.strict()`).

### 3. Heure de check-in dynamique

- **`components/booking/CheckoutView.tsx`** : dans le tableau `houseRules` (fallback quand `villa.checkout_instructions` est vide), remplacer la première ligne codée en dur par un template interpolant `villa.check_in_time ?? "17:00"` et `villa.check_out_time ?? "10:00"` — cohérent avec l'affichage dynamique déjà présent 2 lignes plus loin dans le même composant.

### 4. Accessibilité carte villa

- **`components/villas/VillaListingCard.tsx`** : ajouter `aria-label={villa.name}` sur le `<Link href={href}>` qui enveloppe `<CardImageBlock>` (~ligne 175-181). Aucun changement visuel.

## Hors scope

- Les 7 chips de filtre restants (piscine/vue mer/plage/4+ pers./budget) — laissés tels quels (décision #4).
- Dédoublonnage complet des ~30 autres occurrences du pattern `new Date(dateStr)` non sécurisé dans le reste du codebase (admin/espace-client hors les 2 fichiers ciblés) — non demandé pour cette passe.
- `components/booking/PriceCalculator.tsx` — composant mort (jamais importé nulle part), contient aussi le pattern de frais en dur mais n'est pas touché.
- Renommage des filtres/tris, refonte du catalogue.

## Tests

- Vitest sur `parseDateOnly`/`formatDate` (`lib/utils.ts`) : chaîne date-only → jour correct quel que soit le fuseau du test runner (mock ou vérification indépendante du TZ local) ; timestamp complet (`created_at`-like) → comportement inchangé.
- Vitest ciblé sur le calcul de frais : `SERVICE_FEE_PERCENT` appliqué correctement dans `app/api/booking/route.ts` même si un corps de requête envoie un `serviceFeePercent` arbitraire (doit être ignoré).
- Build + `npm run build` + suite vitest complète (régression sur les 122 tests existants).
- Vérification manuelle Playwright : fiche villa → dates cohérentes entre widget et `/book` ; checkout → libellé de frais identique aux deux endroits ; carte villa → `aria-label` présent sur le lien (snapshot accessibility).

## Risques

- `parseDateOnly` mal implémenté pourrait casser l'affichage de vraies timestamps (`created_at`) si la regex de détection date-only est trop permissive — bien tester avec les deux formats.
- Retirer `serviceFeePercent` du schéma Zod : vérifier qu'aucun autre appelant (tests existants, éventuel client mobile futur) n'envoie ce champ en s'attendant à ce qu'il soit respecté.
- `CheckoutPriceSummary.tsx` passe de composant purement présentationnel à consommateur de `useLocale()` — vérifier qu'il est bien rendu dans un arbre couvert par `LocaleProvider` partout où il est utilisé.
