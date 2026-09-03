# Recap — Google OAuth login sur Kayvila

> Fichier écrit le 03/09/2026 pour transmettre le contexte à un autre outil (Claude Code).
> Projet : **Kayvila** (repo `diamant-noir`). 3e client Karibloom à recevoir le login Google,
> après Dal Cielo (Next.js implicite) et Pessóra (Vite SPA). Kayvila = **Next.js 15 App Router
> + `@supabase/ssr` PKCE**.

---

## 1. Objectif

Bouton « Se connecter avec Google » sur `/login` + « Lier mon compte Google » dans
`espace-client/profil`, branchés sur Supabase Auth (projet Kayvila), sans casser l'auth
email/mot de passe existante.

## 2. Ce qui est DÉJÀ fait (mergé sur `main`)

- **Google Cloud Console** : projet « kayvila », client OAuth Application Web :
  `1034971051747-8offkanbldoff9isnpff5n87vqa5ifd1.apps.googleusercontent.com`.
  Secret stocké dans `ENVKAR.md` (`KAYVILA_GOOGLE=...`, fichier chmod 600 — jamais en clair ici).
- **Supabase** (ref `wsdawdxucyuyopkpgjij`) : provider Google activé, client ID + secret posés,
  allowlist `https://kayvila.com/**` + `www.` + `admin.` + `http://localhost:3000/**`,
  `security_manual_linking_enabled: true` (pour « Lier mon compte Google »).
- **Code** :
  - `app/login/page.tsx` → `signInWithOAuth({ provider: 'google', redirectTo: '<origin>/auth/callback?next=...' })`.
  - `app/espace-client/profil/page.tsx` → `linkIdentity({ provider: 'google' })` + état « Compte Google lié ».
  - `components/icons/GoogleIcon.tsx` + 6 clés i18n (FR/EN/ES).
- **Commits mergés** : `7fbd69d` (feat OAuth) → `2c490a9` (fix redirect `/espace-client` pas `/dashboard`) → `c2e26b1` (fix verifier, voir §3).

## 3. Le bug racine (RÉSOLU)

**Symptôme** : login Google → retour sur `/login?error=Impossible%20de%20finaliser%20l%27authentification`.

**Cause** : le middleware (`middleware.ts`) tournait sur `/auth/callback`. Son test
`hasSupabaseAuthCookie` (cookie `sb-*` contenant "auth") était déclenché par le cookie
**`sb-*-auth-token-code-verifier`** lui-même (son nom contient "auth" !). Donc le middleware
lançait `getUser()` sur la requête callback. Avec une session périmée, le refresh échoue
(400/429) et `supabase-js` purge la clé `...-code-verifier` AVANT que la route fasse
`exchangeCodeForSession` → échec silencieux → message générique.

**Fix (2 volets, commit `c2e26b1`)** :
1. `middleware.ts` : **retour anticipé sur `/auth/callback`** (la route gère son échange elle-même).
2. `app/auth/callback/route.ts` : ré-application de `SUPABASE_COOKIE_DOMAIN` dans `setAll`
   (sinon la session post-login était host-only, invisible sur `admin.kayvila.com`).

**Résultat** : en navigation privée (cookies vierges), le login Google fonctionne et crée la session.

## 4. ~~Ce qui RESTE à régler (problème actuel)~~ — RÉSOLU le 03/09/2026

> ⚠️ **SECTION PÉRIMÉE — NE PAS L'UTILISER COMME PISTE DE DEBUG.**
> Le problème est résolu et livré en production. La cause réelle était une **boucle
> de refresh token côté navigateur** aboutissant à un `429` Supabase, **pas** un
> problème de domaine ni d'environnement. **Les trois causes env listées ci-dessous
> ont été vérifiées une par une et sont toutes fausses.**
> 👉 Voir **`docs/RECAP_AUTH_2026-09-03.md`** pour le diagnostic complet, les
> correctifs (`841cf2e`, `50e2bf6`, `693aafd`) et la matrice de vérification.
>
> À noter aussi : les variables d'env Vercel sont de type *Sensitive*, donc
> **illisibles** — `vercel env pull` écrit littéralement `[SENSITIVE]` (11 caractères,
> soit la longueur de `kayvila.com`), ce qui induit des diagnostics erronés.
> Valider par preuve d'exécution en prod, jamais par lecture d'env.

En nav privée, un login Google avec un compte **admin** redirige vers `admin.kayvila.com`
mais **« c'est pas le bon domaine »** — la session n'est pas reconnue côté admin.

**Deux causes d'env DISTINCTES à trancher par le symptôme** (toutes deux dans Vercel,
projet `kayvila`, id `prj_L76eVSBn16PR978h3zo5uqS0f5Yz`) :

1. **Cible du redirect admin** = `NEXT_PUBLIC_ADMIN_URL` (middleware ligne 83 →
   `${ADMIN_URL}/admin`). Si elle vaut `https://www.kayvila.com` au lieu de
   `https://admin.kayvila.com`, le redirect part sur `www.kayvila.com/admin` → **404**
   (l'admin est migré sur le sous-domaine ; `/admin` renvoie 404 sur le domaine public,
   middleware lignes 122-124).
2. **Scope du cookie session** = `SUPABASE_COOKIE_DOMAIN`. Elle **doit valoir
   `kayvila.com`** (SANS `www.`). Le code fait `.${SUPABASE_COOKIE_DOMAIN}` →
   `.kayvila.com`, ce qui couvre `kayvila.com` + tous les sous-domaines
   (`admin.kayvila.com`). Si elle vaut `www.kayvila.com` → le cookie devient
   `.www.kayvila.com`, scopé sur le mauvais domaine → `admin.kayvila.com` ne le voit pas.

**Disambiguateur (le symptôme tranche)** :
- Après login, si l'URL affiche **`www.kayvila.com/admin`** → cause (1) `NEXT_PUBLIC_ADMIN_URL`.
- Si l'URL affiche **`admin.kayvila.com/admin` mais re-boucle vers le login** → cause (2) `SUPABASE_COOKIE_DOMAIN`.

**Vérif rapide en DevTools** : Application → Cookies → attribut **Domain** du cookie
`sb-*-auth-token` → il doit être **`.kayvila.com`** (avec le point). S'il est host-only
(`kayvila.com` sans point) ou `www.kayvila.com`, le scope est cassé → cause (2).

**Points de contexte utiles pour le debug** :
- Le site sert **`kayvila.com` ET `www.kayvila.com` sans redirect canonique** (les deux
  répondent 200 indépendamment). Un login démarré sur l'un et terminé sur l'autre peut
  casser le cookie `code_verifier` (scopé par domaine).
- Le cookie de session doit être posé sur `.kayvila.com` pour être visible sur
  `admin.kayvila.com` (leçon « cookie host-only » déjà rencontrée et documentée dans le repo).
- Trois endroits gèrent le domaine des cookies, ils doivent être cohérents :
  - `lib/supabase.ts` (client navigateur) → dérive de `NEXT_PUBLIC_SITE_URL`.
  - `middleware.ts` → `SUPABASE_COOKIE_DOMAIN`.
  - `app/auth/callback/route.ts` → `SUPABASE_COOKIE_DOMAIN` (ajouté au fix `c2e26b1`).

## 5. Cartographie technique (pour s'orienter vite)

- **Repo** : `diamant-noir` (Next.js 15, App Router, `@supabase/ssr@0.10.2`, `supabase-js@2.45.5`).
- **Supabase** : ref `wsdawdxucyuyopkpgjij`, redirect URI OAuth =
  `https://wsdawdxucyuyopkpgjij.supabase.co/auth/v1/callback`.
- **Domaines prod** : `kayvila.com`, `www.kayvila.com`, `admin.kayvila.com` (admin isolé du public).
- **Rôles** (3 types de membres) : `admin` (staff, isolé sur admin.kayvila.com),
  `proprio` (owner, dashboard `/dashboard`), `tenant` (client, `/espace-client`).
  Le routing post-login est **role-aware** dans `middleware.ts`.
- **Fichiers clés** :
  - `middleware.ts` — routage admin/public, RBAC, refresh session.
  - `app/auth/callback/route.ts` — échange PKCE (`exchangeCodeForSession`) + `verifyOtp`.
  - `app/login/page.tsx` — bouton Google + mapping des erreurs (`loginUrlErrorMessage`).
  - `app/espace-client/profil/page.tsx` — liaison Google (`linkIdentity`).
  - `lib/supabase.ts` / `lib/supabase-server.ts` — clients + domaine cookie.

## 6. Non bloquant / à faire plus tard

- **Branding Google** (cosmétique) : publier l'appli en Production + « Verify Branding » +
  TXT Search Console pour `kayvila.com`. En attendant, l'appli est en **Testing** (seuls les
  « Test users » peuvent se connecter).
- **Onboarding proprio** : chantier séparé (aujourd'hui il n'y a qu'un formulaire de dépôt
  de villa, pas de parcours proprio). Le rôle `proprio` se met à la main en DB.
