# Login Page Redesign — Spec

**Goal:** Refondre la page `/login` avec un layout 60/40 split-screen, un panneau formulaire blanc épuré sans tabs, des champs underline-only, et une identité visuelle cohérente avec le logo Diamant Noir.

**Logique conservée :** Détection locataire/propriétaire via `?redirect=` URL param. Flow OTP pour locataires (via `TenantMagicLinkFlow`). Flow mot de passe pour propriétaires (via `PasswordPanel`). Toutes les étapes existantes (OTP, profil inscription, confirmation email) sont conservées fonctionnellement.

---

## Layout

### Desktop (≥ `lg` / 1024px)
- Flexbox `flex-row` plein écran (`min-h-[100dvh]`)
- **Gauche — panneau vidéo :** `flex-[1.5]` (~60%). Vidéo `login-side.mp4` `object-cover`, fallback `villa-hero.jpg`, respect `prefers-reduced-motion`. Overlay gradient `from-black/40`. Badge Martinique en bas à gauche : eyebrow gold `#D4AF37` + trait horizontal or.
- **Droite — panneau formulaire :** `w-[min(100%,26rem)]` shrink-0 (~40%), `bg-white`, `border-l border-black/[0.06]`, padding `px-10 py-14`.

### Mobile (< `lg`)
- Stack vertical. Vidéo en haut : hauteur fixe `h-[200px]`, `object-cover`. Formulaire en dessous, fond blanc, padding `px-6 py-10`.

---

## Panneau formulaire — Étape email (locataires)

### En-tête
```
DIAMANT NOIR               ← text-[8px] tracking-[0.38em] uppercase font-bold text-navy
Votre espace               ← font-display text-[1.9rem] text-navy  (ou "Espace propriétaire")
─────────────              ← h-px w-8 bg-black/12
Réservations, livret…      ← text-sm text-navy/45 (tagline contextuelle)
```

### Champ email
- Label : `text-[9px] tracking-[0.28em] uppercase text-navy/40`
- Input : `border-0 border-b border-black/18 bg-transparent py-3 text-base text-navy focus:border-navy focus:outline-none` — **pas de border box**
- Icône Mail lucide à gauche, `text-navy/25`

### CTA principal
```
bg-navy text-white py-4 text-[10px] tracking-[0.22em] uppercase w-full
"Continuer →" (mode login) / "Continuer →" (mode signup)
Loader2 animate-spin si loading
```

### Liens discrets sous le CTA
```
"Connexion · Inscription"  ← text-[9px] uppercase tracking-[0.18em] text-navy/35
                              Connexion = underline si mode signup
                              Inscription = underline si mode login
                              Séparateur "·" en navy/20
```
Clic "Connexion" ou "Inscription" → bascule le mode (même logique que l'ancien tab)

### Pied de panneau
```
← Retour au site          (lien /)
Accès propriétaire →      (lien /login?redirect=/dashboard/proprio)  ← si isTenant
Espace locataire →        (lien /login?redirect=/espace-client)       ← si !isTenant
© 2026 Diamant Noir
```
Tous en `text-[9px] uppercase tracking-[0.18em] text-navy/30 hover:text-navy`

---

## Panneau formulaire — Étape OTP

### Structure
- Bouton `← Retour` : `text-[9px] uppercase tracking-[0.2em] text-navy/40 hover:text-navy`
- Titre : `font-display text-2xl text-navy` → "Code"
- Sous-titre : email confirmé `text-sm text-navy/50`
- Message d'erreur : `border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700` (inchangé)

### 6 inputs OTP — style underline
```css
/* Chaque input */
border: none;
border-bottom: 2px solid navy/25;          /* vide */
border-bottom: 2px solid navy;             /* actif (focus) */
border-bottom: 2px solid navy;             /* rempli */
background: transparent;
width: 2.75rem; height: 3rem;
text-align: center;
font-family: Playfair Display;
font-size: 1.5rem;
color: navy;
```
- Même logique clavier/paste/auto-verify qu'aujourd'hui
- Auto-validation à 6 chiffres (200ms debounce)

### Bouton valider + renvoi
- Valider : même style CTA navy plein, `opacity-40` si pas 6 chiffres
- Renvoyer : `text-[9px] uppercase tracking-[0.22em] text-navy/40` avec countdown `(Ns)`

---

## Panneau formulaire — Étape Profil (inscription locataire)

Conservé fonctionnellement. Améliorations visuelles :
- Tous les inputs : `border-0 border-b border-black/18 bg-transparent py-3` (style underline, cohérent)
- Labels : même style `text-[9px] tracking-[0.28em] uppercase text-navy/40`
- Radios civilité : inchangés
- Checkboxes CGU/marketing : inchangés
- CTA "Créer le compte →" : style navy plein

---

## PasswordPanel (propriétaires) — Améliorations

Conservé fonctionnellement. Améliorations visuelles :
- Suppression des tabs navy (Connexion/Inscription) → remplacés par les mêmes liens discrets sous CTA
- Inputs : `border-0 border-b border-black/18 bg-transparent` (underline only)
- Password show/hide : icône `Eye`/`EyeOff` lucide à droite, `text-navy/35 hover:text-navy`
- CTA : style identique au flow locataire

---

## Confirmation email (post-inscription propriétaire)

Conservée telle quelle. Seul ajustement : icône `Send` → taille `20px`, `text-navy/30`.

---

## Accessibilité (conservé + renforcé)

- `role="tablist"` → supprimé (plus de tabs) — les liens discrets n'ont pas besoin de rôle ARIA
- Inputs OTP : `aria-label="Chiffre N sur 6"` (inchangé)
- CTA : `aria-busy={loading}` (inchangé)
- Champs : `aria-describedby` sur les hints et erreurs (inchangé)
- Erreurs : `role="alert"` (inchangé)
- Vidéo : `aria-hidden` + `prefers-reduced-motion` → image statique (inchangé)

---

## Fichiers à modifier

| Fichier | Changement |
|---------|-----------|
| `app/login/page.tsx` | Nouveau layout 60/40, suppression tabs, liens discrets Connexion/Inscription, pied de panneau restructuré |
| `components/auth/TenantMagicLinkFlow.tsx` | Suppression tabs → liens discrets. Inputs OTP : underline style. Inputs profil : underline style |
| `app/globals.css` | Aucun ajout nécessaire — classes Tailwind suffisent |

Aucun nouveau composant créé — modifications des deux fichiers existants.

---

## Ce qui NE change PAS

- Toute la logique auth Supabase (signInWithOtp, verifyOtp, signInWithPassword, signUp, updateUser)
- Détection locataire/propriétaire via `?redirect=` URL param
- Auto-validate OTP à 6 chiffres
- Cooldown renvoi 60s
- Gestion erreurs et messages traduits en français
- `Suspense` wrapping pour `useSearchParams`
- Reduced motion (vidéo → image)
- `auth/callback` redirect logic
