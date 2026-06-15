# Kayvilla — Corrections Globales Batch — Design Spec

**Date:** 2026-06-15
**Status:** Approved (design) — pending spec review
**Client:** Richard GELARD-THOMACHOT (Kayvilla, location de villas de luxe)
**Stack:** Next.js 14 App Router · Supabase · Tailwind · TypeScript · HeroUI
**Repo:** diamant-noir
**Livraison:** 16 août 2026

---

## 1. Objectif

Batch de ~12 corrections indépendantes sur les 3 espaces (locataire, admin, proprio) + cross-site.
Livraison incrémentale en **4 vagues**, chaque vague testable et livrable seule.

### Décisions verrouillées
- **Notifications SLA** → in-app uniquement (table `notifications` + `NotificationBell` existants). Aucun email.
- **Champs « texte riche »** → textarea + rendu Markdown via `react-markdown` (déjà installé). Pas de nouvel éditeur WYSIWYG.
- **Migrations DB** → proposées dans ce spec, **validées par Kenneson avant application** via Supabase MCP. Toutes en `ADD COLUMN … NULL`/default → non-destructives.

---

## 2. Migrations DB (à valider avant application)

| #  | Table          | Changement                                                                              | Pour      |
|----|----------------|-----------------------------------------------------------------------------------------|-----------|
| M1 | `requests`     | `+ priority text default 'standard'` (standard\|urgent), `+ taken_at timestamptz`, `+ resolved_at timestamptz` | 3.8 SLA   |
| M2 | `villas`       | `+ bedrooms_count int`, `+ house_manual_pdf_url text` (livret PDF téléchargeable)       | 3.5       |
| M3 | `owner_blocks` | `+ origin text default 'Propriétaire'` (Kayvila\|Propriétaire). `reason` existe déjà → réutilisé comme « Motif » | 3.1       |

**Notes schéma (vérifié) :**
- `villas` possède déjà : `bathrooms_count`, `cancellation_policy`, `house_rules`, `safety_info`, `amenities`, `equipment_interior/exterior`, `house_manual` (Json = livret). → 3.5 est ~80 % exposition de champs existants dans le formulaire.
- `requests` possède : `created_at`, `status`, `assignee_id`, `admin_response` — pas de `priority`/`taken_at`/`resolved_at`.
- Le blocage de dates passe par la table `owner_blocks` (cf. spec 2026-05-22). `reason` existe (défaut `'Non spécifié'`). UI actuelle = côté proprio (`DisponibilitesPage` + `BlockSidebar`).

---

## 3. Vague 1 — CSS quick wins (aucune DB)

### 4.2 — Scroll sidebar (3 espaces)
- **Fichier :** `components/dashboard/shared/DashboardSidebar.tsx` (partagé client/proprio/admin → un seul correctif couvre les 3).
- **Action :** liste de nav en `overflow-y-auto min-h-0`, scrollbar masquée (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`), hauteur max laissant ~50 % du prochain item visible quand ça dépasse.

### 4.1 — Header hover (page d'accueil)
- **Action :** localiser le header de la home, restaurer l'effet hover perdu (transition sur les liens).

### 1.1 — Messagerie « toute petite »
- **Fichier :** `app/espace-client/messagerie/page.tsx`
- **Action :** conteneur principal en `flex-1 min-h-0` / `h-full` pour remplir le shell.

### 1.2 — Calendrier coupé (flux réservation)
- **Fichier :** `app/book/page.tsx`
- **Action :** vérifier `overflow-visible` + hauteur du conteneur calendrier. Correctif partiel existant → confirmer mobile + desktop.

### 2 — Titres H2 redondants (5 pages) — VÉRIFICATION SEULE
- Livret, Notifications, Demandes, Checklist, Documents.
- **Action :** confirmer qu'aucun H2 ne subsiste sous le label doré. Aucune modif si OK.

---

## 4. Vague 2 — Admin léger (aucune DB)

### 3.2 — Photos miniatures tableau villas
- **Fichier :** `app/(admin)/admin/villas/page.tsx`
- **Action :** colonne thumbnail (~60px) depuis la 1ère photo de chaque villa.

### 3.6 — Réservations : recherche + tri
- **Fichier :** page admin réservations (`AdminReservationsDataGrid` / `AdminReservationsKanban`).
- **Action :** barre de recherche par nom client OU n° réservation (filtrage client-side), tri alphabétique par client par défaut.

---

## 5. Vague 3 — Admin moyen

### 3.3 — Mini-carte sous « Disponibilité »
- **Fichier :** `app/(admin)/admin/villas/[id]` (detail/edit client).
- **Action :** réutiliser `components/VillaLeafletMap.tsx` à 200–300px sous la rubrique Disponibilité. Responsive.

### 3.4 — Historique par villa
- **Action :** réservations passées + à venir de la villa, avec miniatures des résas + la mini-carte. Réutilise les patterns de `components/dashboard/VillaPastBookingsDrawer.tsx`.

### 3.7 — Revenus : ventilation par villa
- **Fichier :** page admin revenus + `lib/revenue/`.
- **Action :** breakdown par `villa_id` en plus du total global (regrouper le revenu booking existant).

---

## 6. Vague 4 — Admin lourd (DB)

### 3.1 — Blocages : motif + origine
- **Migration :** M3 (`owner_blocks.origin`).
- **Action :**
  - « Motif » = `reason` existant (texte libre / dropdown).
  - « Origine » = nouvelle colonne `origin` : `Propriétaire` si créé côté proprio, `Kayvila` si créé côté admin.
  - Permettre la création d'un blocage côté admin (réutiliser/adapter l'API + composant de blocage proprio).
  - Afficher Motif + Origine dans la liste des blocages.

### 3.5 — Ajouter une villa : champs
- **Migration :** M2 (`bedrooms_count`, `house_manual_pdf_url`).
- **Fichiers :** `app/(admin)/admin/villas/ajouter/page.tsx` + `[id]/AdminVillaEditClient.tsx`.
- **Action :** exposer dans le formulaire :
  1. Upload livret d'accueil (PDF → `house_manual_pdf_url`)
  2. Bouton ajout photos dédié
  3. Équipements (réutilise `amenities`/`equipment_*`)
  4. Nb chambres (`bedrooms_count`, nouveau) + nb salles de bain (`bathrooms_count`, existant)
  5. Règlement intérieur (`house_rules`, textarea + Markdown)
  6. Sécurité et logement (`safety_info`, textarea + Markdown)
  7. Conditions d'annulation (`cancellation_policy`, textarea + Markdown + lien)

### 3.8 — Demandes : SLA
- **Migration :** M1 (`priority`, `taken_at`, `resolved_at`).
- **Fichiers :** `app/(admin)/admin/demandes/page.tsx` + `app/espace-client/demandes/`.
- **Seuils en variables d'environnement** (toutes) :
  - `SLA_URGENT_TAKEN_HOURS=2`, `SLA_URGENT_RESOLVE_HOURS=24`
  - `SLA_STANDARD_TAKEN_HOURS=8`, `SLA_STANDARD_RESOLVE_HOURS=48`
  - `SLA_STANDARD_REMINDER_HOURS=6`, `SLA_WARN_PERCENT=75`
- **Côté client :** toggle ⚡ « Demande urgente » + mention « À cocher si votre besoin est dans les 24h » → écrit `priority`.
- **Règles SLA :** Standard prise en charge 8h / résolution 48h · Urgente 2h / 24h.
- **Notifications admin (in-app uniquement) :**
  - Urgente → notification immédiate (table `notifications`).
  - Standard non prise en charge à 6h → rappel. **Calculé au rendu de la page admin** (comparaison `created_at` + seuil vs maintenant) — pas de cron, pas de `/api/send-*`. Le badge couleur + le tri « dépassé en haut » assurent la remontée.
  - (Pas d'email — `/api/send-*` et `/emails/` intouchés.)
- **Indicateur visuel par carte :** badge ⚡ URGENT rouge · « Il y a Xh » · couleur 🟢 dans délais / 🟠 ≥75 % / 🔴 dépassé · dépassé remonte en haut.

---

## 7. NE PAS TOUCHER

`app/api/stripe/` · `app/api/webhooks/` · `app/api/send-*/` · `app/api/sync*/` · `tests/` · `emails/` · `lib/stripe/`.

## 8. Contraintes transverses

- TypeScript strict, Tailwind, HeroUI, composants existants réutilisés.
- Chaque correction vérifiée **mobile + desktop**.
- Pas de side-stripe, texte ≥ 11px, tokens unifiés (règles design Kayvila).
- Hooks React avant tout early return.

## 9. Ordre d'exécution

Vague 1 (CSS) → Vague 2 (admin léger) → Vague 3 (admin moyen) → Vague 4 (admin lourd + DB).
Chaque vague : build OK + vérif responsive avant de passer à la suivante.
