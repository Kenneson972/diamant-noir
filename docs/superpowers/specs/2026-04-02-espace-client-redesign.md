# Espace Client — Refonte Design & UX (V1)

**Date** : 2026-04-02
**Projet** : Diamant Noir — Conciergerie de luxe, Martinique
**Scope** : Refonte complète de l'espace client locataire (design + UX features)
**Approche** : Nouveau layout shell, migration progressive des pages

---

## 1. Contexte & Objectifs

L'espace client existant ressemble à un dashboard générique. L'objectif est de le rendre cohérent avec l'identité éditoriale du site marketing (offwhite/navy/gold, Playfair Display), en y ajoutant les features UX manquantes pour une expérience conciergerie premium.

**Problèmes actuels :**
- Design "dashboard générique" — ne ressemble pas à Diamant Noir
- Double pattern auth invité (bandeau + cards "connexion requise")
- Messagerie sans persistance (refresh efface tout)
- Livret sans empty state ni export PDF
- Pas de checklist avant-arrivée
- Pas d'ajout au calendrier
- Wi-Fi sans copier/masquer

---

## 2. Design System

### Palette
| Token | Valeur | Usage |
|-------|--------|-------|
| Navy | `#0D1B2A` | Texte principal, sidebar (V actuel — supprimé du contenu) |
| Gold | `#D4AF37` | Accents, règles actives, badges, CTAs |
| White | `#FFFFFF` | Fond sidebar, fond contenu, fond cards |
| Off-white | `#FAFAF8` | Fond page body, inputs, zones secondaires |
| Border | `rgba(13,27,42,0.07)` | Séparateurs, bordures cards |
| Gold border | `rgba(212,175,55,0.28)` | Bordures éléments gold |

### Typographie
| Rôle | Police | Style |
|------|--------|-------|
| Titres pages | Playfair Display | 400, regular |
| Titres cartes | Playfair Display | 400, italic possible |
| Corps éditorial | Cormorant Garamond | 300, italic pour sous-titres |
| Labels / nav / badges | Inter | 400-500, uppercase, letter-spacing |

### Règles visuelles
- **Zéro bloc sombre dans le contenu** — navy uniquement pour le texte
- **Accent card** : règle `border-top: 2px solid #D4AF37` sur les cards principales
- **Indicateur nav actif** : trait `2px` gold à gauche de l'item, label `color: #0D1B2A font-weight:500`
- **Icônes** : SVG thin-line (stroke-width 1), personnalisés par le client — placeholders en attendant
- **Compteurs** : Playfair Display large (ex: "12 jours", "1/3")

---

## 3. Architecture

### Approche : Nouveau Layout Shell

Remplacer `EspaceClientLayout` existant par un nouveau composant qui implémente le design system blanc.

```
app/espace-client/
├── layout.tsx          ← EspaceClientLayout v2 (sidebar + bottom bar)
├── page.tsx            ← Séjour (accueil)
├── livret/page.tsx     ← Livret d'accueil
├── messagerie/page.tsx ← Conciergerie IA
├── documents/page.tsx  ← Documents
└── conciergerie/page.tsx ← Contacts & urgences
```

### Contexte global

Le layout charge en Server Component :
- La réservation `upcoming` la plus proche (`status = 'confirmed' OR 'upcoming'`, `check_in > now()`, `order by check_in asc limit 1`)
- Exposée via `BookingContext` (React context) pour toutes les pages enfants

### Auth — Pattern unique

**Supprimer** le double pattern actuel (bandeau "Accès invité" + cards "Connexion requise").
**Remplacer par** : middleware redirect — si `session = null`, redirect vers `/login?redirect=/espace-client`.
Plus de contenu fantôme visible en état invité.

---

## 4. Navigation

### Desktop (≥ 640px)
Sidebar 188px blanche, bordure droite `1px rgba(13,27,42,0.07)`.

**Items** (dans l'ordre) :
1. Séjour (icône maison)
2. Livret (icône livre ouvert)
3. Messages (icône bulle) + dot gold si non lus
4. Documents (icône document)
5. Conciergerie (icône profil)

**États** :
- Inactif : icône `stroke rgba(13,27,42,0.22)`, label `rgba(13,27,42,0.32)`
- Actif : indicateur trait `2px #D4AF37` à gauche, icône gold, label navy `font-weight:500`
- Hover : `background rgba(13,27,42,0.025)`

En bas de sidebar : avatar initiale + nom locataire + rôle "Locataire"

### Mobile (< 640px)
Bottom bar blanche, `border-top: 1px solid rgba(13,27,42,0.07)`, `padding-bottom: env(safe-area-inset-bottom)`.

**4 onglets** : Accueil · Livret · Messages · Profil
(Conciergerie & Documents accessibles via "Plus" ou menu secondaire)

**États** :
- Inactif : icônes `stroke rgba(13,27,42,0.22)`, labels `rgba(13,27,42,0.4)`, opacity 0.22
- Actif : icônes gold, labels gold, dot gold en dessous

### Topbar (partagée)
Hauteur 52px, `border-bottom: 1px solid rgba(13,27,42,0.06)`, fond blanc.
Contenu : `[Section eyebrow] — [Titre page]` · spacer · badge contextuel (ex: "J — 12")

---

## 5. Pages

### 5.1 Séjour (Accueil)

**Hero card** : `border-top: 2px solid #D4AF37`, fond blanc, `border-radius: 2px`.
- Gauche : eyebrow "Votre prochain séjour" (gold), nom villa (Playfair 24px), dates (Cormorant italic)
- Droite : compteur jours (Playfair 36px) + CTA "Voir le livret →" (gold, underline)

**Accès rapide** : 4 colonnes éditoriales séparées par `border-left: 1px solid rgba(13,27,42,0.07)`.
- Avant l'arrivée · Wi-Fi · Calendrier · PDF Livret
- Icône SVG 16px + label uppercase + sous-label Cormorant italic
- Hover : `border-left-color: rgba(212,175,55,0.35)`, icône opacity 0.65

**Cas : pas de réservation upcoming** : message éditorial "Aucun séjour à venir — [Réserver une villa →]"

### 5.2 Livret d'accueil

**Layout desktop** : 2 colonnes — index (gauche, 200px) + contenu (droite).

**Index** (sections) :
1. Wi-Fi & accès
2. Check-in / Check-out
3. Contacts utiles
4. À proximité
5. Équipements
6. Urgences

Chaque item : icône SVG + label uppercase + flèche. Actif : flèche gold.

**Contenu** : eyebrow gold + titre Playfair + contenu section.

**Section Wi-Fi** :
- Champ mot de passe masqué par défaut (`type="password"` ou `•••••••`)
- Bouton masquer/afficher (icône œil SVG)
- Bouton "Copier" — copie en clipboard, feedback visuel "Copié ✓" pendant 2s

**Section Check-in/out** : tableau de clés/valeurs (Cormorant), lien Maps (gold).

**Bouton PDF** : "Télécharger le livret complet" en haut à droite (topbar) ET en bas de chaque section.

**Empty state** : si `welcomeBook` a tous les champs vides → afficher :
> *"Le livret sera complété avant votre arrivée par l'équipe Diamant Noir."*

(Cormorant italic, centré, pas de sections vides visibles)

### 5.3 Avant l'arrivée (Checklist)

Section accessible depuis la page Séjour (CTA "Avant l'arrivée") ou nav secondaire.

**Header** :
- Titre "Avant votre arrivée" (Playfair) + sous-titre Cormorant italic avec date
- Compteur "X / N" (Playfair 28px) + barre de progression gold

**Items checklist** :
- Cercle cochable (30px) : vide → coché (fond gold + checkmark blanc)
- Label uppercase + description Cormorant italic
- Item coché : label barré `text-decoration-color rgba(13,27,42,0.2)`, couleur `rgba(13,27,42,0.35)`
- CTA inline pour items actionnables (ex: "Signer maintenant →", "iCal · Google · Outlook →")

**Items V1** :
1. Pièce d'identité (pré-coché si fourni à la réservation)
2. Contrat de location signé (lien vers signature électronique)
3. Ajouter au calendrier (boutons .ics / Google Calendar / Outlook)
4. Horaires & accès (informatif, lien vers livret)

**Persistance** : état des cases cochées sauvegardé en Supabase sur la table `bookings` via une colonne JSONB `checklist_state` (ex: `{"identity": true, "contract": false, "calendar": false}`). Pas de table dédiée — évite une migration supplémentaire.

### 5.4 Messagerie (Conciergerie IA)

**Bandeau contexte** (sous topbar) :
- Icône villa + "Villa Diamant · 14 → 21 avril"
- Statut "Réponse sous 2 h" (pas de faux "En ligne")

**Zone messages** :
- `role="log"` + `aria-live="polite"` + `aria-label="Historique de conversation"`
- Bulles bot : fond blanc, bordure fine, `border-radius: 0 8px 8px 8px`, Cormorant Garamond 14px
- Bulles user : fond `#0D1B2A`, `border-radius: 8px 0 8px 8px`, Inter 13px blanc
- Indicateur de frappe : 3 dots animés (CSS keyframes opacity)
- Timestamp discret sous chaque message

**Input** :
- Textarea Cormorant italic, fond off-white
- Bouton envoyer navy → hover gold, `aria-label="Envoyer le message"`
- Mention RGPD discrète : "Échanges conservés pour la qualité du service"
- Indicateur de persistance : "Conversation sauvegardée" (8px, uppercase, gris clair)

**Persistance** :
- `sessionId` stable stocké en `localStorage` (`dk_session_[userId]`)
- Historique chargé depuis Supabase table `chat_messages` au montage du composant
- Messages sauvegardés en temps réel via `upsert` Supabase

**Contexte n8n** : `villaId` + `bookingId` passés dans chaque requête n8n pour que la conciergerie ait le bon contexte.

**Lazy loading** : `TenantChatbot` chargé via `React.lazy()` + `Suspense` — ne bloque pas le chargement de l'espace client.

### 5.5 Documents

Liste des documents disponibles avec état (disponible / à venir).

- Contrat de location
- Confirmation de réservation
- Facture (si applicable)

Supprimer les cards "Bientôt disponible" sans date — afficher uniquement les documents réels. Si aucun document : empty state éditorial.

### 5.6 Conciergerie (Contacts & Urgences)

Contacts structurés : conciergerie, gardien, SAMU (15), Police (17), Pompiers (18).
Chaque contact : nom + numéro + bouton `tel:` cliquable.
Vérifier que tous les numéros sont réels et cohérents.

---

## 6. Features Transversales

### Ajouter au calendrier
Génère un fichier `.ics` (RFC 5545) avec `DTSTART`, `DTEND`, `SUMMARY`, `LOCATION`.
3 boutons :
- **iCal** : téléchargement d'un fichier `.ics` généré côté client (RFC 5545)
- **Google Calendar** : `https://calendar.google.com/calendar/render?action=TEMPLATE&text={titre}&dates={YYYYMMDD}/{YYYYMMDD}&details={description}&location={adresse}`
- **Outlook** : `https://outlook.live.com/calendar/0/deeplink/compose?subject={titre}&startdt={ISO}&enddt={ISO}&body={description}&location={adresse}`

### PDF Livret
Bouton "Télécharger" en topbar du livret.
V1 : génération côté client via `window.print()` sur une page `/livret/print` dédiée (CSS `@media print` avec mise en page propre, sans navigation).
V2 : génération serveur via Puppeteer/Edge Function Supabase.

### Rechargement auth
Le layout écoute `onAuthStateChange` (Supabase) — si la session change (login depuis un autre onglet, magic link), invalide le cache et recharge les données de réservation.

---

## 7. Hors Scope V1

- Notifications email/push J-7 et veille d'arrivée
- Messagerie asynchrone staff ↔ locataire (table dédiée)
- Profil voyageur (langue, besoins PMR)
- Génération PDF serveur (Puppeteer)
- Sélecteur de réservation dans la messagerie (si une seule réservation active en V1)

---

## 8. Contraintes Techniques

- **Next.js 14** App Router — Server Components par défaut, `"use client"` uniquement sur composants interactifs
- **Tailwind CSS 3.4** — breakpoints `xs: 430px`, `sm: 640px`, tokens gold/navy déjà configurés
- **Supabase** — auth, PostgreSQL, realtime pour le chat
- **Fonts** : Playfair Display (déjà chargé) + Cormorant Garamond (à ajouter dans `layout.tsx`)
- **Build** : `npm run build` doit passer sans erreur TypeScript

---

## 9. Ordre d'implémentation (3 sous-projets)

1. **Layout & Design System** — `EspaceClientLayout` v2, tokens Cormorant, suppression double pattern auth
2. **UX Features** — Pages Séjour, Livret (Wi-Fi, PDF, empty state), Checklist (iCal, persistance)
3. **Chat & Messagerie** — Persistance localStorage + Supabase, contexte réservation, lazy loading
