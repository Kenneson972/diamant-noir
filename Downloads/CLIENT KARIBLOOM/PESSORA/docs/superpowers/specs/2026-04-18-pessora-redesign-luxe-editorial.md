# PESSORA — Refonte Design Luxe Éditorial

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refonte complète du design PESSORA — style minimaliste luxe éditorial inspiré Nespresso + Le Tanneur, en conservant HeroUI comme base composants.

**Scope:** Site public (homepage, menu, événements, bilan, détail événement) + Dashboard membre (tableau de bord, profil, abonnement).

---

## 1. Système de design

### Palette

| Token | Valeur | Usage |
|---|---|---|
| `--color-black` | `#0a0a0a` | Sections hero, footer, cards noires |
| `--color-white` | `#ffffff` | Nav, sections blanches, product cards |
| `--color-ivory` | `#faf9f7` | Background body, sections alternées |
| `--color-green` | `#3d6b3e` | Accent **exclusivement** dans sections claires |
| `--color-text` | `#111111` | Corps de texte |
| `--color-muted` | `rgba(0,0,0,0.38)` | Texte secondaire |

**Règle absolue :** le vert `#3d6b3e` n'apparaît **jamais** dans les sections noires (`#0a0a0a`). Il est réservé aux sections blanches/ivory (tags, dots, liens, badges).

### Typographie

| Rôle | Police | Poids | Usage |
|---|---|---|---|
| Display | Cormorant Garamond | 300 + italic 300 | Titres hero, sections, cards |
| Body | DM Sans | 300 (texte), 400 (UI/labels) | Navigation, corps, boutons |

**Import Google Fonts :**
```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400&display=swap');
```

**Échelle typographique :**
- Hero title : 72–80px, line-height 0.92, letter-spacing -0.02em
- Section title : 36–42px, line-height 1.0
- Card title : 22–28px, line-height 1.05
- Eyebrow : 8–9px, weight 400, letter-spacing 0.35–0.45em, uppercase
- Body/UI : 11–12px, weight 300–400
- Nav links : 11px, weight 300

### Spacing & radius

- Border-radius cards : `16px`
- Border-radius product cards : `14px`
- Border-radius boutons pill : `24–32px`
- Section padding : `72px 60px` (desktop)
- Section padding mobile : `40px 20px`

### Composants récurrents

**Arrow button (bouton flèche rond) :**
```
width: 36–52px, height: idem, border-radius: 50%
background: #fff (sur fond noir) ou #000 (sur fond blanc)
SVG: flèche droite fine stroke-width 1.5
```

**Tag/Badge vert :**
```
font-size: 8–9px, letter-spacing: 0.2em, uppercase
background: #3d6b3e, color: #fff
padding: 3–5px 8–10px, border-radius: 3–4px
```

**Image card (Nespresso style) :**
```
border-radius: 16px, overflow: hidden
gradient overlay: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)
content: eyebrow (top-left) + titre serif + arrow btn (bottom-left)
hover: transform: scale(1.04) sur l'image de fond
```

---

## 2. Header — double rangée

### Rangée 1 (hauteur 56px)
- **Gauche :** Logo `Pessóra` — Cormorant Garamond 300, 22px, letter-spacing 0.28em, uppercase
- **Centre :** Barre de recherche — border 1px rgba(0,0,0,0.18), border-radius 24px, placeholder DM Sans 12px
- **Droite :** Bouton "Mon Espace" (outline pill) + icône panier avec badge vert

### Rangée 2 (hauteur 72px, centré)
Categories avec icônes SVG + label, `justify-content: center` :

| Icône | Label |
|---|---|
| Shake icon | Shakes |
| Box icon | Gauffres |
| People icon | Événements |
| Heart icon | Bilan |
| Runner icon | Run Club |
| Calendar icon | Réserver |

- Item actif : `background: #f0f0ee`, label `font-weight: 400`
- Hover : `background: rgba(0,0,0,0.04)`
- `border-top: 1px solid rgba(0,0,0,0.07)` séparant les deux rangées
- `position: sticky; top: 0` sur l'ensemble du header

---

## 3. Pages publiques

### 3.1 Homepage (`/`)

**Structure des sections :**

1. **Hero** — `height: 86vh`, fond `#0a0a0a`, gradient + zone image droite simulée (future photo/vidéo). Eyebrow + titre 80px + arrow btn blanc. Aucun texte descriptif.

2. **Nos univers** — fond `#faf9f7`, section-title serif 42px + "Tout explorer" right-aligned. Grille 3 colonnes d'image cards (Shakes, Run Club, Bilan). Hauteur aspect-ratio 3/4.

3. **Découvrez nos shakes** — fond `#fff`, section-title + sous-titre + "Voir la carte". Grille 4 colonnes product cards (tag vert, image, nom, 1 ligne desc, macros, prix, bouton `+` noir).

4. **Section vidéo Événements** — `height: 72vh`, fond `#0a0a0a` (remplacer par `<video autoplay muted loop playsinline>` en production). Card frosted glass centrée : `backdrop-filter: blur(16px)`, border rgba(255,255,255,0.12), border-radius 20px. Intérieur : tag vert + titre serif + CTA pill blanc.

5. **Nos actualités** — fond `#faf9f7`, 2 big cards côte à côte (aspect-ratio 16/9, border-radius 16px) avec overlay gradient + eyebrow + titre + arrow btn.

6. **Footer** — fond `#0a0a0a`, 4 colonnes (logo+tagline, Menu, Espace, Contact). Footer-bottom avec copyright.

### 3.2 Page Carte (`/carte`)

**Structure :**
1. Header identique (nav active : Shakes)
2. **Hero banner** — fond `#0a0a0a`, padding 56px, titre serif "La *carte*" 58px + sous-titre
3. **Filter tabs** — fond `#fff`, pills outline : Tout · Shakes · Gauffres · Compléments · Offres. Tab active : `background: #000; color: #fff`
4. **Chips secondaires** — fond `#faf9f7`, filtres : Protéine · Faible calories · Végétalien · Sans lactose… Chip active : `background: #3d6b3e`
5. **Section Shakes** — titre serif 28px + grille 5 colonnes product cards
6. **Section Gauffres** — idem, cartes légèrement différentes (aspect food)
7. **Banner Bilan** — carte noire full-width arrondie : eyebrow + titre serif + CTA pill blanc

### 3.3 Page Événements (`/evenements`)

**Structure :**
1. Header (nav active : Événements)
2. **Hero** — fond `#0a0a0a`, hauteur 56vh, titre "Nos *événements*"
3. **Filter tabs** — Tous · Run Club · Pop-up · Atelier · Partenariats
4. **Prochain événement** — grande card split 1:1 (`border-radius: 20px`, `overflow: hidden`). Gauche : image/fond sombre. Droite : fond `#0a0a0a`, tag vert + titre serif 46px + date/lieu + CTA pill blanc.
5. **Grille événements** — 3 colonnes. Chaque card : image-overlay (eyebrow date) + body (type vert, titre serif, meta date/lieu) + footer (places dispo + arrow btn)
   - État "Complet" : grayscale + badge overlay + bouton grisé
6. **Banner Run Club récurrent** — carte noire arrondie 20px : titre + meta + CTA pill

### 3.4 Page Bilan Bien-être (`/bilan-bien-etre`)

Utilise le composant HeroUI v3 Calendar (compound API existant). Même structure header. Section noir hero + formulaire sur fond ivory.

### 3.5 Page détail Événement (`/evenements/:slug`)

Structure existante (déjà implémentée en Supabase). À restyler avec les nouveaux tokens uniquement.

---

## 4. Dashboard membre (`/dashboard`)

### Layout
- Header réduit (sans nav-cats)
- `display: grid; grid-template-columns: 240px 1fr`

### Sidebar (240px)
- Avatar initiale (cercle gradient vert foncé)
- Nom + badge plan (vert)
- Navigation items avec icônes SVG : Tableau de bord · Mes événements · Bilans · Run Club · Mon profil · Abonnement
- Item actif : `background: #f0f0ee`
- Déconnexion en bas

### Main content
**KPI row (4 colonnes) :**
- Événements ce trimestre (avec trend ↑)
- Sessions Run Club (valeur en vert)
- Bilans réalisés + prochain
- Statut abonnement + barre de progression

**Row 2 (2 colonnes, ratio 1.4:1) :**
- Card abonnement noire : plan + perks cochés (SVG check vert) + date renouvellement
- Widget événements : liste avec date-box noir + statut badge (Confirmé/En attente)

**Row 3 (2 colonnes) :**
- Colonne gauche : Stats Run Club (grille 2×2 tuiles ivory) + Historique bilans (liste avec dots)
- Colonne droite : Commande rapide (items favoris avec prix -10% membre + bouton `+`)

---

## 5. Implémentation technique

### Approche : Design system first

**Étape 1 — `src/index.css`** : Réécrire les tokens `@theme` Tailwind v4 :
```css
@theme {
  --color-black: #0a0a0a;
  --color-white: #ffffff;
  --color-ivory: #faf9f7;
  --color-green: #3d6b3e;
  --font-display: 'Cormorant Garamond', serif;
  --font-body: 'DM Sans', sans-serif;
  /* ... */
}
```

**Étape 2 — Composants partagés** :
- `src/components/layout/Header.tsx` — double header (nav-top + nav-cats)
- `src/components/ui/ImageCard.tsx` — card image overlay réutilisable
- `src/components/ui/ArrowBtn.tsx` — bouton flèche rond
- `src/components/ui/SectionTitle.tsx` — titre section + sous-titre + lien right

**Étape 3 — Pages** (ordre recommandé) :
1. Homepage
2. Carte/Menu
3. Événements (liste)
4. Dashboard
5. Restyler les pages existantes (détail événement, bilan, profil)

### HeroUI v3 — obligatoire
**Tous les composants interactifs doivent utiliser HeroUI v3**, pas des éléments HTML natifs :
- Navigation links → `HeroUI Link` ou `Navbar`
- Boutons CTA → `HeroUI Button` (variant `solid` ou `ghost`, radius `full` pour pills)
- Inputs recherche → `HeroUI Input`
- Cards produits → `HeroUI Card` + `CardBody` + `CardFooter`
- Tabs (filter tabs) → `HeroUI Tabs` + `Tab`
- Chips filtres → `HeroUI Chip`
- Badges → `HeroUI Badge`
- Avatars dashboard → `HeroUI Avatar`
- Modales / drawers → `HeroUI Modal`
- Bilan Calendar → `HeroUI Calendar` (compound v3 déjà implémenté)
- Formulaires → `HeroUI Input` + `HeroUI Select` + `HeroUI RadioGroup`

Les classes Tailwind du design system s'appliquent via `className` sur les composants HeroUI. Les tokens `--color-*` définis dans `@theme` sont utilisables directement dans les `className` Tailwind.

### Suppression du vert dans les sections noires
Règle à enforcer via revue de code : aucune classe `text-green`, `bg-green`, `border-green` ne doit apparaître dans un contexte `bg-black` ou `bg-[#0a0a0a]`.

---

## 6. Référence visuelle

Mockups validés dans `.superpowers/brainstorm/97155-1776547079/content/` :
- `homepage-full.html` — homepage complète
- `page-menu.html` — page carte/shakes
- `page-evenements.html` — liste événements
- `page-dashboard.html` — espace membre

Inspiration : nespresso.com/fr/fr (structure, spacing, cards, double header)
