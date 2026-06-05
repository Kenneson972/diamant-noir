# FIX_RESPONSIVE_MOBILE — Audit Kayvila

**Pour** : Cursor  
**De** : Élise  
**Date** : 5 juin 2026  
**Projet** : `diamant-noir`  
**Branche** : `main`

---

## Résumé

4 bugs détectés en responsive mobile 390px.

---

## Fix 1 — Chatbot : header non-sticky (impossible de fermer)

**Fichier** : `components/chatbot/Chatbot.tsx`  
**Ligne** : 291

**Problème** : Le header du chatbot (titre "Conciergerie IA" + boutons Réinitialiser/Fermer) défile avec le contenu des messages. Sur mobile, le chatbot passe en plein écran (`inset-0`), et dès que les messages chargent, le header disparaît vers le haut. L'utilisateur ne peut plus fermer le chatbot.

**Fix** : Ajouter `shrink-0` au header pour qu'il reste toujours visible dans le conteneur flex.

```diff
- <div className="flex items-center justify-between border-b border-white/10 bg-navy p-5 text-white">
+ <div className="shrink-0 flex items-center justify-between border-b border-white/10 bg-navy p-5 text-white">
```

**Explication** : Le conteneur parent est `flex flex-col`. Le header est le premier enfant, puis `flex-1 overflow-y-auto` pour les messages. Sans `shrink-0`, le header peut être poussé hors de l'écran par le contenu scrollable.

---

## Fix 2 — Chatbot : z-index trop bas (navbar bloque le clic sur Fermer)

**Fichier** : `components/chatbot/Chatbot.tsx`  
**Lignes** : 271 (FAB) et 284 (fenêtre chat)

**Problème** : La navbar a `z-[1020]` et intercepte les événements de clic destinés au chatbot qui n'a que `z-50`.

**Fix** : Passer les z-index du chatbot au-dessus de la navbar.

```diff
// Ligne 271 - FAB button
- <button onClick={() => setIsOpen(true)} className="group fixed z-50 flex h-16 w-16...
+ <button onClick={() => setIsOpen(true)} className="group fixed z-[1060] flex h-16 w-16...

// Ligne 284 - Chat window
- <div className={`fixed z-50 flex flex-col bg-white shadow-2xl transition-all ${
+ <div className={`fixed z-[1050] flex flex-col bg-white shadow-2xl transition-all ${
```

---

## Fix 3 — Vidéo hero : fallback si autoplay bloqué

**Fichier** : `components/home/HeroBackgroundMedia.tsx`

**Problème** : iOS Safari et certains navigateurs mobiles bloquent `autoplay` même avec `muted` + `playsInline`. La vidéo `hero.webm` reste figée.

**Fix** : Ajouter une référence au `<video>` et un `.play().catch()` pour basculer sur le poster si l'autoplay échoue.

Remplacer tout le fichier :

```tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function HeroBackgroundMedia() {
  const [allowVideo, setAllowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAllowVideo(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Fallback si l'autoplay est bloqué par le navigateur
  useEffect(() => {
    if (allowVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        setAllowVideo(false);
      });
    }
  }, [allowVideo]);

  if (!allowVideo) {
    return (
      <div className="absolute inset-0 h-full w-full" aria-hidden>
        <Image
          src="/villa-hero.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-70"
          sizes="100vw"
        />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      poster="/villa-hero.jpg"
      className="absolute inset-0 h-full w-full object-cover opacity-70"
      aria-hidden
    >
      <source src="/hero.webm" type="video/webm" />
    </video>
  );
}
```

---

## Fix 4 — Dashboard proprio/admin : sidebar mobile sans overlay ni bouton fermer

**Statut** : ✅ **Déjà corrigé** dans `components/dashboard/shared/DashboardSidebar.tsx` (overlay `bg-black/60` + bouton X mobile, lignes 144–164).

Amélioration perf mobile (juin 2026) : `backdrop-blur-none` sur l'overlay mobile, blur conservé en `md:`.

---

## Checklist post-fix

- [x] Chatbot : header `shrink-0`, z-index 1050/1060, touch targets 44px
- [x] Vidéo hero : fallback `.play().catch()` → poster
- [x] Sidebar dashboard : overlay + bouton X (déjà en place)
- [x] Audit complémentaire : CompareBar z-index, admin touch targets, prestations mobile léger, messagerie flex
- [ ] Vérification manuelle iOS Safari recommandée
- [ ] `npm run build` passe sans erreur

---

*Document généré par Élise — audit responsive Kayvila 5 juin 2026*
