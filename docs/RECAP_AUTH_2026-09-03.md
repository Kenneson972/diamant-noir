# Récap — Correctifs auth du 03/09/2026

> Session de debug sur le blocage « impossible de se connecter » signalé par Kenneson.
> Tout est **livré en production** sur `main`. Ce document remplace le §4 de
> `RECAP_OAUTH_GOOGLE.md`, dont les trois causes présumées se sont révélées fausses.

---

## 1. Le problème réel

**Symptôme :** login impossible, console en boucle infinie, rafale de `429` sur
`POST /auth/v1/token?grant_type=refresh_token`.

**Ce n'était PAS un problème de domaine ni de configuration.** `admin.kayvila.com`
était simplement l'endroit où l'on arrivait avec une session périmée.

**Cause racine :** un refresh token périmé fait échouer `getUser()`/`getSession()`
pour **chaque** consommateur monté (AuthContext, Navbar, pages). Chacun relance un
refresh, gotrue vole le verrou des autres → ~110 requêtes en 10 s → Supabase
rate-limite l'IP → **le login légitime échoue en 429**. `_removeSession` notifie
alors le client PostgREST, qui redemande un token, et la boucle repart :

```
_useSession → __loadSession → _callRefreshToken → POST /token → 429
  → _removeSession → _notifyAllSubscribers → _handleTokenChanged
  → setAuth → _getAccessToken → getSession → _acquireLock → _useSession → …
```

Le `429` est la **conséquence**, pas la cause.

**Déclencheurs :** mot de passe changé, token expiré, ou **utilisateur supprimé de
Supabase alors que le navigateur conserve son cookie**. Ne se produit jamais en
navigation privée — d'où l'impression trompeuse que « ça marche en privé mais pas
normalement ».

---

## 2. Correctifs livrés

| Commit | Objet |
|---|---|
| `841cf2e` | merge de la livraison |
| `6bd826c` | **Boucle 429.** Cherry-pick de `1495350` (écrit le 29/08, resté non mergé sur `fix/audit-preprod-2026-08-29`). `isStaleRefreshTokenError` + `purgeStaleSession` : purge unique mémoïsée au premier échec, ce qui coupe la boucle et laisse un état déconnecté propre. |
| `935b2e8` | **Page admin blanche.** `admin.kayvila.com/admin` sans session renvoyait `200` + un squelette vide au lieu d'un `307 → /login`. |
| `50e2bf6` | **Régression introduite par `935b2e8`** (voir §4). |
| `693aafd` | **Cul-de-sac 404** pour un compte non-staff + tests. |

### Détail — page admin blanche (`935b2e8`)

`middleware.ts` faisait `return NextResponse.next()` pour toute route admin sur le
host admin, court-circuitant le bloc auth/RBAC. Next rendait donc la page, et le
`redirect()` de `app/(admin)/admin/layout.tsx` ne pouvait plus partir : `loading.tsx`
avait déjà flushé le shell, la réponse était committée en `200`.

Conséquence : toute anomalie de session sur le sous-domaine admin se manifestait par
un **écran blanc muet** au lieu d'un message — ce qui rendait le bug indébogable.

Correctif : seuls les assets et `/api` court-circuitent ; les pages admin traversent
l'auth et émettent un vrai `307`. Redirection login directe vers le domaine public,
plus un garde anti-boucle `?sso=retry` (si le domaine public a une session admin
valide alors que le sous-domaine l'a rejetée, on affiche le login au lieu d'un
ping-pong `307` infini).

### Détail — cul-de-sac 404 (`693aafd`)

Depuis `935b2e8`, le middleware produit `/login?redirect=/admin`. Or
`postLoginDestination()` renvoyait `requestedRedirect` **tel quel** pour un compte
non-staff : `/admin` en relatif, résolu sur le domaine public, où la route est un
`404` volontaire (isolation). Un compte Google fraîchement créé
(`profiles.role = tenant`) atterrissait donc sur `kayvila.com/admin` → 404.

Un non-staff demandant `/admin` ou `/admin/*` est désormais renvoyé vers son espace
(`/dashboard` pour un propriétaire, `/espace-client` sinon).

---

## 3. Comptes Google — piège à connaître

Un compte créé via OAuth Google **n'a pas de `user_metadata.role`**. L'accès admin
dépend alors entièrement de `profiles.role` (ou de `STAFF_ADMIN_EMAILS`).

`contact@kayvila.com` porte `user_metadata.role = "admin"`, ce qui **masque toute une
classe de bugs sur ce compte** mais pas sur les autres. Tester uniquement avec lui
donne un faux sentiment de sécurité.

Supprimer un utilisateur dans Supabase et se reconnecter via Google **recrée un compte
neuf avec le rôle par défaut** (`tenant`) — il faut repasser `profiles.role = 'admin'`.

---

## 4. ⚠️ Régression causée pendant la livraison

`935b2e8` supprimait le `return NextResponse.next()` du bloc host admin. Résultat :
les pages admin traversaient le bloc et atteignaient la ligne suivante,
`if (isAdminRoute) return 404`, jusque-là inatteignable depuis `admin.kayvila.com`
→ **tout l'admin en 404 en production**. Corrigé par `50e2bf6` (ajout de `!isAdminHost`).

**Leçon :** `middleware.ts` a une structure à fall-through où **l'ordre des `return`
porte la logique de sécurité et d'isolation**. Les tests unitaires passaient
identiquement avant et après la régression — ils ne couvrent pas ce routage.

**Matrice de vérification obligatoire avant tout merge touchant `middleware.ts` :**

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://admin.kayvila.com/admin
# attendu : 307 https://kayvila.com/login?redirect=%2Fadmin&sso=retry
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://admin.kayvila.com/
# attendu : 307 https://admin.kayvila.com/admin
curl -s -o /dev/null -w "%{http_code}\n" https://kayvila.com/admin
# attendu : 404  (isolation du domaine public)
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://kayvila.com/espace-client
# attendu : 307 https://kayvila.com/login?redirect=%2Fespace-client
```

---

## 5. Pistes écartées — ne pas les refaire

Le §4 de `RECAP_OAUTH_GOOGLE.md` désigne trois causes environnementales. **Les trois
sont fausses**, vérifiées une par une :

| Piste | Verdict |
|---|---|
| `NEXT_PUBLIC_ADMIN_URL` mauvaise | **Absente** des 33 variables de prod → le code utilise son fallback `https://admin.kayvila.com`, correct |
| `SUPABASE_COOKIE_DOMAIN` mal scopé | Cookie `sb-*-auth-token` observé avec `Domain = .kayvila.com` — correct |
| `NEXT_PUBLIC_SITE_URL` avec `www` | `https://kayvila.com` — confirmé par le `<link rel=canonical>` et le sitemap |
| `profiles.role` non admin | `admin` en base |
| RLS bloquant la lecture du rôle | `getSupabaseServer()` fait déjà un `getSession()` de warm-up (`lib/supabase-server.ts`) |

### Piège : les variables d'env Vercel sont de type *Sensitive*

Elles sont **illisibles** — ni `vercel env ls`, ni `vercel env pull`, ni le dashboard.
`vercel env pull` écrit la chaîne littérale **`[SENSITIVE]`**, qui fait exactement
**11 caractères**, soit la longueur de `kayvila.com`. Un script qui mesure `${#v}` ou
compare la valeur produit des conclusions entièrement fausses.

**À faire à la place — valider par preuve d'exécution en production :**

- `NEXT_PUBLIC_SITE_URL` → `curl -s https://kayvila.com/sitemap.xml | head`
- `SUPABASE_COOKIE_DOMAIN` → attribut `Domain` du cookie `sb-*-auth-token` en DevTools
- `NEXT_PUBLIC_ADMIN_URL` → absente en prod, fallback dans le code

---

## 6. Reste ouvert

- **`fix/audit-preprod-2026-08-29` toujours hors production** : fix villa 500,
  escalade admin, suppression de villa, templates emails. Seul `1495350` en a été
  extrait. À traiter à froid.
- Le login Google reste à retester de bout en bout sur un compte non-admin, pour
  valider le parcours locataire.
