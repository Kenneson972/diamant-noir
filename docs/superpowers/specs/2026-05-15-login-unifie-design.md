# Login unifié — Email + Mot de passe pour tous

Date : 2026-05-15

## Contexte

La page `/login` avait deux flux séparés :
- Locataires (`/espace-client`) → `TenantMagicLinkFlow` (OTP 6 chiffres par email, 560 lignes)
- Propriétaires / admins → `PasswordPanel` (email + mot de passe)

Décision : unifier sur email + mot de passe pour tous. Supprimer le flux OTP.

## Fichiers impactés

| Fichier | Action |
|---|---|
| `app/login/page.tsx` | Modifier (supprimer split isTenant, unifier titre, ajouter mode forgot) |
| `app/update-password/page.tsx` | Créer (nouvelle page post-reset) |
| `middleware.ts` | Modifier (ajouter `/update-password` dans publicPaths) |
| `components/auth/TenantMagicLinkFlow.tsx` | Supprimer |

## 1. `app/login/page.tsx`

### Suppressions
- `import { TenantMagicLinkFlow }` (ligne 18)
- Variable `isTenant` et toute logique conditionnelle basée dessus
- Import `Send` de lucide-react si plus utilisé après refactor (vérifier)
- Liens "Espace locataire →" / "Accès propriétaire →" en bas de page

### Modifications
- Titre : `"Connexion"` (fixe, plus de conditionnel)
- Tagline : `"Accédez à votre espace Kayvila."`
- Rendu du formulaire : toujours `<PasswordPanel redirectTo={redirectTo} initialMode={passwordTab} />`
- Liens bas de page : uniquement `← Retour au site`

### Ce qui ne change pas
- `redirectTo` = `searchParams.get("redirect") || "/dashboard"` — inchangé
- `passwordTab` = `searchParams.get("tab") === "signup" ? "signup" : "login"` — inchangé
- `urlAuthError` et son affichage — inchangé
- Layout 60/40 vidéo/panneau — inchangé

## 2. `PasswordPanel` — ajout mode `"forgot"`

### Nouveau type de mode
```typescript
type PasswordMode = "login" | "signup" | "forgot"
```

### Flow mode `forgot`
1. Affiche : label "Adresse email" + input email + bouton "Envoyer le lien de réinitialisation"
2. Appel : `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${origin}/auth/callback?next=/update-password\` })`
3. Succès : état `forgotSuccess = true` → message "Vérifiez vos emails — un lien vous a été envoyé à {email}."
4. Erreur : affichée via le bloc `error` existant

### Déclenchement
- En mode `login` : lien texte `Mot de passe oublié ?` positionné sous le champ mot de passe (ou juste avant le bouton submit), qui passe en mode `forgot`
- En mode `forgot` : lien `← Retour à la connexion` qui repasse en mode `login`

### État `forgotSuccess`
Même pattern que `signupSuccess` : rendu alternatif avec message de confirmation + bouton retour.

## 3. Nouvelle page `app/update-password/page.tsx`

### Rôle
Destination après que l'utilisateur a cliqué le lien de réinitialisation dans son email. Le lien passe par `/auth/callback?next=/update-password` qui échange le code et pose la session, puis redirige ici.

### Contenu
- Composant client (`"use client"`)
- 2 champs : "Nouveau mot de passe" (min 8 car.) + "Confirmer"
- Validation côté client : longueur + correspondance
- Appel : `supabase.auth.updateUser({ password })`
- Succès : `window.location.href = dest` via `postLoginDestination()` (même logique que `PasswordPanel`)
- Erreur : message affiché

### Sécurité
- La session est posée par `/auth/callback` avant d'arriver ici
- Si pas de session (accès direct sans lien email) → redirect vers `/login`
- Page ajoutée dans `publicPaths` du middleware (la session est gérée par le callback)

## 4. `middleware.ts`

Ajouter `/update-password` dans `publicPaths` :
```typescript
"/update-password",
```

## 5. Suppression

`components/auth/TenantMagicLinkFlow.tsx` — supprimé entièrement.

Vérifier avant suppression qu'aucun autre fichier n'importe ce composant :
```bash
grep -r "TenantMagicLinkFlow" --include="*.tsx" --include="*.ts" .
```

## Cas limites

- **Locataires sans mot de passe** (créés via OTP) : ils utilisent le lien "Mot de passe oublié" pour en créer un. Le lien est visible dès la page login.
- **Accès direct à `/update-password` sans session** : rediriger vers `/login` (géré par le check `getUser()` au début de la page).
- **Email non confirmé** : Supabase bloque `signInWithPassword` — le message d'erreur existant dans `PasswordPanel` couvre ce cas.

## Ce qui ne change pas

- `/auth/callback/route.ts` — inchangé
- `lib/auth/admin-access.ts` et `postLoginDestination()` — inchangés
- RBAC middleware — inchangé
- Tous les dashboards (admin, proprio, espace-client) — inchangés
