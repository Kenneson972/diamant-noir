/**
 * Retour accueil + réouverture du gate d’audience (un seul endroit pour la séquence).
 *
 * `requestGateReopen()` incrémente `gateReopenSignal` → **HomeAudienceGateLoader** remonte
 * le gate avec une **nouvelle clé** (comportement fiable vs `replace` no-op sur `/`).
 *
 * Déjà sur `/` sans query : `router.replace` serait inutile → **`router.refresh()`** en filet
 * pour resynchroniser le segment serveur si besoin.
 */
export function replaceHomeAndRequestGateReopen(
  router: { replace: (href: string) => void; refresh?: () => void },
  requestGateReopen: () => void
): void {
  requestGateReopen();

  if (typeof window === "undefined") {
    router.replace("/");
    return;
  }

  const isHome = window.location.pathname === "/";
  const hasParams = !!window.location.search;

  if (isHome && !hasParams) {
    queueMicrotask(() => {
      router.refresh?.();
    });
    return;
  }

  router.replace("/");
}
