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
