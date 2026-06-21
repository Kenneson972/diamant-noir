# Design — 3 retours P0 Richard (CGV · Hero search · Chatbot scroll)

**Date** : 2026-06-21
**Repo** : diamant-noir (Kayvila Conciergerie) — Next.js 16 / React 19 / TS / Tailwind 4 / HeroUI / Supabase
**Branche cible** : `main`
**Statut** : approuvé, prêt pour le plan d'implémentation

## Contexte

Richard (client) a remonté 3 bugs/manques classés P0. Chaque tâche = 1 commit (messages
en français). Tests Playwright obligatoires : minimum 18 tests réellement exécutés via
`npx playwright test`. Ne pas casser les tests existants. `npx tsc --noEmit` avant tout push.

Le diagnostic ci-dessous a été vérifié dans le code réel (pas la spec d'origine) ; trois
divergences spec↔code ont été tranchées avec l'utilisateur :

1. La spec parlait de table `reservations` → **la table réelle est `bookings`** (réservations
   directes). `reservations` n'existe pas. → colonnes CGV sur `bookings`.
2. Contenu des modals légaux → **extraire le texte existant** (`/cgv`, `/confidentialite`) en
   composants partagés (source de vérité unique).
3. `cgv_version` → **version datée** `"2026-06-21"` (date de dernière mise à jour du texte légal).

---

## Tâche 1 — Checkbox CGV obligatoire

### Objectif
Avant validation d'une réservation directe (`CheckoutView`), exiger une checkbox décochée par
défaut acceptant CGV + Politique de confidentialité, avec liens ouvrant des modals. Bloquer le
POST côté client ET serveur. Tracer l'acceptation en base.

### Données / migration
Fichier `supabase/migrations/20260621_bookings_cgv.sql` :
- `ALTER TABLE bookings ADD COLUMN cgv_accepted_at timestamptz;`
- `ALTER TABLE bookings ADD COLUMN cgv_version text;`

(nullable : les bookings existants et les bookings OTA n'ont pas d'acceptation)

> Migration appliquée manuellement via le SQL Editor Supabase (sandbox bloque Postgres direct +
> l'API Management). Projet `wsdawdxucyuyopkpgjij`.

### Contenu légal partagé (DRY)
- `lib/legal.ts` : `export const CGV_VERSION = "2026-06-21";`
- `components/legal/CgvContent.tsx` : le JSX du texte CGV, extrait de `app/cgv/page.tsx`.
- `components/legal/ConfidentialiteContent.tsx` : extrait de `app/confidentialite/page.tsx`.
- `app/cgv/page.tsx` et `app/confidentialite/page.tsx` consomment ces composants — **zéro
  changement visuel** (refactor pur, vérifié par les tests de pages existants si présents).

### Modal
`components/legal/LegalModal.tsx` — suit l'idiome maison (`VillaQuickView` : `fixed inset-0`
overlay `bg-navy/40` + panneau `role="dialog"` `aria-modal`, fermeture overlay-click + Échap +
bouton croix). **Pas de nouvelle dépendance** (pas de HeroUI Modal). Props : `open`, `onClose`,
`title`, `children`. Contenu scrollable (texte légal long).

### UI checkout (`components/booking/CheckoutView.tsx`)
- State `const [cgvAccepted, setCgvAccepted] = useState(false);` (jamais pré-coché).
- State `const [openLegal, setOpenLegal] = useState<null | "cgv" | "confidentialite">(null);`
- Bloc checkbox rendu **avant les deux CTA**, dans le flux principal (visible desktop ET mobile) :
  - `<input type="checkbox">` lié à `cgvAccepted`, label :
    « J'ai lu et j'accepte les [Conditions Générales de Vente] et la [Politique de
    confidentialité] de Kayvila Conciergerie » où les deux segments entre crochets sont des
    `<button type="button">` ouvrant le modal correspondant.
- `handleConfirmBooking` : ajouter en tête, après les validations email/nom :
  ```
  if (!cgvAccepted) {
    setError("Veuillez accepter les CGV pour continuer");
    return;
  }
  ```
- Les **deux** boutons de confirmation (`KayvilaPressableButton` desktop ~ligne 383 + sticky
  mobile ~ligne 418) reçoivent `disabled={checkoutLoading || !cgvAccepted}`.
- Le POST `/api/booking` envoie `cgvAccepted: true` dans le body.

### Serveur
- `types/stripe.ts` — `BookingRequestSchema` gagne :
  ```
  cgvAccepted: z.literal(true, { message: "Acceptation des CGV requise" }),
  ```
  (rejet 400 automatique si absent/false — défense serveur indépendante du client)
- `app/api/booking/route.ts` — à l'insert `bookings` (~ligne 260), ajouter :
  ```
  cgv_accepted_at: new Date().toISOString(),
  cgv_version: CGV_VERSION,
  ```
  La version vient de `lib/legal.ts` (source de vérité serveur), **jamais** du client.

### Hors périmètre
- Pas de versioning historique multi-versions des CGV (une seule version courante).
- Pas de modification du flux OTA / pre-booking-requests.

---

## Tâche 2 — Bloc recherche Hero cassé (régression)

### Cause racine (confirmée)
Commit `bf04fa8` (18 juin) a ajouté `overflow-hidden` à la `<section>` hero
(`app/page.tsx:108`) pour contenir le débordement du parallax. Or le dropdown calendrier du
`HeroSearchWidget` est positionné `sm:absolute sm:top-full` (sous le widget, donc sous le bas de
la section) → il est clippé. Régression du fix `f0b56a2` (15 juin).

`HeroBackgroundMedia` (`components/home/HeroBackgroundMedia.tsx:70-72`) possède **déjà** son
propre wrapper `absolute inset-0 overflow-hidden` ; le `transform` parallax est appliqué sur ce
wrapper. L'`overflow-hidden` de la section est donc redondant pour le parallax mais fatal pour le
calendrier.

### Correctif
1. `app/page.tsx:108` : retirer `overflow-hidden` de la `<section>` hero (le reste des classes
   inchangé).
2. `HeroBackgroundMedia.tsx` : déplacer le `transform` parallax du wrapper externe vers une
   **couche interne sur-dimensionnée** :
   - Wrapper externe : `absolute inset-0 overflow-hidden` **statique** (sans transform) → clippe
     ses enfants aux bornes exactes de la section.
   - Nouvelle couche interne englobant `<Image>` + `<video>` : sur-dimensionnée (`h-[120%]` +
     `-top-[10%]` ou équivalent) avec `style={{ transform: translateY(scrollY*0.06), willChange }}`.
   - Résultat : le parallax reste 100 % contenu dans le wrapper (= section), aucun débordement
     vers la section suivante, et le dropdown calendrier (frère, hors de ce wrapper) n'est plus
     coupé.
3. z-index : déjà correct (`z-[9999]` dropdown vs `z-10` contenu). Aucune modif.
4. Le `RangeCalendar` HeroUI (`HeroDateRangePicker`) reste l'unique date picker — pas de conflit
   d'import (vérifié : `HeroDatePicker` custom supprimé au commit `f0b56a2`).

### Vérification
- Desktop : calendrier 2 mois entièrement visible, sélection de plage fonctionnelle.
- Mobile : calendrier `fixed inset-x-4 bottom-4` visible (le `fixed` échappe `overflow:hidden` ;
  si un cas de clipping résiduel apparaît au test, ajuster `max-height` + scroll du panneau).
- Guest picker (`HeroGuestPicker`, +/−) fonctionnel.

---

## Tâche 3 — Chatbot proprio : scroll parasite

### Cause racine (confirmée)
`components/dashboard/DashboardCopilotChat.tsx:30` :
```
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
```
`scrollIntoView` remonte la chaîne des ancêtres scrollables jusqu'à `window` → fait défiler
**toute la page dashboard** vers le bas à chaque nouveau message et à chaque tick de stream, au
lieu de scroller seulement la boîte de messages.

### Correctif
- Ajouter un `ref` (`messagesContainerRef`) sur la div scrollable des messages (`:67`).
- Remplacer le `useEffect` de scroll par un scroll **interne au conteneur** :
  ```
  const el = messagesContainerRef.current;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
  ```
  → ne touche jamais `window`.
- Garde « near-bottom » : ne déclencher l'auto-scroll que si l'utilisateur est déjà proche du bas
  du conteneur (`scrollHeight - scrollTop - clientHeight < seuil`), sinon ne pas forcer.
- `inputRef.current?.focus({ preventScroll: true })` après envoi (`:38`) pour éviter le saut au
  focus.
- `messagesEndRef` peut être conservé comme repère ou supprimé (plus utilisé pour le scroll).

### Note
Fonctionne dans les deux modes (`fullHeight` = `flex-1 overflow-y-auto`, dashboard =
`maxHeight: 400 overflow-y-auto`) : dans les deux cas la div messages est le conteneur scrollable.

---

## Tests Playwright (≥ 18, exécutés)

**Tâche 1 — CGV (~8)**
1. Checkbox décochée par défaut au chargement du checkout.
2. CTA desktop désactivé tant que non cochée.
3. CTA sticky mobile désactivé tant que non cochée.
4. Tentative de validation sans coche → message « Veuillez accepter les CGV pour continuer ».
5. Clic « Conditions Générales de Vente » → modal CGV ouvert, puis fermeture.
6. Clic « Politique de confidentialité » → modal Confidentialité ouvert, puis fermeture.
7. Coche → les CTA deviennent actifs.
8. POST `/api/booking` sans `cgvAccepted` → 400 (test API direct).

**Tâche 2 — Hero (~6)**
9. Clic sur « Dates » ouvre le calendrier.
10. Calendrier entièrement visible (non clippé) sur desktop — assertion bounding box dans le viewport.
11. Sélection d'une plage de dates met à jour le résumé.
12. Guest picker +/− modifie le nombre de voyageurs.
13. Calendrier visible sur viewport mobile.
14. « Rechercher » navigue vers `/villas?...` avec checkin/checkout/guests.

**Tâche 3 — Chatbot (~4)**
15. Envoi d'un message ne déplace pas le scrollY de la page.
16. La réponse apparaît dans la boîte sans devoir remonter manuellement.
17. Le tick de stream/chargement ne repousse pas la page.
18. L'input reste focus après envoi.

---

## Livraison
- 3 commits (1 par tâche), messages en français.
- `npx tsc --noEmit` vert avant push.
- Tests existants non cassés.
- Migration SQL appliquée manuellement (SQL Editor Supabase) + notée comme étape manuelle.
