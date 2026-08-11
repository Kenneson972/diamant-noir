# Kayvila — Migration admin sur admin.kayvila.com : PROBLÈME RÉSIDUEL (chargement infini)

**Date** : 11/08/2026 — **Auteur** : Élise (assistante Karibloom)
**Statut** : ⚠️ À debugger — tout marche côté serveur, le rendu client reste vide après login.

## Contexte (ce qui est FAIT et DÉPLOYÉ)

Migration de l'admin staff sur le sous-domaine `admin.kayvila.com` (méthode éprouvée Shiine → Dalcielo).

**Commits poussés sur main :**
- `b9d0555` — migration : middleware hostname (admin/public), cookies Supabase cross-domain, post-login admin, conversion HeroUI Pro beta.5→beta.8 (barrel→subpaths, 27 fichiers), audit
- `094caef` — fix RSC : les fetch RSC (Accept: text/x-component) vers les routes publiques sur admin host sont servis localement (next()) au lieu d'être redirigés (les RSC ne suivent pas les redirects → "Failed to fetch")
- `f20a1ac` — fix login : le middleware consulte `profiles.role` en base pour le user connecté sur /login (le role JWT `user_metadata.role` est ABSENT pour les comptes créés via Supabase Admin API → le login envoyait les admins vers /espace-client au lieu de /admin)

**Env vars Vercel (Production) :**
- `SUPABASE_COOKIE_DOMAIN=kayvila.com` ✅ (vérifié : Set-Cookie = `Domain=.kayvila.com`)

**DNS (OVH, enregistré en mode texte) :**
- `admin CNAME 6c35502ceee2e470.vercel-dns-017.com.` ✅
- `www CNAME 6c35502ceee2e470.vercel-dns-017.com.` ✅ (supprimé un TXT "3|welcome" qui bloquait)
- Certs Vercel générés ✅

## État vérifié côté serveur (fonctionne)

- `admin.kayvila.com/` → 307 → `/admin` ✅
- `admin.kayvila.com/admin` → 200 (HTML SSR 32 Ko avec contenu, "Dashboard" x6) ✅
- `kayvila.com/admin` → 404 ✅ ; `kayvila.com/api/admin/*` → 404 ✅
- `kayvila.com/` (public) → 200 ✅ ; `www.kayvila.com` → 200 ✅
- Login avec compte admin (`karibloom972@gmail.com`, role=admin en base) → **307 vers `https://admin.kayvila.com/admin`** ✅
- Session : cookie `sb-wsdawdxucyuyopkpgjij-auth-token` avec `Domain=.kayvila.com` → envoyé sur les deux domaines ✅
- `curl admin.kayvila.com/admin` AVEC le cookie → 200 (le layout rend le dashboard avec session) ✅

## ⚠️ LE PROBLÈME

**Symptôme** : après login, le navigateur arrive sur `admin.kayvila.com/admin` mais la page reste vide ("chargement infini"). Reproduit par Ken en navigation privée (donc pas un cache navigateur).

**Erreurs console observées (AVANT les fixes RSC + login) :**
1. `Failed to fetch RSC payload for https://admin.kayvila.com/cookies` (répété) — probablement le prefetch du lien Cookies (dialog/global) vers /cookies sur admin host ; le middleware REDIRIGEAIT (307) → les fetch RSC ne suivent pas les redirects cross-origin → TypeError. **Fix 094caef déployé : RSC /cookies → 200 maintenant.** (À confirmer si l'erreur disparaît côté navigateur.)
2. `Refused to execute script from .../webpack-d088a6b6a7443937.js because its MIME type ('text/plain')` — pendant la transition de déploiement (le chunk était en 404 temporaire). Le chunk est maintenant 200 + `application/javascript`. Probablement un cache transitoire.

**Comportements bizarres à investiguer :**
- `curl admin.kayvila.com/admin` **SANS cookie** → 200 (au lieu de 307 vers /login). Soupçon : **cache CDN Vercel** sur /admin (pas de `Vary: Cookie`) ? Le HTML 32 Ko pourrait être le même pour tout le monde. Vérifier les headers de cache (`x-vercel-cache`, `CDN-Cache-Control`, `Vary`).
- Dans un navigateur headless (Browserbase), après login, `document.body` reste `null`, `document.readyState='loading'`, `title=''` — le document n'a JAMAIS fini de se parser. Impossible de savoir si c'est un artefact headless ou le vrai symptôme.

## Pistes de debug (par ordre)

1. **Headers de cache Vercel sur /admin** : `curl -sI https://admin.kayvila.com/admin` → regarder `x-vercel-cache`, `Vary`, `CDN-Cache-Control`. Si la page dynamique (avec cookie) est mise en cache → ajouter `Vary: Cookie` ou `Cache-Control: private, no-store` (Next.js : `export const dynamic = 'force-dynamic'` ou headers dans next.config).
2. **Console navigateur APRÈS les fixes** : demander à Ken (ou tester via Playwright/Browserbase avec un cookie de session injecté) les erreurs JS/réseau ACTUELLES en nav privée.
3. **Hydratation** : le HTML 32 Ko est-il complet (fermé `</html>`) ? Un streaming interrompu → parseur bloqué → body null. Tester `curl -s .../admin | tail -c 200` pour voir la fin du document.
4. **Le prefetch /cookies** : vérifier s'il reste des erreurs RSC. Si oui, chercher le composant qui fait le lien /cookies (cookie banner global ?) et soit `prefetch={false}`, soit lien absolu `https://kayvila.com/cookies`.
5. **Le layout (admin) redirection** : `app/(admin)/admin/layout.tsx` → `redirect("/login?redirect=/admin")` — en cas de session absente, ce redirect RELATIF atterrit sur admin.kayvila.com/login → le middleware le renvoie vers kayvila.com/login. Vérifier qu'il n'y a pas de boucle visible.

---

## Investigation Claude — 11/08/2026

### ✅ Piste 1 (cache CDN) — écartée
`cache-control: private, no-cache, no-store` + `x-vercel-cache: MISS`. Le HTML change entre
deux requêtes → rendu dynamique, aucun cache. Pas de `Vary: Cookie` à ajouter.

### ✅ Piste 3 (streaming interrompu) — écartée
HTML complet, `</html>` présent, 32 169 octets. Les 20 chunks `/_next/static/*.js` répondent
tous en 200 `application/javascript` sur le host admin. L'erreur MIME `text/plain` était bien
transitoire (déploiement en cours).

### ✅ « /admin en 200 sans cookie » — NON, ce n'est pas une faille
Le layout redirige correctement. Le HTML contient `NEXT_REDIRECT ... /login?redirect=/admin;307`.
Comme le rendu est **streamé**, les headers sont déjà partis quand `redirect()` se déclenche :
Next ne peut plus émettre un vrai 307 et renvoie un **200 dont le payload porte l'ordre de
redirection**, exécuté côté client. Vérifié en vrai navigateur (Playwright) : sans session,
`admin.kayvila.com/admin` atterrit bien sur `kayvila.com/login?redirect=%2Fadmin`.
Le « dashboard » visible dans le HTML est le shell rendu avant résolution du redirect, avec
des données **vides** (`items:[]`, `alerts:[]`) — aucune donnée réelle exposée.

### 🔴 CAUSE RACINE TROUVÉE ET CORRIGÉE — le fix RSC `094caef` ne marchait pas

Erreurs console reproduites en vrai navigateur :
```
Connecting to 'https://kayvila.com/cookies' violates the CSP directive
  "connect-src 'self' https://*.supabase.co ..." — The action has been blocked.
Failed to fetch RSC payload for https://admin.kayvila.com/cookies. TypeError: Failed to fetch
  ... at IntersectionObserver.rootMargin   ← prefetch d'un <Link> entrant dans le viewport
```

Le middleware détectait les requêtes RSC via `Accept: text/x-component` uniquement. Or le
**prefetch** d'un `<Link>` Next envoie `RSC: 1` + `Next-Router-Prefetch: 1` avec `Accept: */*`
(et `?_rsc=`). Preuve :

| Requête vers `admin.kayvila.com/cookies` | Résultat |
|---|---|
| `Accept: text/x-component` (ce que le code testait) | **200** ✅ |
| `RSC: 1` + `Next-Router-Prefetch: 1` + `Accept: */*` (prefetch réel) | **307 → kayvila.com** ❌ |

Le 307 cross-origin est alors bloqué par la CSP `connect-src` → `TypeError: Failed to fetch`
dans le routeur Next à chaque `<Link>` prefetché.

**Fix appliqué** (`middleware.ts`) : détecter toutes les variantes RSC — `Accept`,
header `RSC: 1`, header `Next-Router-Prefetch`, param `?_rsc`. `npx tsc --noEmit` OK.

### ✅ SYMPTÔME REPRODUIT — c'est bien une boucle de navigation

Login réel effectué en prod (compte admin) sur la version actuellement déployée :

- `document.title` = **`Loading https://admin.kayvila.com/admin`** — le document ne finit
  jamais de charger (exactement le « chargement infini » de Ken, et le `readyState='loading'`
  qu'Élise voyait en headless : ce n'était PAS un artefact).
- **1428 entrées console**, dont **75 × le même couple d'erreurs** :
  `Failed to fetch RSC payload for .../cookies` + `violates CSP connect-src`.
- Toute évaluation JS renvoie `Execution context was destroyed, because of a navigation`,
  en boucle.

**Mécanisme complet :** le bandeau cookies (présent sur toutes les pages, y compris l'admin)
contient un `<Link href="/cookies">`. Son prefetch part en `RSC: 1` → non détecté par le
middleware → 307 vers `kayvila.com` → bloqué par la CSP → `TypeError` → Next applique son
fallback **« Falling back to browser navigation »** → la page renavigue → le bandeau
re-prefetch → échec → renavigation… **boucle infinie**. Le document ne finit jamais de se
parser, donc écran vide.

Le fix middleware ci-dessus vise à casser la boucle à la racine (prefetch servi en 200 localement).

### ⏳ Vérification post-déploiement — NON CONCLUANTE à ce stade

Commit `c4e5f97` poussé et déployé (`dpl_3NTzhnDkKZT5cU3sWmLoWeYZ74qA`, READY,
alias `admin.kayvila.com` confirmé, `aliasError: null`).

En curl, le comportement **semble** inchangé :

| Requête vers `admin.kayvila.com/cookies` | Avant | Après |
|---|---|---|
| `Accept: text/x-component` | 200 | 200 |
| `RSC: 1` / `Next-Router-Prefetch: 1` / `?_rsc=` | 307 | **307** |

⚠️ **Mais ce test curl n'est probablement pas représentatif** : Next/Vercel neutralise les
en-têtes RSC lorsqu'ils proviennent d'un client externe (protection anti-spoofing), alors
qu'ils sont conservés pour un vrai prefetch navigateur. Le `?_rsc=` seul aurait dû suffire à
déclencher `next()` — s'il ne le fait pas, c'est que `nextUrl.searchParams` ne voit pas ce
param (Next le consomme en amont).

**Deux issues possibles, à trancher par un test navigateur réel** (session Playwright à
redémarrer — la précédente est restée bloquée dans la boucle, 15 436 lignes de console) :
1. le fix marche pour les vrais prefetch → l'admin se charge, dossier clos ;
2. le fix ne marche pas → il faut cesser de détecter le RSC par en-têtes et **traiter le
   problème à la source** : le `<Link href="/cookies">` du bandeau cookies ne devrait pas
   pointer en relatif depuis le host admin. Solutions : `prefetch={false}`, ou URL absolue
   `https://kayvila.com/cookies`, ou ne pas monter le bandeau cookies sur le host admin
   (il n'a pas lieu d'être sur un back-office interne). **C'est l'option la plus robuste** :
   elle supprime la requête cross-domaine au lieu de la rattraper dans le middleware.

---

## RÉSOLUTION — 11/08/2026 (Claude)

Il y avait **deux bugs empilés**, le premier masquant le second.

### Bug 1 — boucle de navigation infinie (l'écran vide) → `c945eb1`
`CookieConsent` est monté par le **root layout**, donc présent aussi sur le host admin.
Son `<Link href="/cookies">` déclenchait un prefetch vers une route publique depuis
`admin.kayvila.com` → 307 cross-domaine → bloqué par la CSP `connect-src 'self'` →
`TypeError` → fallback Next « browser navigation » → renavigation → re-prefetch → **boucle**.

Le correctif middleware `c4e5f97` (détection RSC élargie) **n'a pas suffi** : les en-têtes RSC
ne permettent pas de rattraper ce cas de façon fiable. La bonne approche était de **supprimer
la requête cross-domaine à la source** : le bandeau cookies ne se monte plus sur le host admin
(un back-office interne n'a aucun visiteur à informer). Inchangé sur le public — RGPD préservé.

→ Vérifié après déploiement : **0 erreur console**, la boucle a disparu.

### Bug 2 — boucle de redirection `/admin` ↔ `/login` → `c45cf30`
Une fois la boucle 1 levée, un second symptôme est apparu : la session n'était pas reconnue
sur le sous-domaine.

Cause : le login se fait **côté client** (`signInWithPassword`, `app/login/page.tsx:104`), donc
c'est `createBrowserClient` qui écrit le cookie `sb-*` — et il était créé **sans domaine**
(`lib/supabase.ts`) → cookie **host-only sur kayvila.com**, invisible sur admin.kayvila.com.
`SUPABASE_COOKIE_DOMAIN` était bien appliqué côté serveur et middleware, mais **pas côté
navigateur** (variable non `NEXT_PUBLIC`). Le domaine est désormais dérivé du host courant via
`NEXT_PUBLIC_SITE_URL`. Local et previews `*.vercel.app` : comportement host-only inchangé.

### Reste : vider le cache navigateur (pas un bug)
Pendant la fenêtre de déploiement, le navigateur a mis en cache une réponse **404 / text/plain**
pour `_next/static/chunks/app/layout-*.js` → `ChunkLoadError` → « Une erreur est survenue ».
Le serveur est sain : le même chunk répond **200 `application/javascript`** en curl et depuis le
navigateur avec `cache: 'no-store'` (avec comme sans cookies).
→ **Test final à faire en navigation privée** (cache vierge).

## Fichiers modifiés (à ne pas écraser)

- `middleware.ts` (routage hostname + RSC + login profile + cookies domain)
- `lib/supabase-server.ts` (cookie domain)
- `lib/auth/admin-access.ts` (postLoginDestination → admin absolu en prod)
- `components/dashboard/shared/DashboardShell.tsx` (signOut → site public)
- `components/BookingForm.tsx` + 27 composants (HeroUI barrel → subpaths, beta.8)
- `docs/AUDIT-ADMIN-SUBDOMAIN.md`

## Contraintes Karibloom

- Toujours `git pull` avant de travailler (Claude pousse, Élise exécute les migrations DB via VPS)
- Build complet avant push : `npm run build`
- Ne pas toucher au dashboard propriétaire `app/(proprio)/dashboard` (reste sur kayvila.com)
- Ne pas casser le site public (booking, marketing, auth)
- Test manuel final : login admin → dashboard → session cross-domain → 404 public → booking OK
