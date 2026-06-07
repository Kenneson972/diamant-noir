# Retours Richard — Design (2026-06-07)

Client : Richard GELARD-THOMACHOT · Kayvila (Diamant Noir) · Livraison : 16 juin 2026

## Priorités

1. 🔴 Bug scroll messagerie locataire
2. 🟡 Revenus admin (calcul + ventilation)
3. 🟡 Réservations proprio (empty state + données test)
4. 🟡 Revenus proprio (ventilation + PDF)
5. 🔵 Miniatures villas admin
6. 🔵 Anti-chevauchement tarifs saisonniers
7. 🔵 Indicatif téléphonique locataire
8. 🔵 Signalement tâches proprio
9. 🔵 Messagerie proprio

---

## 1. 🔴 Bug scroll messagerie locataire

**Fichier :** `components/espace-client/TenantChatbot.tsx`

**Cause :** Ligne 113-115 — `endRef.current?.scrollIntoView({ behavior: "smooth" })` scroll la page entière, le header disparaît.

**Fix :**
- Ajouter un `useRef` sur le conteneur de messages (`div.overflow-y-auto` ligne 201)
- Remplacer `scrollIntoView` par `containerRef.current.scrollTop = containerRef.current.scrollHeight`
- Le scroll reste dans le conteneur, le header PageTopbar reste visible

**Fichiers modifiés :** 1 (`TenantChatbot.tsx`)

---

## 2. 🟡 Revenus admin

### 2a. Sous-titre

**Fichier :** `app/(admin)/admin/revenus/page.tsx:75`

Remplacer `"CA et commissions via calculateTransferAmounts (25 % séjour + frais)."` par `"Commission selon canal de réservation (20% OTA · 25% direct)"`

### 2b. Calcul par canal

**Fichier :** `lib/revenue/booking-revenue.ts`

Ajouter une fonction `getCommissionRate(source: string | null): number` :

```typescript
const OTA_SOURCES = ['airbnb', 'expedia', 'trivago', 'vrbo', 'booking', 'ical'];

function getCommissionRate(source: string | null): number {
  if (source && OTA_SOURCES.includes(source)) return 20;
  return 25; // direct, manual, admin, ou null → 25%
}
```

Modifier `ownerNetCents(b, commissionRate)` et `platformFeeCents(b, commissionRate)` pour accepter un paramètre `source` optionnel qui override `commissionRate` quand présent.

**Fichier :** `app/api/admin/revenue/route.ts`

- Ajouter `source` dans le `select()` Supabase (vérifier qu'il est dans la query)
- Passer `b.source` aux appels `ownerNetCents()` et `platformFeeCents()`

### 2c. Ventilation par villa — canal majoritaire

**Fichier :** `app/api/admin/revenue/route.ts`

Dans la boucle `villaRevenue`, compter les occurrences par `source` pour chaque villa. Le canal majoritaire = source la plus fréquente.

**Fichier :** `app/(admin)/admin/revenus/page.tsx`

- Type `VillaRow` : ajouter `dominantSource: string` et `commissionRate: number`
- Tableau ventilation : ajouter colonne "Canal maj." et "Taux" (affiche "20%" ou "25%")

### 2d. Fichiers modifiés

- `lib/revenue/booking-revenue.ts` — `getCommissionRate()`, signatures mises à jour
- `app/api/admin/revenue/route.ts` — source dans la query, taux conditionnel, canal majoritaire
- `app/(admin)/admin/revenus/page.tsx` — sous-titre, colonnes ajoutées

---

## 3. 🟡 Réservations proprio

**Fichier :** `app/(proprio)/dashboard/reservations/page.tsx`

**Le code existant est déjà bon** (dates, voyageur, montant, badge statut, tri). Actions :

- **Empty state amélioré :** Remplacer le message actuel par "Aucune réservation pour le moment. Vos réservations apparaîtront ici dès qu'un voyageur réservera votre villa." avec icône `CalendarCheck`
- **Données test :** Créer 2-3 réservations test dans la table `bookings` avec noms/dates/montants réalistes pour validation visuelle par Richard

**Fichiers modifiés :** 1 (page.tsx)

---

## 4. 🟡 Revenus proprio — Ventilation + PDF

### 4a. Tableau ventilation

**Fichier :** `app/(proprio)/dashboard/revenus/page.tsx`

- Ajouter tableau sous `RevenueChart` : date · villa · voyageur · brut · commission · net (1 ligne par réservation)
- Ajouter `<select>` filtre par mois au-dessus du tableau
- Calcul de commission : réutiliser `getCommissionRate()` depuis `lib/revenue/booking-revenue.ts`

### 4b. PDF mensuel

**Nouvelle API route :** `app/api/proprio/releve/route.ts`

- GET avec param `month` (YYYY-MM)
- Query bookings confirmés du propriétaire pour le mois
- Génère PDF A4 avec `@react-pdf/renderer` :
  - En-tête Kayvila (logo + titre "Relevé de revenus")
  - Tableau : date · villa · voyageur · brut · commission · net
  - Totaux en pied de tableau
  - Pied de page avec date de génération
- Nom du fichier : `releve-[mois]-[année]-kayvila.pdf`
- Récupère `source` pour déterminer le taux (20% OTA, 25% direct)

**Fichier :** `app/(proprio)/dashboard/revenus/page.tsx`

- Bouton "Télécharger le relevé" qui appelle `/api/proprio/releve?month=YYYY-MM`
- Le mois par défaut = mois courant

**Fichiers modifiés/créés :**
- `app/api/proprio/releve/route.ts` — nouveau
- `app/(proprio)/dashboard/revenus/page.tsx` — tableau + bouton PDF

---

## 5. 🔵 Miniatures villas admin

**Fichier :** `components/dashboard/admin/AdminVillasDataGrid.tsx`

Modifier la cellule image (ligne 39-57) :

```typescript
const imgSrc = item.image_url ?? item.image_urls?.[0];
```

Si `imgSrc` existe → `<Image>`, sinon → placeholder gris (inchangé).

**Fichier :** `app/(admin)/admin/villas/page.tsx`

Ajouter `image_urls` dans le `select()` Supabase (ligne 40).

**Fichiers modifiés :** 2

---

## 6. 🔵 Anti-chevauchement tarifs saisonniers

### 6a. Validation côté client

**Fichier :** `components/dashboard/admin/SeasonalRatesManager.tsx`

Dans `handleAdd()` :
- Avant INSERT, vérifier si `newRate` chevauche un `rate` existant (même villa)
- Condition : `start_date <= newRate.end_date && end_date >= newRate.start_date`
- Si chevauchement → `setError("Cette période chevauche une plage existante (XX/XX – XX/XX). Veuillez ajuster les dates.")`
- Bloquer la sauvegarde

### 6b. Validation côté serveur

**Nouvelle API route :** `app/api/admin/seasonal-rates/route.ts`

- POST : avant INSERT, query Supabase pour détecter chevauchement (`start_date <= :new_end AND end_date >= :new_start AND villa_id = :villa_id`)
- Si conflit → 409 avec message + détails de la plage chevauchante
- PATCH : même logique
- DELETE : suppression simple (existe déjà en direct Supabase, à migrer vers l'API)

**Fichier :** `components/dashboard/admin/SeasonalRatesManager.tsx`

- Remplacer les appels Supabase directs par des appels fetch vers `/api/admin/seasonal-rates`

**Fichiers modifiés/créés :** 2

---

## 7. 🔵 Indicatif téléphonique locataire

**Fichier :** `components/espace-client/ProfileForm.tsx`

- Ajouter un état `countryCode` (défaut `"+596"`)
- Ajouter un `<select>` avant le champ téléphone :

```tsx
<select value={countryCode} onChange={...}>
  <option value="+596">+596 🇲🇶</option>
  <option value="+33">+33 🇫🇷</option>
  <option value="+1">+1 🇺🇸</option>
  <option value="+44">+44 🇬🇧</option>
  <option value="+49">+49 🇩🇪</option>
  <option value="+39">+39 🇮🇹</option>
  <option value="+34">+34 🇪🇸</option>
</select>
```

- Placeholder téléphone : `"6 96 XX XX XX"` (sans indicatif)
- Sauvegarde : concaténer `countryCode + phone` avant d'envoyer à `supabase.auth.updateUser()`
- Au chargement : si `metadata.phone` commence par un indicatif connu → pré-remplir `countryCode` et extraire le numéro

**Fichiers modifiés :** 1 (`ProfileForm.tsx`)

---

## 8. 🔵 Signalement tâches proprio

**Fichier :** `app/(proprio)/dashboard/taches/page.tsx`

**Nouveau composant :** `components/dashboard/proprio/ReportIssueButton.tsx`

- Bouton "Signaler un problème" en haut de page
- Modal (HeroUI `Modal`) avec :
  - `<select>` type : Plomberie, Électricité, Clim, Piscine, Jardin, Ménage, Autre
  - `<textarea>` description
  - `<select>` priorité : Normal, Urgent
- Soumission :
  - INSERT dans `tasks` avec `villa_id`, `reported_by = user.id`, `status = 'pending'`, `type`, `description`, `priority`
  - Email Resend à `admin@diamantnoir.com` (notification admin)
  - Confirmation visuelle au proprio
- Le `TaskList` existant affiche déjà les tâches avec statut → inchangé

**Fichiers modifiés/créés :** 2

---

## 9. 🔵 Messagerie proprio

### Base de données

Table `messages` (à créer si absente) :
- `id` UUID PK
- `sender_id` UUID FK profiles
- `receiver_id` UUID FK profiles
- `subject` TEXT
- `content` TEXT
- `created_at` TIMESTAMPTZ
- `read_at` TIMESTAMPTZ nullable

### Nouvelle page

**Fichier :** `app/(proprio)/dashboard/messages/page.tsx`

- Layout 2 colonnes : liste conversations (gauche ~30%) + zone chat (droite ~70%)
- Liste conversations : groupée par `subject`, dernier message, badge "non lu" si `read_at IS NULL`
- Zone chat : messages de la conversation sélectionnée, champ texte + bouton envoyer
- Bouton "Nouveau message" : modal avec destinataire (admin Kayvila), sujet, message

### Composant

**Fichier :** `components/dashboard/proprio/OwnerMessaging.tsx`

- Pas de réutilisation du `TenantChatbot` (trop couplé à l'IA)
- Messages directs sans IA, stockés dans la table `messages`
- Rafraîchissement automatique (polling toutes les 30s ou Supabase Realtime)

### Notification admin

- Quand un proprio envoie un message → email Resend à `admin@diamantnoir.com`
- Badge dans le dashboard admin (incrément compteur messages non lus)

**Fichiers modifiés/créés :**
- `app/(proprio)/dashboard/messages/page.tsx` — nouveau
- `components/dashboard/proprio/OwnerMessaging.tsx` — nouveau
- Migration `messages` table — si nécessaire

---

## Récapitulatif des fichiers

| # | Fichier | Action |
|---|---------|--------|
| 1 | `components/espace-client/TenantChatbot.tsx` | Fix scroll |
| 2 | `lib/revenue/booking-revenue.ts` | `getCommissionRate()` + signatures |
| 3 | `app/api/admin/revenue/route.ts` | Source, taux, canal majoritaire |
| 4 | `app/(admin)/admin/revenus/page.tsx` | Sous-titre, colonnes |
| 5 | `app/(proprio)/dashboard/reservations/page.tsx` | Empty state |
| 6 | `app/api/proprio/releve/route.ts` | Nouveau — PDF |
| 7 | `app/(proprio)/dashboard/revenus/page.tsx` | Tableau + bouton PDF |
| 8 | `components/dashboard/admin/AdminVillasDataGrid.tsx` | Fallback image_urls |
| 9 | `app/(admin)/admin/villas/page.tsx` | Ajouter image_urls au select |
| 10 | `components/dashboard/admin/SeasonalRatesManager.tsx` | Validation chevauchement + migration API |
| 11 | `app/api/admin/seasonal-rates/route.ts` | Nouveau — CRUD + validation |
| 12 | `components/espace-client/ProfileForm.tsx` | Sélecteur indicatif |
| 13 | `components/dashboard/proprio/ReportIssueButton.tsx` | Nouveau — signalement |
| 14 | `app/(proprio)/dashboard/taches/page.tsx` | Ajouter bouton signalement |
| 15 | `app/(proprio)/dashboard/messages/page.tsx` | Nouveau — messagerie |
| 16 | `components/dashboard/proprio/OwnerMessaging.tsx` | Nouveau — composant chat |

**Total : 16 fichiers (7 modifiés, 6 nouveaux, 2 API routes nouvelles, 1 fix)**
