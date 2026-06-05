/**
 * Verrou de scroll document.body par compteur de références.
 * Évite les courses Navbar (menu mobile) + overlays plein écran qui écrasent
 * mutuellement `style.overflow` (scroll figé ou inverse).
 */

let lockCount = 0;
let savedOverflow = "";

export function acquireBodyScrollLock(): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount -= 1;
    if (lockCount <= 0) {
      lockCount = 0;
      document.body.style.overflow = savedOverflow;
    }
  };
}

/**
 * Réinitialise tout (navigation client, BFCache, cleanup manquant).
 * À appeler en `useLayoutEffect` **parent** avant les enfants : ordre React parent → enfant.
 */
export function resetBodyScrollLock(): void {
  if (typeof document === "undefined") return;
  lockCount = 0;
  savedOverflow = "";
  document.body.style.overflow = "";
}
