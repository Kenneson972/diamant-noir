# Login unifié Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supprimer le flux OTP/magic link locataire, unifier sur email + mot de passe pour tous les rôles, et ajouter le flow "mot de passe oublié".

**Architecture:** `PasswordPanel` (déjà dans `login/page.tsx`) devient le seul formulaire pour tous. On lui ajoute un mode `forgot`. Une nouvelle page `/update-password` reçoit l'utilisateur après clic sur le lien de réinitialisation. `TenantMagicLinkFlow.tsx` est supprimé.

**Tech Stack:** Next.js 15 App Router, Supabase Auth (`@supabase/ssr`), TypeScript, Tailwind CSS

---

## Fichiers

| Fichier | Action |
|---|---|
| `app/login/page.tsx` | Modifier — supprimer isTenant, ajouter mode `forgot` dans PasswordPanel |
| `app/update-password/page.tsx` | Créer |
| `middleware.ts` | Modifier — ajouter `/update-password` dans publicPaths |
| `components/auth/TenantMagicLinkFlow.tsx` | Supprimer |

---

### Task 1: Nettoyer `login/page.tsx` — supprimer le split isTenant

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Supprimer l'import TenantMagicLinkFlow et useHomeAudience**

Dans `app/login/page.tsx`, remplacer les lignes 18-19 :
```typescript
// AVANT
import { TenantMagicLinkFlow } from "@/components/auth/TenantMagicLinkFlow"
import { useHomeAudience } from "@/contexts/HomeAudienceContext"

// APRÈS : supprimer ces deux lignes entièrement
```

- [ ] **Step 2: Mettre à jour la fonction `LoginForm`**

Remplacer le corps de `LoginForm` (lignes 478–542) par :

```typescript
function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/dashboard"
  const passwordTab = searchParams.get("tab") === "signup" ? "signup" : "login"
  const urlAuthError = loginUrlErrorMessage(searchParams.get("error"))

  return (
    <main className="flex min-h-[100dvh] flex-col bg-white lg:flex-row">
      <LoginSideVideo />

      <div className="relative z-[1] flex w-full flex-col justify-center border-black/[0.06] bg-white px-6 py-10 lg:w-[min(100%,26rem)] lg:shrink-0 lg:border-l lg:px-10 lg:py-14">
        <div className="mx-auto w-full max-w-xs space-y-8">
          <p className="text-[8px] font-bold uppercase tracking-[0.38em] text-navy">Kayvila</p>

          <div className="space-y-2">
            <h1 className="font-display text-[1.9rem] leading-tight text-navy">Connexion</h1>
            <span className="block h-px w-8 bg-navy/12" />
            <p className="text-sm text-navy/45">Accédez à votre espace Kayvila.</p>
          </div>

          {urlAuthError && (
            <p role="alert" className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {urlAuthError}
            </p>
          )}

          <PasswordPanel redirectTo={redirectTo} initialMode={passwordTab} />

          <div className="flex items-center justify-start border-t border-black/[0.07] pt-5 text-[10px] uppercase tracking-[0.18em] text-navy/30">
            <Link href="/" className="transition-colors hover:text-navy">
              ← Retour au site
            </Link>
          </div>

          <p className="text-[10px] uppercase tracking-[0.25em] text-navy/20">© 2026 Kayvila</p>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Vérifier les imports restants**

S'assurer que tous les imports encore présents sont utilisés. Les imports qui restent valides :
```typescript
"use client"

import { Suspense, useEffect, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase"
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Send,
  User,
} from "lucide-react"
import Link from "next/link"
import { postLoginDestination } from "@/lib/auth/admin-access"
```

`Send` reste utilisé dans l'état `signupSuccess` de `PasswordPanel` (ligne ~189). `User`, `Mail`, `Lock`, `Eye`, `EyeOff`, `ArrowRight`, `Loader2` restent utilisés.

- [ ] **Step 4: Vérifier que la page compile**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : 0 erreurs sur `app/login/page.tsx`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
git add app/login/page.tsx
git commit -m "refactor: supprimer le split isTenant — PasswordPanel pour tous"
```

---

### Task 2: Ajouter le mode `forgot` dans `PasswordPanel`

**Files:**
- Modify: `app/login/page.tsx` (dans la fonction `PasswordPanel`, lignes 59–425)

- [ ] **Step 1: Étendre le type `PasswordMode`**

Ligne 57, remplacer :
```typescript
type PasswordMode = "login" | "signup"
```
par :
```typescript
type PasswordMode = "login" | "signup" | "forgot"
```

- [ ] **Step 2: Ajouter l'état `forgotSuccess` dans `PasswordPanel`**

Dans `PasswordPanel`, après la ligne `const [signupSuccess, setSignupSuccess] = useState<"confirm_email" | null>(null)` (actuellement ligne ~76), ajouter :
```typescript
const [forgotSuccess, setForgotSuccess] = useState(false)
```

- [ ] **Step 3: Ajouter le handler `handleForgot`**

Après `handleSignup` (avant le premier `if (signupSuccess...)` return), ajouter :
```typescript
const handleForgot = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!supabase) { setError("Supabase n'est pas configuré."); return }
  setLoading(true)
  setError(null)
  const cleanEmail = email.trim().toLowerCase()
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })
  setLoading(false)
  if (resetError) {
    setError(formatSupabaseAuthMessage(resetError.message))
  } else {
    setForgotSuccess(true)
  }
}
```

- [ ] **Step 4: Ajouter l'état de succès `forgotSuccess`**

Juste avant le `if (signupSuccess === "confirm_email")` block existant, ajouter :
```typescript
if (forgotSuccess) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Send size={20} strokeWidth={1.25} className="text-navy/30" aria-hidden />
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-navy">Vérifiez vos emails</h2>
        <span className="block h-px w-10 bg-navy/12" />
      </div>
      <p className="text-sm leading-relaxed text-navy/55">
        Un lien de réinitialisation a été envoyé à{" "}
        <span className="font-medium text-navy">{email}</span>.
      </p>
      <p className="text-xs leading-relaxed text-navy/40">
        Pas reçu ? Vérifiez vos spams ou attendez quelques secondes.
      </p>
      <button
        type="button"
        onClick={() => {
          setForgotSuccess(false)
          setMode("login")
          setError(null)
        }}
        className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/35 transition-colors hover:text-navy"
      >
        ← Retour à la connexion
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Mettre à jour le `onSubmit` du formulaire**

Ligne ~222, remplacer :
```typescript
<form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-7">
```
par :
```typescript
<form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot} className="space-y-7">
```

- [ ] **Step 6: En mode `forgot`, n'afficher que le champ email**

Dans le bloc `<div className="space-y-5">`, les champs password et confirmPassword sont déjà conditionnels sur `mode === "signup"`. Il faut aussi cacher le champ password en mode `forgot`. Remplacer la condition du champ password :

```typescript
// AVANT — le champ password est toujours visible (login + signup)
<div className="space-y-1">
  <label htmlFor="password-pass" ...>

// APRÈS — cacher en mode forgot
{mode !== "forgot" && (
  <div className="space-y-1">
    <label htmlFor="password-pass" ...>
    ...
  </div>
)}
```

Le champ `fullName` (signup only) et `confirmPassword` (signup only) n'ont pas besoin de changement — ils sont déjà conditionnels sur `mode === "signup"`.

- [ ] **Step 7: Ajouter le lien "Mot de passe oublié ?" en mode `login`**

Juste avant le bouton `<button type="submit" ...>`, ajouter :
```typescript
{mode === "login" && (
  <div className="flex justify-end">
    <button
      type="button"
      onClick={() => { setMode("forgot"); setError(null) }}
      className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/35 transition-colors hover:text-navy"
    >
      Mot de passe oublié ?
    </button>
  </div>
)}
```

- [ ] **Step 8: En mode `forgot`, mettre à jour le texte du bouton submit**

Dans le bouton submit, le contenu actuel gère `login` vs `signup`. Ajouter le cas `forgot` :
```typescript
{loading ? (
  <Loader2 className="animate-spin" size={16} strokeWidth={1.25} aria-hidden />
) : mode === "login" ? (
  <>
    Accéder à l&apos;espace
    <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
  </>
) : mode === "forgot" ? (
  <>
    Envoyer le lien
    <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
  </>
) : (
  <>
    Créer mon compte
    <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
  </>
)}
```

- [ ] **Step 9: Mettre à jour le lien bas du formulaire**

Le bloc après le formulaire affiche "Pas encore de compte ?" / "Déjà un compte ?". En mode `forgot`, afficher uniquement le retour connexion :

```typescript
{mode === "login" ? (
  <p className="text-center text-[10px] uppercase tracking-[0.18em] text-navy/35">
    Pas encore de compte ?{" "}
    <button
      type="button"
      onClick={() => { setMode("signup"); setError(null); setFieldErrors({}) }}
      className="text-navy underline-offset-4 hover:underline"
    >
      S&apos;inscrire
    </button>
  </p>
) : mode === "signup" ? (
  <p className="text-center text-[10px] uppercase tracking-[0.18em] text-navy/35">
    Déjà un compte ?{" "}
    <button
      type="button"
      onClick={() => { setMode("login"); setError(null); setFieldErrors({}) }}
      className="text-navy underline-offset-4 hover:underline"
    >
      Se connecter
    </button>
  </p>
) : (
  <p className="text-center text-[10px] uppercase tracking-[0.18em] text-navy/35">
    <button
      type="button"
      onClick={() => { setMode("login"); setError(null) }}
      className="text-navy underline-offset-4 hover:underline"
    >
      ← Retour à la connexion
    </button>
  </p>
)}
```

- [ ] **Step 10: Vérifier la compilation**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : 0 erreurs.

- [ ] **Step 11: Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
git add app/login/page.tsx
git commit -m "feat: ajouter mode forgot (réinitialisation mot de passe) dans PasswordPanel"
```

---

### Task 3: Créer la page `/update-password`

**Files:**
- Create: `app/update-password/page.tsx`

- [ ] **Step 1: Créer le fichier**

Créer `app/update-password/page.tsx` avec le contenu suivant :

```typescript
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase"
import { isStaffAdmin, isOwnerRole } from "@/lib/auth/admin-access"
import { Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"

const MIN_PASSWORD_LEN = 8

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowser()

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/login")
    })
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError(null)
    setError(null)
    if (password !== confirm) {
      setFieldError("Les mots de passe ne correspondent pas.")
      return
    }
    if (password.length < MIN_PASSWORD_LEN) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`)
      return
    }
    if (!supabase) { setError("Supabase n'est pas configuré."); return }
    setLoading(true)
    const { data, error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    const u = data.user
    let profileRole: string | null = null
    if (u) {
      const { data: p } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", u.id)
        .maybeSingle()
      profileRole = p?.role ?? null
    }
    const meta = (u?.user_metadata?.role as string | undefined) ?? "client"
    const dest = isStaffAdmin(profileRole, meta, u?.email)
      ? "/admin"
      : isOwnerRole(profileRole, meta)
      ? "/dashboard"
      : "/espace-client"
    window.location.href = dest
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-white px-6">
      <div className="w-full max-w-xs space-y-8">
        <div className="space-y-2">
          <p className="text-[8px] font-bold uppercase tracking-[0.38em] text-navy">Kayvila</p>
          <h1 className="font-display text-[1.9rem] leading-tight text-navy">Nouveau mot de passe</h1>
          <span className="block h-px w-8 bg-navy/12" />
          <p className="text-sm text-navy/45">Choisissez un mot de passe sécurisé pour votre compte.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {error && (
            <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="space-y-5">
            <div className="space-y-1">
              <label
                htmlFor="new-password"
                className="block text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40"
              >
                Nouveau mot de passe <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-navy/25"
                  size={15}
                  strokeWidth={1.25}
                  aria-hidden
                />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LEN}
                  aria-describedby="pw-hint"
                  className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-10 text-base text-navy placeholder:text-navy/25 focus:border-navy focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="tap-target absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-navy/35 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.25} /> : <Eye size={16} strokeWidth={1.25} />}
                </button>
              </div>
              <p id="pw-hint" className="text-xs text-navy/40">
                Au moins {MIN_PASSWORD_LEN} caractères.
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirm-password"
                className="block text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40"
              >
                Confirmer <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-navy/25"
                  size={15}
                  strokeWidth={1.25}
                  aria-hidden
                />
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value)
                    if (fieldError) setFieldError(null)
                  }}
                  required
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? "confirm-err" : undefined}
                  className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-10 text-base text-navy placeholder:text-navy/25 focus:border-navy focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="tap-target absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-navy/35 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                  aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
                >
                  {showConfirm ? <EyeOff size={16} strokeWidth={1.25} /> : <Eye size={16} strokeWidth={1.25} />}
                </button>
              </div>
              {fieldError && (
                <p id="confirm-err" role="alert" className="text-sm text-red-700">
                  {fieldError}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="tap-target inline-flex w-full items-center justify-center gap-3 border border-navy bg-navy px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} strokeWidth={1.25} aria-hidden />
            ) : (
              <>
                Enregistrer le mot de passe
                <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : 0 erreurs.

- [ ] **Step 3: Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
git add app/update-password/page.tsx
git commit -m "feat: page /update-password pour réinitialisation de mot de passe"
```

---

### Task 4: Mettre à jour le middleware + supprimer TenantMagicLinkFlow

**Files:**
- Modify: `middleware.ts`
- Delete: `components/auth/TenantMagicLinkFlow.tsx`

- [ ] **Step 1: Ajouter `/update-password` dans `publicPaths`**

Dans `middleware.ts`, dans le tableau `publicPaths`, ajouter après `"/success"` :
```typescript
"/update-password",
```

- [ ] **Step 2: Vérifier qu'aucun autre fichier n'importe TenantMagicLinkFlow**

```bash
grep -r "TenantMagicLinkFlow" "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" --include="*.tsx" --include="*.ts"
```

Résultat attendu : aucun fichier ne l'importe (le seul import dans `login/page.tsx` a été retiré en Task 1).

- [ ] **Step 3: Supprimer le fichier**

```bash
rm "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir/components/auth/TenantMagicLinkFlow.tsx"
```

- [ ] **Step 4: Vérifier la compilation finale**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npx tsc --noEmit 2>&1 | head -50
```

Résultat attendu : 0 erreurs.

- [ ] **Step 5: Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
git add middleware.ts
git rm components/auth/TenantMagicLinkFlow.tsx
git commit -m "feat: supprimer TenantMagicLinkFlow + ajouter /update-password en publicPaths"
```

---

### Task 5: Vérification manuelle

- [ ] **Step 1: Démarrer le serveur de dev**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npm run dev
```

- [ ] **Step 2: Tester le flow login normal**

1. Aller sur `http://localhost:3000/login`
2. Vérifier : titre "Connexion", tagline "Accédez à votre espace Kayvila."
3. Se connecter avec un compte locataire (email + mot de passe) → doit rediriger vers `/espace-client`
4. Se connecter avec un compte proprio → doit rediriger vers `/dashboard`
5. Se connecter avec un compte admin → doit rediriger vers `/admin`

- [ ] **Step 3: Tester le flow "mot de passe oublié"**

1. Sur `/login`, cliquer "Mot de passe oublié ?"
2. Vérifier : formulaire passe en mode forgot (seul champ email visible, bouton "Envoyer le lien")
3. Entrer un email → vérifier que l'email de réinitialisation est reçu
4. Cliquer le lien dans l'email → doit arriver sur `/update-password`
5. Entrer un nouveau mot de passe → vérifier la redirection vers le bon espace

- [ ] **Step 4: Tester les cas limites**

1. Aller directement sur `/update-password` sans session → doit rediriger vers `/login`
2. Mots de passe qui ne correspondent pas → message d'erreur "Les mots de passe ne correspondent pas."
3. Mot de passe trop court → message d'erreur "au moins 8 caractères"
4. Cliquer "← Retour à la connexion" depuis le mode forgot → retour au formulaire login

- [ ] **Step 5: Tester l'inscription**

1. Sur `/login`, cliquer "S'inscrire"
2. Créer un compte → email de confirmation envoyé
3. Confirmer l'email → redirection vers `/espace-client`

- [ ] **Step 6: Mettre à jour la mémoire du projet**

```bash
# Marquer le projet login unifié comme terminé dans la mémoire
```

Mettre à jour `memory/project_login_unifie.md` : changer le statut en "TERMINÉ ✅".
