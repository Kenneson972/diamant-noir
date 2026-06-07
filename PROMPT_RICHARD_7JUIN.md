# Prompt Cursor — Finalisation Kayvila / Diamant Noir (Directives Richard)

## Contexte

Tu travailles sur Kayvila (Diamant Noir), plateforme de conciergerie de luxe en Martinique.
Client : Richard GELARD-THOMACHOT. Livraison prévue : 16 juin 2026.
Stack : Next.js 14 + Supabase + Stripe Connect + Resend + Tailwind + HeroUI Pro.

Le projet est à ~90%. Stripe Connect, Resend, OTA Sync, responsive, flux achat = OK.
Ce prompt couvre les retours de Richard du 7 Juin 2026.

**RÈGLE : Lire les fichiers concernés AVANT de modifier. Ne jamais coder à l'aveugle.**

---

## 1. ESPACE ADMIN

### 1.1 Tarification saisonnière — Anti-chevauchement

**Analyse :** Le module `seasonal_rates` existe déjà (table + UI admin). Mais aucune validation ne vérifie que deux plages de dates ne se chevauchent pour la même villa.

**Action :**
- Ajouter une validation **côté serveur** (API route POST/PATCH `seasonal_rates`) : avant INSERT/UPDATE, `SELECT` les plages existantes pour la villa et vérifier `start_date <= :new_end AND end_date >= :new_start`
- Ajouter une validation **côté client** (formulaire) : dès que les dates sont saisies, afficher un warning inline si chevauchement
- Message d'erreur : "Cette période chevauche une plage existante (du XX/XX au XX/XX). Veuillez ajuster les dates."
- Bloquer la sauvegarde si chevauchement

### 1.2 Villas — Miniatures dans le tableau

**Analyse :** Le tableau admin des villas n'affiche que du texte (nom, capacité, statut). Pas de photo.

**Action :**
- Ajouter une colonne "Photo" en première position dans le tableau des villas
- Afficher la première image de la villa (celle avec `position: 0` ou la première dans `villa_images`)
- Format : miniature ronde ou carrée, 48×48px, `object-cover`, avec fallback gris si pas d'image
- Optionnel : ajouter au survol un tooltip avec le nom de la villa

### 1.3 Revenus — Corrections

**Analyse :** Trois problèmes distincts sur la page Revenus admin.

**Action 1 — Sous-titre :**
- Remplacer le sous-titre actuel (technique) par : "Commission selon canal de réservation (20% OTA · 25% direct)"

**Action 2 — Taux par canal :**
- Vérifier dans la table `bookings` ou `reservations` le champ `channel` (OTA vs Direct)
- Adapter le calcul `calculateTransferAmounts` pour appliquer 20% si OTA, 25% si Direct
- Afficher le taux appliqué dans le tableau des réservations

**Action 3 — Ventilation par villa :**
- Sous les 6 KPIs globaux, ajouter un tableau avec une ligne par villa :
  - Nom de la villa
  - CA brut (somme des réservations)
  - Commission Kayvila (20% ou 25% selon canal)
  - Reversement net (CA brut - commission)
  - Nombre de réservations
  - Canal majoritaire (OTA ou Direct, basé sur le plus de résas)

---

## 2. ESPACE LOCATAIRE

### 2.1 Profil — Sélecteur d'indicatif téléphonique

**Analyse :** Le champ téléphone a un placeholder +596 mais pas pré-rempli. Pour une clientèle internationale, il faut un sélecteur de code pays.

**Action :**
- Ajouter un `<select>` ou un composant dropdown avant le champ numéro
- Liste des indicatifs prioritaires : +596 (Martinique), +33 (France), +1 (USA), +44 (UK), +49 (Allemagne), +39 (Italie), +34 (Espagne)
- Optionnel : utiliser une librairie légère comme `react-phone-number-input` si déjà installée, sinon un simple select avec ~10 codes suffit
- Pré-sélectionner +596 (Martinique) par défaut
- Le placeholder du champ numéro devient juste "6 96 XX XX XX" (sans indicatif)

### 2.2 Messagerie — Bug scroll (PRIORITÉ)

**Analyse :** Bug UX. La page Messages scroll automatiquement trop bas au chargement, le header disparaît.

**Action :**
- **Ne pas modifier le scroll de la page entière** au chargement
- Le scroll ne doit s'appliquer qu'à l'intérieur du conteneur de conversation (`.messages-container` ou équivalent)
- Au chargement : header visible en haut, conversation scrollée au dernier message
- Vérifier qu'aucun `scrollIntoView`, `scrollTo`, `window.scroll` n'est appelé au montage du composant sur la page entière
- Si nécessaire : wrapper la zone messages dans un conteneur avec `overflow-y-auto` et `height: calc(100vh - <header_height>)`

---

## 3. ESPACE PROPRIÉTAIRE

### 3.1 Réservations — Ajouter les détails

**Analyse :** La page Réservations proprio est squelettique (juste nom villa + compteur). Inutilisable.

**Action :**
- Pour chaque réservation, afficher directement dans le tableau/liste :
  - Dates (arrivée → départ)
  - Nom du voyageur
  - Montant total
  - Statut (badge coloré : Confirmée = vert, Annulée = rouge, En attente = orange)
- Si la liste est vide, afficher un empty state : "Aucune réservation pour le moment"
- Trier par date d'arrivée (la plus proche en premier)

### 3.2 Tâches — Bouton signalement

**Analyse :** Le proprio ne peut pas créer de tâche. Il doit pouvoir signaler un problème.

**Action :**
- Ajouter un bouton "Signaler un problème" en haut de la page Tâches
- Au clic → modal formulaire simple :
  - Type (select : Plomberie, Électricité, Climatisation, Piscine, Jardin, Ménage, Autre)
  - Description (textarea)
  - Priorité (select : Normal, Urgent)
- À la soumission → INSERT dans la table `tasks` + envoyer une notification (email Resend à admin@diamantnoir.com OU créer une alerte dashboard admin)
- Le proprio voit ses tâches créées dans sa liste avec leur statut

### 3.3 Revenus — Ventilation + PDF

**Analyse :** Le proprio voit juste un total net. Aucun détail, aucun téléchargement.

**Action 1 — Ventilation :**
- Sous le total net, ajouter un tableau :
  - Date | Villa | Voyageur | Montant brut | Commission | Net reversé
- Filtre par mois (sélecteur)

**Action 2 — PDF mensuel :**
- Ajouter un bouton "Télécharger le relevé" (ou "Exporter PDF")
- Générer un PDF côté serveur (API route) contenant :
  - En-tête : Kayvila / Diamant Noir, mois/année, nom du propriétaire
  - Tableau des réservations du mois (dates, voyageur, montant, commission, net)
  - Total : CA brut, commission totale, reversement net
  - Pied de page : "Document généré le [date] — Kayvila"
- Utiliser `@react-pdf/renderer` si déjà installé, sinon une solution légère (html2pdf ou puppeteer serverless via API)
- Format : A4, nom du fichier : `releve-[mois]-[année]-kayvila.pdf`

### 3.4 Messagerie propriétaire

**Analyse :** Aucun canal de communication entre le proprio et l'admin Kayvila.

**Action :**
- Créer une page "Messages" dans l'espace proprio (ou un onglet)
- Interface simple : liste des conversations + zone de chat
- Table `messages` (si pas déjà existante) : id, sender_id, receiver_id, subject, content, created_at, read_at
- Le proprio voit ses messages ET peut en créer un nouveau
- Notification admin (badge dashboard + email) quand un nouveau message arrive
- Si la messagerie locataire existe déjà → réutiliser le même composant, adapter les rôles

---

## Ordre de priorité

1. 🔴 **Messagerie locataire — bug scroll** (correction rapide, impact immédiat)
2. 🟡 **Revenus admin** (calcul, affichage, ventilation — cœur business)
3. 🟡 **Réservations proprio** (détails visibles — valeur perçue)
4. 🟡 **Revenus proprio** (ventilation + PDF — promesse de vente)
5. 🔵 **Villas admin — miniatures** (simple, visuel)
6. 🔵 **Tarification — anti-chevauchement** (sécurité données)
7. 🔵 **Profil locataire — indicatif** (UX internationale)
8. 🔵 **Tâches proprio — signalement** (nouvelle fonctionnalité)
9. 🔵 **Messagerie proprio** (nouvelle fonctionnalité)

---

## Fichiers probables à modifier/lire

- `app/admin/revenus/page.tsx`
- `app/admin/villas/page.tsx`
- `app/admin/tarification/page.tsx`
- `app/api/admin/seasonal-rates/route.ts`
- `lib/calculateTransferAmounts.ts`
- `app/proprietaire/reservations/page.tsx`
- `app/proprietaire/revenus/page.tsx`
- `app/proprietaire/taches/page.tsx`
- `app/locataire/profil/page.tsx`
- `app/locataire/messages/page.tsx`
- `components/dashboard/proprio/*`

**Rappel : Toujours lire le fichier avant de le modifier. Code existant > nouveau code.**
