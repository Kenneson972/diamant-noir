# Plan Visibilité Icônes PNG Kayvila — 22 Juin 2026

**Généré par Élise** — 3 subagents parallèles (audit code, recherche UI, état du pack)

---

## 🩺 DIAGNOSTIC — Pourquoi les icônes ne sont pas assez visibles ?

1. **Taille dominante : 18-20px** — c'est fonctionnel, pas "design-first"
2. **Pas de motion** — aucune animation CSS, pas de fade-in, pas de float
3. **Pas de contenant** — les icônes sont nues, sans background, sans carte, sans forme
4. **Pas de hiérarchie** — une icône 20px sur la homepage a le même traitement qu'une icône 20px dans le dashboard
5. **Le hero est nu** — aucune icône Kayvila dans le premier écran visible

---

## 🎯 PLAN D'ACTION — Par surface, priorité décroissante

### ⭐ PRIORITÉ 1 — Homepage Hero (impact maximal)

**Problème :** Zéro icône dans le premier écran.

**Solution : Hero avec motif d'icônes en fond**
- Grille flottante des 5 icônes piliers (opacité 8%, taille 120-200px) en arrière-plan
- Animation `@keyframes float` différente par icône (délai stagger 1s)
- Sur mobile : 3 icônes au lieu de 5

**Solution alternative : Icône centrale monumentale**
- Une icône Kayvila (villa ou étoile) en 200-300px, `opacity: 0.15`, centrée derrière le titre
- Ajoute de la texture sans distraire

**Code estimé :** 30-50 lignes CSS + 1 nouveau composant `HeroIconPattern`

---

### ⭐ PRIORITÉ 2 — Cartes piliers (HomeServicesSection)

**Problème :** Icônes à 36px — déjà bon, mais "timides" selon Ken.

**Solution : Glassmorphism Cards**
```css
.icon-card {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(212,175,55,0.15);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}
.icon-card:hover {
  border-color: rgba(212,175,55,0.4);
  box-shadow: 0 8px 32px rgba(212,175,55,0.08);
  transform: translateY(-4px);
}
```
- Icône pilier en 48-56px (au lieu de 36)
- Halo doré `radial-gradient` derrière l'icône
- Effet glass + hover lift

**Solution alternative : Bento Grid**
- Disposition asymétrique de tiles iconographiques à la Linear/Notion
- Trois grandes cartes (marketing, opérations, voyageurs) + deux plus petites (finance, ménage)

---

### ⭐ PRIORITÉ 3 — Conciergerie (HomeConciergeHighlight)

**Problème :** Icônes à 20px dans des cartes simples.

**Solution : Circle + Glow**
- Chaque icône dans un cercle `rgba(212,175,55,0.08)` de 56px
- Halo `box-shadow: 0 0 24px rgba(212,175,55,0.15)` au centre
- Animation fade-in + slide-up au scroll (IntersectionObserver)
- Icônes à 28px dans les cercles

---

### ⭐ PRIORITÉ 4 — Page Qui Sommes-Nous (banc ADN)

**Problème :** 6 icônes déjà à 28px dans EditorialServiceGrid — bien, mais statiques.

**Solution : Animated Entrance**
- Chaque icône apparaît avec `opacity 0 → 1` + `translateY(12px → 0)` en cascade (délai 100ms par icône)
- `transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1)`

---

### ⭐ PRIORITÉ 5 — Dashboard Sidebar (espace client & proprio)

**Problème :** Les icônes de navigation sont 100% Lucide. Ken veut voir ses PNG dans le dashboard.

**Solution partielle : Icône active en gold**
- Les icônes Lucide de la sidebar restent (navigation = UI)
- MAIS : ajouter une icône Kayvila en haut de la sidebar (logo ou `villa` en 32px)
- Pour l'indicateur actif : fond `rgba(212,175,55,0.1)` + icône en gold

**Solution alternative : Stats Cards avec icônes Kayvila**
- Dans les vues dashboard (VillasView, BookingsView, FinancesView), remplacer les petites icônes inline par des cartes stats avec PNG Kayvila + chiffre clé

---

### ⭐ PRIORITÉ 6 — Fiche Villa (équipements)

**Problème :** 22 équipements à 20px — bon, mais "checklist fade".

**Solution : Icon Grid**
- Disposition en grille 2×2 ou 3×3 au lieu d'une liste verticale
- Chaque équipement dans une carte miniature (verre dépoli, bordure gold subtile)
- Icône à 24px + label
- Animation staggered fade-in

---

### PRIORITÉ 7 — Animations globales réutilisables

Créer un fichier `styles/icon-animations.css` avec :

```css
@keyframes icon-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes icon-glow-pulse {
  0%, 100% { box-shadow: 0 0 12px rgba(212,175,55,0.1); }
  50% { box-shadow: 0 0 24px rgba(212,175,55,0.25); }
}

@keyframes icon-enter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.icon-float { animation: icon-float 4s ease-in-out infinite; }
.icon-glow { animation: icon-glow-pulse 3s ease-in-out infinite; }
.icon-enter { animation: icon-enter 0.5s cubic-bezier(0.16,1,0.3,1) both; }
```

- Appliquer `.icon-float` aux icônes hero
- Appliquer `.icon-enter` + `animation-delay: calc(var(--i) * 100ms)` aux grilles
- Appliquer `.icon-glow` aux cercles dorés

---

## 🧹 NETTOYAGE RAPIDE

Supprimer les 9 fichiers orphelins (typos/doublons) dans `public/brand/icons-png/` :
- `checkcircle.png`, `clock24.png`, `messages.png`, `shieldcheck.png`
- `pillierfinance.png`, `pilliermarket.png`, `pilliermenage.png`, `pillieroperation.png`, `pilliervoyageurs.png`

---

## 📊 RÉSUMÉ — Temps estimé

| Priorité | Surface | Effort | Impact |
|---|---|---|---|
| P1 | Hero Pattern | ~1h | ⭐⭐⭐⭐⭐ |
| P2 | Cartes Piliers Glass | ~1h30 | ⭐⭐⭐⭐⭐ |
| P3 | Conciergerie Circles | ~45min | ⭐⭐⭐⭐ |
| P4 | ADN Animations | ~30min | ⭐⭐⭐ |
| P5 | Dashboard Stats | ~1h | ⭐⭐⭐ |
| P6 | Équipements Grid | ~1h | ⭐⭐⭐ |
| P7 | Animations Globales | ~30min | ⭐⭐⭐⭐ |
| — | Nettoyage orphelins | ~5min | — |

**Total estimé : ~6h** pour tout déployer.

---

## 🎨 Références visuelles

- **Linear** — sidebar icons, glass cards, hover transitions
- **Stripe** — narrative icons, scroll-triggered animations
- **Vercel** — Geist icon system, consistent sizing
- **Apple** — floating animation, frosted glass
- **Notion** — bento layouts, icon grids
