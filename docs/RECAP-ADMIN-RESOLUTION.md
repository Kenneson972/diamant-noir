# Récap pour Élise — admin.kayvila.com : chargement infini RÉSOLU

**Date** : 11/08/2026 — **Auteur** : Claude — **Statut** : ✅ résolu, validé par Ken en nav privée
**Détail complet** : `DEBUG-ADMIN-CHARGEMENT-INFINI.md` (section « RÉSOLUTION » en bas)

---

## TL;DR

C'étaient **deux bugs empilés**, le premier masquant le second. Ta migration était bonne :
DNS, cookies serveur, routage hostname, 404 public, post-login — tout ça marchait déjà.

| # | Symptôme | Cause racine | Commit |
|---|---|---|---|
| 1 | Écran vide / « chargement infini » | Bandeau cookies monté sur le host admin → prefetch `/cookies` cross-domaine → CSP → **boucle de navigation Next** | `c945eb1` |
| 2 | Boucle `/admin` ↔ `/login` (apparue après le fix 1) | Cookie de session écrit par le **navigateur** sans domaine → host-only, invisible sur le sous-domaine | `c45cf30` |

---

## Tes 3 pistes : 2 écartées, 1 fausse alerte

- ❌ **Cache CDN** : `cache-control: private, no-store` + `x-vercel-cache: MISS`, et le HTML change
  entre deux requêtes. Rien à faire.
- ❌ **Streaming interrompu** : HTML complet et fermé (32 169 o), les 20 chunks JS en 200. L'erreur
  MIME `text/plain` que tu avais vue était bien transitoire (fenêtre de déploiement).
- ⚠️ **« /admin en 200 sans cookie »** : ce n'est **pas** une faille. Le HTML contient
  `NEXT_REDIRECT … /login?redirect=/admin;307`. Comme le rendu est **streamé**, les en-têtes sont
  déjà partis quand `redirect()` se déclenche : Next renvoie un 200 dont le payload porte l'ordre
  de redirection, exécuté côté client. Vérifié en vrai navigateur → on atterrit bien sur `/login`.
  Le « dashboard » visible dans le HTML est le shell rendu avant résolution, données **vides**
  (`items:[]`, `alerts:[]`). Rien n'est exposé.

Ton intuition sur le prefetch `/cookies` (piste 4 de ta liste) était **la bonne**.

---

## Bug 1 — la boucle de navigation

`CookieConsent` est monté par le **root layout** (`app/layout.tsx:170`), donc présent aussi sur
le host admin. Son `<Link href="/cookies">` déclenche un prefetch au moment où il entre dans le
viewport :

```
prefetch RSC vers admin.kayvila.com/cookies
  → middleware : 307 vers kayvila.com/cookies
  → bloqué par la CSP connect-src 'self'
  → TypeError: Failed to fetch
  → fallback Next « Falling back to browser navigation »
  → la page renavigue → le bandeau re-prefetch → ∞
```

Le document ne finissait jamais de se parser → `document.title` restait
`Loading https://admin.kayvila.com/admin`, `readyState='loading'`, `body` null.
**Ton observation en headless n'était donc pas un artefact — c'était le vrai symptôme.**
Mesuré en prod avant fix : **15 436 lignes de console**, le même couple d'erreurs en boucle.

### Ce qui n'a pas marché (à savoir pour la prochaine fois)

J'ai d'abord élargi la détection RSC du middleware (`c4e5f97`) : en plus de
`Accept: text/x-component`, tester `RSC: 1`, `Next-Router-Prefetch` et `?_rsc=`.
**Ça n'a pas suffi** — les prefetch continuaient de partir en 307.

⚠️ Piège de méthode : **tester ça en curl n'est pas fiable**, Next/Vercel neutralise les en-têtes
RSC venant d'un client externe. Il faut un vrai test navigateur pour conclure.

### Ce qui a marché

Supprimer la requête cross-domaine **à la source** plutôt que la rattraper : le bandeau cookies
ne se monte plus sur le host admin (`components/ui/CookieConsent.tsx`).

Un back-office interne n'a aucun visiteur à informer — pas d'enjeu RGPD. Le bandeau est
**inchangé sur le site public**. Vérifié : `ChatbotDynamic` et `CompareBar` (les 2 autres
composants globaux) n'ont aucun `<Link>`, donc pas le même piège. `Navbar`/`Footer` ne sont pas
montés globalement.

---

## Bug 2 — la session non partagée

Une fois la boucle levée, le vrai second bug est apparu : `/admin` renvoyait vers `/login`, qui
re-redirigeait vers `/admin`.

Le login se fait **côté client** (`signInWithPassword`, `app/login/page.tsx:104`), donc c'est
`createBrowserClient` qui écrit le cookie `sb-*` — et il était créé **sans domaine**
(`lib/supabase.ts`) → **host-only sur kayvila.com**, invisible sur `admin.kayvila.com`.

Tu avais bien mis `cookieOptions.domain` dans `lib/supabase-server.ts` **et** dans le middleware —
mais ces deux-là *lisent* le cookie, ils ne le *créent* pas au moment du login.
`SUPABASE_COOKIE_DOMAIN` n'étant pas `NEXT_PUBLIC`, il n'est pas lisible côté navigateur : le
domaine est maintenant dérivé du host courant via `NEXT_PUBLIC_SITE_URL`, et posé uniquement si
le host correspond (local et previews `*.vercel.app` gardent le comportement host-only, un
cookie `.vercel.app` serait de toute façon rejeté).

---

## Faux positif à connaître après un déploiement

Le navigateur peut mettre en cache une réponse **404 / `text/plain`** sur un chunk
`_next/static/chunks/app/layout-*.js` captée pendant la fenêtre de build → `ChunkLoadError` →
écran « Une erreur est survenue ». **Ce n'est pas une régression** : vérifier avec
`fetch(url, { cache: 'no-store' })` ou en navigation privée avant de conclure.
C'est exactement ce qui m'a fait douter à la fin.

---

## Fichiers modifiés (en plus des tiens)

- `components/ui/CookieConsent.tsx` — garde sur le host admin
- `lib/supabase.ts` — domaine de cookie côté navigateur
- `middleware.ts` — détection RSC élargie (`c4e5f97`) : **conservée mais elle ne résout rien**,
  inoffensive. À supprimer si tu préfères ne pas garder de code sans effet démontré.

---

## Reste à tester (je ne l'ai pas fait)

1. **Login propriétaire et locataire** — ils passent par le même `createBrowserClient`, donc la
   portée de leur cookie change aussi. Ça devrait être transparent (`kayvila.com` →
   `.kayvila.com` couvre le domaine et ses sous-domaines), mais ce n'est pas vérifié.
2. **Comptes déjà connectés avant le déploiement** — ils peuvent se retrouver avec deux cookies
   de même nom (ancien host-only + nouveau `.kayvila.com`). En cas de comportement bizarre :
   vider les cookies. À surveiller si Richard ou l'équipe remontent quelque chose.
3. **Le dashboard proprio** sur `kayvila.com/dashboard` — non retesté depuis ces changements.
