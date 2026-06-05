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

**Fichier** : Composant sidebar dashboard (probablement `components/dashboard/Sidebar.tsx` ou `app/dashboard/layout.tsx`)

**Problème** : Sur mobile 390px, la sidebar fait `w-64` (256px) — plus de la moitié de l'écran. Une fois ouverte, aucun overlay ni bouton X pour la refermer.

**Fix** :
- Ajouter un `<div>` overlay semi-transparent (`bg-black/50`) qui ferme la sidebar au clic
- Ajouter un bouton X dans le header de la sidebar mobile
- La sidebar desktop (`lg:` breakpoint) ne change pas

```tsx
// Pseudo-code — adapter au composant existant
{sidebarOpen && (
  <>
    <div 
      className="fixed inset-0 z-30 bg-black/50 lg:hidden" 
      onClick={() => setSidebarOpen(false)} 
    />
    <aside className="fixed left-0 top-0 z-40 flex h-dvh w-64 flex-col ...">
      <div className="flex items-center justify-between p-4 lg:hidden">
        <span>Kayvila</span>
        <button onClick={() => setSidebarOpen(false)} aria-label="Fermer le menu">
          <X size={20} />
        </button>
      </div>
      {/* ... contenu existant de la sidebar ... */}
    </aside>
  </>
)}
```

---

## Checklist post-fix

- [ ] Chatbot : ouvrir sur mobile, vérifier que le header reste visible et que le bouton X fonctionne
- [ ] Chatbot : vérifier que le bouton 💎 (FAB) reste cliquable et au-dessus de tout
- [ ] Vidéo : tester sur iOS Safari et/ou avec "prefers-reduced-motion: reduce" activé
- [ ] Vidéo : vérifier que le poster s'affiche bien si la vidéo ne joue pas
- [ ] Sidebar dashboard : overlay + bouton X fonctionnels en mobile
- [ ] `npm run build` passe sans erreur

---

*Document généré par Élise — audit responsive Kayvila 5 juin 2026*
