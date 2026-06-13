# Kayvila — Espace Propriétaire : Fixes & Améliorations

**Date :** 2026-06-08
**Périmètre :** `diamant-noir/app/(proprio)/dashboard/` + composant footer global
**Source :** Remarques utilisateur (9 items)

---

## 1. Vue d'ensemble

Lot de 9 améliorations dans l'espace propriétaire Kayvila, mêlant bugfixes (axe Y, mobile, données manquantes) et features (blocages calendrier, stats saisonnières, livret d'accueil, conditions d'annulation, ventilation revenus, contact Kayvila).

### Architecture impactée

**Nouvelles tables Supabase**
- `villa_date_blocks` — blocages de dates par le propriétaire
- `villa_cancellation_policies` *(optionnel — peut rester en colonnes sur `villas` si pas d'historique nécessaire)*
- `owner_contact_messages` — audit trail des messages "Contacter Kayvila"
- `seasons_config` — table admin pour définir les périodes saisonnières par année

**Nouvelles colonnes sur `villas`**
- `bedrooms` (int, NOT NULL DEFAULT 0)
- `welcome_booklet_url` (text, nullable) — chemin Storage
- `cancellation_template` (enum: `flexible` | `moderate` | `strict`, default `moderate`)
- `cancellation_notes` (text, nullable, max 500 chars)
- `commission_rate` (numeric(5,2), NOT NULL DEFAULT 25.00) — taux commission Kayvila en %, par villa (permet contrats négociés au cas par cas)

**Storage**
- Bucket `welcome-booklets` (privé), RLS : `villa.owner_id = auth.uid()`, structure `{villa_id}/booklet.pdf`

**Edge Functions Supabase**
- `send-welcome-booklet` — cron quotidien 06:00 UTC, envoie le livret au voyageur J-3
- `send-owner-contact` — envoie email Resend vers support@kayvila.com
- `compute-owner-stats` — calcul stats saisonnières/mensuelles (fallback si cache absent)
- `recompute-owner-stats` — cron quotidien 04:00 UTC, refresh table `owner_stats_snapshots`

**Routes API Next.js (Node runtime)**
- `app/api/proprio/revenus/export-pdf/route.ts` — génération PDF (`@react-pdf/renderer`, nécessite Node runtime, pas Deno/Edge)

---

## 2. Détails par item

### #1 — Axe Y dashboard (formatage K€)

**Problème :** L'axe des valeurs affiche `1€` pour des milliers d'euros.
**Solution :** Formatter Recharts/Chart.js sur l'axe Y :
```ts
tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K€` : `${v}€`}
```
Format **K€** retenu (compact, lisible mobile). Appliqué à tous les graphiques revenus/réservations du dashboard.

**Tests :** vérifier rendu sur valeurs 0, 999, 1000, 1500, 12500, 100000.

---

### #2 — Blocages de dates par le propriétaire

**Nouvelle page :** `/dashboard/villas/[id]/disponibilites`

**Schéma SQL**
```sql
CREATE TABLE villa_date_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id uuid NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  CHECK (end_date >= start_date)
);
CREATE INDEX idx_villa_date_blocks_range ON villa_date_blocks (villa_id, start_date, end_date);
```

**RLS** : `villa.owner_id = auth.uid()` (lecture + écriture)

**UI — composant `<AvailabilityCalendar />`**
- Vue 3 mois côte à côte (responsive : 1 mois sur mobile, 3 sur desktop)
- Code couleur :
  - 🟢 vert : disponible
  - 🔴 rouge : réservé (read-only, clic → fiche réservation)
  - ⚫ noir : bloqué par le proprio (éditable)
  - ⚪ gris : passé (non interactif)
- Interaction :
  - Clic simple cellule libre → sélection date début (état visuel "selection in progress")
  - Clic 2nde cellule → plage sélectionnée → ouverture modale
  - Clic cellule déjà bloquée → modale d'édition (modifier motif / supprimer)
- Modale "Bloquer du JJ/MM au JJ/MM" :
  - Champ motif optionnel (placeholder : "Ex. usage personnel, travaux…")
  - Boutons Annuler • Confirmer le blocage
- Tableau sous le calendrier : liste des blocages futurs (date début, fin, motif, actions modifier/supprimer)

**Conflict guard** (avant INSERT)
```sql
SELECT COUNT(*) FROM reservations
WHERE villa_id = $1
  AND status = 'confirmed'
  AND tstzrange(check_in, check_out, '[)') && tstzrange($2, $3, '[)');
```
Si > 0 → erreur "X réservation(s) existante(s) sur cette période, blocage impossible."

**Impact côté public**
- Modifier `/api/availability` (ou query équivalente) pour exclure les plages `villa_date_blocks`
- Le calendrier de réservation public doit afficher ces dates comme indisponibles (même couleur que les dates réservées, pas de distinction visible côté visiteur)

---

### #3 — Statistiques saisonnières + courbe minimum

**Page modifiée :** `/dashboard/statistiques`

**Tableau "Performance par saison"** (haut de page)
| Saison | Nuitées réservées | Taux occupation % | Revenu net | Prix moyen/nuit |
|--------|-------------------|-------------------|------------|-----------------|
| Haute saison | … | … | … | … |
| Vacances scolaires zone C | … | … | … | … |
| Moyenne saison | … | … | … | … |
| Basse saison | … | … | … | … |

**Tableau mensuel** (en dessous) — 12 lignes Jan→Déc, mêmes colonnes, badge couleur saison à gauche.

**Définition des saisons** — table admin `seasons_config`
```sql
CREATE TABLE seasons_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  season_type text NOT NULL CHECK (season_type IN ('high','mid','low','school_holidays')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  occupancy_threshold int NOT NULL,
  created_at timestamptz DEFAULT now()
);
```
Défauts Martinique (zone C) :
- Haute : juillet–août + vacances Noël + vacances février + vacances Pâques (seuil 75%)
- Moyenne : juin, septembre, octobre (seuil 50%)
- Basse : novembre→mars hors vacances (seuil 25%)
- Vacances scolaires : tracées séparément si chevauchement avec basse/moyenne

**Courbe taux d'occupation** (Recharts `LineChart`)
- Ligne pleine bleue : occupation réelle mois par mois (12 points)
- Ligne pointillée orange : seuil minimum saisonnier (varie par mois selon `seasons_config`)
- Zone rouge translucide sous le seuil → repère visuel "sous-performance"
- Tooltip au survol : valeur réelle vs seuil vs delta

**Compute — stratégie hybride (lecture rapide + cron de pré-calcul)**

Plutôt que recalculer à la volée à chaque vue (risque de timeout Edge à mesure que les réservations s'accumulent), on pré-calcule :

- Nouvelle table cache `owner_stats_snapshots`
  ```sql
  CREATE TABLE owner_stats_snapshots (
    owner_id uuid NOT NULL REFERENCES auth.users(id),
    year int NOT NULL,
    villa_id uuid REFERENCES villas(id),  -- NULL = agrégé tous les biens
    seasonal jsonb NOT NULL,
    monthly jsonb NOT NULL,
    threshold_line jsonb NOT NULL,
    computed_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (owner_id, year, villa_id)
  );
  ```
- **Cron quotidien** (Supabase `pg_cron` ou cron Vercel) `recompute-owner-stats` à 04:00 UTC : recalcule pour tous les `(owner, year, villa)` actifs et upsert dans le cache
- **Recompute incrémental** : trigger `AFTER INSERT/UPDATE/DELETE ON reservations` → marque la ligne `owner_stats_snapshots` correspondante comme stale (`computed_at = NULL`) ; le prochain accès page la recalcule à la volée si stale
- **Page proprio** : lit `owner_stats_snapshots` (rapide, ms), `revalidate: 3600` reste OK pour le cache HTTP
- **Fallback** : si snapshot absent (premier accès), Edge Function `compute-owner-stats` calcule en direct et upsert dans le cache

Cette approche bornée évite tout risque de timeout, même avec plusieurs centaines de réservations.

---

### #4 — Livret d'accueil

**UI dans fiche villa (édition)** — nouvelle section "Documents"
- Dropzone PDF uniquement (validation MIME `application/pdf`), max 10 Mo
- État vide : "Aucun livret. Glissez un PDF ou cliquez pour téléverser."
- État rempli : nom fichier + taille + bouton "Télécharger" + bouton "Remplacer" + bouton "Supprimer"

**Storage**
- Bucket `welcome-booklets` (privé)
- Chemin : `{villa_id}/booklet.pdf` (écrasement à chaque upload)
- RLS : `(storage.foldername(name))[1] IN (SELECT id::text FROM villas WHERE owner_id = auth.uid())`

**Envoi automatique J-3**
- Edge Function `send-welcome-booklet` déclenchée par cron Supabase (`pg_cron` ou cron externe) à 06:00 UTC quotidien
- Query :
```sql
SELECT r.*, v.welcome_booklet_url, g.email AS guest_email, g.first_name
FROM reservations r
JOIN villas v ON v.id = r.villa_id
JOIN guests g ON g.id = r.guest_id
WHERE r.check_in = CURRENT_DATE + INTERVAL '3 days'
  AND r.status = 'confirmed'
  AND r.welcome_booklet_sent_at IS NULL;
```
- Pour chaque résa : génère signed URL 7 jours via Supabase Storage, envoie email Resend (template "Votre livret d'accueil" + CTA bouton "Télécharger le livret")
- Marque `welcome_booklet_sent_at = now()` après envoi (nouvelle colonne sur `reservations`)
- Fallback : si `welcome_booklet_url IS NULL` → envoi email standard sans pièce jointe

**Indicateur côté proprio** : badge "📎 Livret envoyé le JJ/MM" sur la ligne réservation.

---

### #5 — Conditions d'annulation

**Templates Kayvila** (constants TS `lib/cancellation-templates.ts`)
- **Flexible** :
  > Annulation gratuite jusqu'à 7 jours avant l'arrivée. 50 % remboursé entre J-7 et J-2. Aucun remboursement à moins de 48 h.
- **Modérée** (défaut) :
  > Annulation gratuite jusqu'à 14 jours avant l'arrivée. 50 % remboursé entre J-14 et J-7. Aucun remboursement à moins de 7 jours.
- **Stricte** :
  > 50 % remboursé jusqu'à 30 jours avant l'arrivée. Aucun remboursement à moins de 30 jours.

**UI fiche villa (édition)**
- `RadioGroup` HeroUI avec les 3 cartes (titre + résumé court)
- Aperçu en temps réel du texte complet sous la sélection
- `Textarea` "Remarques additionnelles" (optionnel, max 500 caractères, compteur)

**Affichage public** (fiche villa)
- Encart pliable "Conditions d'annulation" (composant `Accordion` HeroUI)
- Texte du template choisi, puis si `cancellation_notes` non vide : sous-section "À noter" avec les remarques du proprio

---

### #6 — Nombre de chambres

- Ajout colonne `bedrooms` (int, default 0) sur `villas`
- Input number dans formulaire édition villa, section "Informations générales", à côté de capacité et SDB
- Affichage public sur la fiche villa : ligne `X chambres • Y voyageurs • Z SDB` (icônes Lucide : `BedDouble`, `Users`, `Bath`)
- Filtres recherche : ajout filtre "Nb chambres min" (optionnel, si UX produit le valide — pas dans le scope ici)

---

### #7 — Bug page Réservations mobile

**Diagnostic à confirmer** : table HTML qui déborde en largeur sur mobile.

**Solution**
- Sous breakpoint `md` (768px) : remplacer la table par une **liste de cartes** empilées
  - Carte : nom voyageur • dates • villa • montant • statut (badge)
  - Boutons d'action (voir détail, annuler) en bas de carte
- Au-dessus de `md` : conserver la table actuelle
- Audit CSS : retirer `min-width` fixes, `whitespace-nowrap` non nécessaires, `overflow-x` masqué

**Tests Playwright**
- iPhone SE (375 × 667)
- iPhone 14 Pro Max (430 × 932)
- iPad (768 × 1024)
- Aucun débordement horizontal, scroll vertical uniquement

---

### #8 — Revenus : ventilation par réservation

**Page modifiée :** `/dashboard/revenus`

**Tableau principal** (DataTable HeroUI)
| Date arrivée | Voyageur | Villa | Nuits | Brut | Commission Kayvila | Frais ménage | Net proprio | Statut paiement | ▼ |

> Les colonnes Commission et Net utilisent `villas.commission_rate` (par défaut 25 %, modifiable par villa via contrat). Le taux appliqué est affiché entre parenthèses dans l'en-tête de la row extensible.

**Row extensible** (clic chevron `▼`)
Panneau détail :
- **Décomposition financière** :
  - Brut HT : XXX €
  - Taxes séjour (assiette + montant) : XXX €
  - Frais ménage (revenu net proprio) : XXX €
  - Remises appliquées : -XXX €
  - Commission Kayvila ({{commission_rate}} %) : -XXX €
  - **Net reversé : XXX €**
- **Stripe Connect** :
  - ID transfer : `tr_xxxx`
  - Date reversement effectif : JJ/MM/AAAA
  - Statut : `en attente` / `virement émis` / `soldé`
- Lien "Voir la réservation complète" → `/dashboard/reservations/[id]`

**Filtres en tête**
- Période : Mois en cours (défaut) • 3 derniers mois • Année en cours • Custom (date range picker)
- Villa : multi-select (défaut "Toutes")
- Statut paiement : multi-select (en attente / émis / soldé)

**Footer du tableau** — totaux ligne
| Brut total | Commissions | Frais ménage | **Net total proprio** |

**Export PDF** (bouton "Exporter en PDF")
- **Route Next.js API (Node runtime)** : `app/api/proprio/revenus/export-pdf/route.ts` avec `export const runtime = 'nodejs'`
  - Raison : `@react-pdf/renderer` et `pdfmake` ne tournent pas en Deno vanilla (deps Node-only). Un endpoint Next.js en Node runtime résout le problème sans dépendre de l'écosystème Edge.
  - Alternative envisagée si on tenait absolument à Edge : `jsPDF` (Deno-compatible) — moins riche en mise en page, écarté.
- Lib : `@react-pdf/renderer` (composants React → PDF, mise en page Kayvila contrôlable)
- Rapport mensuel : logo, période, totaux, tableau ventilé, mentions fiscales
- Téléchargement direct, nom fichier `revenus-kayvila-{owner_slug}-{periode}.pdf`
- Timeout route : prévoir streaming si > 100 lignes pour éviter le timeout Vercel (10s hobby / 60s pro)
- **Pas de CSV** dans cette itération (à ajouter ultérieurement si demande)

---

### #9 — Modale "Contacter Kayvila" (footer global)

**Emplacement** : composant `<OwnerContactFooter />` injecté dans `diamant-noir/app/(proprio)/dashboard/layout.tsx`
- Bouton flottant bas-droite (FAB) : icône `Mail` Lucide + label "Contacter Kayvila"
- Z-index au-dessus du contenu, en dessous des modales/toasts
- Visible sur **toutes** les pages dashboard proprio

**Modale** (réutilise le composant existant "Signaler un problème")
- `Select` Objet : Reversement / Facturation • Disponibilités • Mon contrat • Autre
- `Select` Villa concernée (préfill automatique si on est sur une fiche villa ; sinon "Aucune villa spécifique" disponible)
- `Textarea` Message (min 10 caractères, max 2000, compteur)
- Boutons Annuler • Envoyer

**Backend**
- Table `owner_contact_messages` (audit trail)
```sql
CREATE TABLE owner_contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  villa_id uuid REFERENCES villas(id),
  subject text NOT NULL CHECK (subject IN ('reversement','disponibilites','contrat','autre')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
```
- Edge Function `send-owner-contact` → email Resend vers `support@kayvila.com`
  - Template HTML : nom propriétaire, email, villa concernée, objet, message, lien admin "Voir dans le back-office"
- Toast HeroUI succès : "Votre message a bien été envoyé. Nous vous répondrons sous 48h."

**Rate limit** : 5 messages / heure / propriétaire (via `created_at >= now() - interval '1 hour'`), erreur 429 si dépassé.

---

## 3. Plan de migration & ordre d'exécution

1. **Migrations SQL** : nouvelles tables + colonnes + bucket Storage + RLS policies
2. **Quick fixes** : axe Y K€, bug mobile réservations, champ chambres (parallèle)
3. **Features villa** : livret d'accueil (UI + Edge Function J-3), conditions d'annulation
4. **Calendrier blocages** : nouvelle page + composant + impact public
5. **Stats saisonnières** : `seasons_config` + Edge Function compute + UI
6. **Revenus ventilation** : refonte tableau + Edge Function PDF
7. **Contact footer global** : composant footer + Edge Function + table audit
8. **Tests E2E Playwright** sur mobile + desktop

## 4. Tests

- **Unitaires** : formatter K€, validateur PDF max 10 Mo, conflict guard blocages
- **E2E Playwright** : flow blocage de dates (création, édition, suppression, conflit), upload livret, envoi message contact, export PDF revenus, responsive mobile réservations
- **Cron** : test manuel `send-welcome-booklet` en mode dry-run

## 5. Hors scope (à proposer plus tard si besoin)

- Export CSV des revenus
- Synchronisation iCal (Airbnb/Booking) des blocages
- Notifications push / SMS au voyageur pour le livret
- Historique des templates d'annulation (versionning)
- Filtre "Nb chambres min" dans la recherche publique
