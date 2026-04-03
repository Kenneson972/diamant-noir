# Login Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre la page `/login` avec un layout 60/40 split-screen, panneau blanc sans tabs, champs underline-only, identité visuelle cohérente avec le logo Diamant Noir.

**Architecture:** Deux fichiers modifiés uniquement — `app/login/page.tsx` (layout, LoginForm, PasswordPanel) et `components/auth/TenantMagicLinkFlow.tsx` (flow OTP locataire). Toute la logique auth Supabase est conservée à 100%.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS 3.4, Lucide React, Supabase auth

---

## Fichiers modifiés

| Fichier | Sections touchées |
|---------|------------------|
| `app/login/page.tsx` | `LoginSideVideo` (layout), `LoginForm` (panel + header), `PasswordPanel` (tabs → liens, inputs underline) |
| `components/auth/TenantMagicLinkFlow.tsx` | Étape email (tabs → liens, input underline), étape profil (inputs underline) |
| `tests/login/redesign.spec.ts` | Nouveau fichier — tests Playwright smoke |

---

## Task 1 : LoginSideVideo — proportions 60/40 + badge Martinique

**Files:**
- Modify: `app/login/page.tsx:445-485`

- [ ] **Step 1 : Remplacer la fonction `LoginSideVideo`**

Trouver et remplacer le bloc entier (lignes 445–485) :

```tsx
function LoginSideVideo() {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setReduceMotion(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  return (
    <div className="relative z-0 h-[200px] w-full shrink-0 overflow-hidden bg-black lg:h-auto lg:flex-[1.5]">
      {reduceMotion ? (
        <Image
          src="/villa-hero.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="pointer-events-none object-cover"
          priority={false}
        />
      ) : (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/villa-hero.jpg"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        >
          <source src="/login-side.mp4" type="video/mp4" />
        </video>
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 lg:bg-gradient-to-r"
        aria-hidden
      />
      {/* Badge Martinique */}
      <div className="pointer-events-none absolute bottom-5 left-6 z-10" aria-hidden>
        <p className="mb-1 text-[8px] tracking-[0.28em] uppercase text-[#D4AF37]">Martinique</p>
        <div className="h-px w-5 bg-[#D4AF37] opacity-60" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npm run build 2>&1 | tail -20
```
Expected : aucune erreur TypeScript ni Tailwind.

- [ ] **Step 3 : Commit**

```bash
git add app/login/page.tsx
git commit -m "feat(login): 60/40 split layout + Martinique badge on video panel"
```

---

## Task 2 : LoginForm — panel + header DIAMANT NOIR + footer

**Files:**
- Modify: `app/login/page.tsx:487-558`

- [ ] **Step 1 : Remplacer la fonction `LoginForm`**

Trouver et remplacer le bloc entier (lignes 487–558) :

```tsx
function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/dashboard/proprio"
  const isTenant = redirectTo.startsWith("/espace-client")
  const passwordTab = searchParams.get("tab") === "signup" ? "signup" : "login"
  const urlAuthError = loginUrlErrorMessage(searchParams.get("error"))

  const title = isTenant ? "Votre espace" : "Espace propriétaire"
  const tagline = isTenant
    ? "Réservations, livret et conciergerie."
    : "Suivi des biens et des réservations."

  return (
    <main className="flex min-h-[100dvh] flex-col bg-white lg:flex-row">
      <LoginSideVideo />

      <div className="relative z-[1] flex w-full flex-col justify-center border-black/[0.06] bg-white px-6 py-10 lg:w-[min(100%,26rem)] lg:shrink-0 lg:border-l lg:px-10 lg:py-14">
        <div className="mx-auto w-full max-w-xs space-y-8">
          {/* Logo texte */}
          <p className="text-[8px] font-bold uppercase tracking-[0.38em] text-[#0D1B2A]">
            Diamant Noir
          </p>

          {/* Titre + tagline */}
          <div className="space-y-2">
            <h1 className="font-display text-[1.9rem] leading-tight text-[#0D1B2A]">
              {title}
            </h1>
            <span className="block h-px w-8 bg-black/12" />
            <p className="text-sm text-[rgba(13,27,42,0.45)]">{tagline}</p>
          </div>

          {urlAuthError && (
            <p role="alert" className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {urlAuthError}
            </p>
          )}

          {isTenant ? (
            <TenantMagicLinkFlow redirectTo={redirectTo} />
          ) : (
            <PasswordPanel redirectTo={redirectTo} initialMode={passwordTab} />
          )}

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.07] pt-5 text-[9px] uppercase tracking-[0.18em] text-[rgba(13,27,42,0.30)]">
            <Link href="/" className="transition-colors hover:text-[#0D1B2A]">
              ← Retour au site
            </Link>
            {isTenant ? (
              <Link
                href="/login?redirect=/dashboard/proprio"
                className="transition-colors hover:text-[#0D1B2A]"
              >
                Accès propriétaire →
              </Link>
            ) : (
              <Link
                href="/login?redirect=/espace-client"
                className="transition-colors hover:text-[#0D1B2A]"
              >
                Espace locataire →
              </Link>
            )}
          </div>

          <p className="text-[9px] uppercase tracking-[0.25em] text-[rgba(13,27,42,0.20)]">
            © 2026 Diamant Noir
          </p>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2 : Supprimer l'import `BrandLogo` devenu inutilisé**

En haut du fichier, ligne ~20, retirer la ligne :
```tsx
import { BrandLogo } from "@/components/layout/BrandLogo"
```

- [ ] **Step 3 : Vérifier le build**

```bash
npm run build 2>&1 | tail -20
```
Expected : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add app/login/page.tsx
git commit -m "feat(login): DIAMANT NOIR text header, 26rem panel, footer links redesign"
```

---

## Task 3 : PasswordPanel — supprimer tabs, inputs underline, liens discrets

**Files:**
- Modify: `app/login/page.tsx:73-443`

- [ ] **Step 1 : Remplacer la fonction `PasswordPanel` entière**

Trouver et remplacer `function PasswordPanel(` jusqu'au `}` fermant (ligne ~443) :

```tsx
function PasswordPanel({
  redirectTo,
  initialMode = "login",
}: {
  redirectTo: string
  initialMode?: PasswordMode
}) {
  const [mode, setMode] = useState<PasswordMode>(initialMode)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ confirm?: string }>({})
  const [signupSuccess, setSignupSuccess] = useState<"confirm_email" | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowser()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setError("Supabase n'est pas configuré.")
      return
    }
    setLoading(true)
    setError(null)
    const cleanEmail = email.trim().toLowerCase()
    setEmail(cleanEmail)
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })
    if (signError) {
      setError(
        signError.message.toLowerCase().includes("invalid")
          ? "Identifiants incorrects. Vérifiez votre email et votre mot de passe."
          : formatSupabaseAuthMessage(signError.message)
      )
    } else {
      router.push(redirectTo)
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    if (password !== confirmPassword) {
      setFieldErrors({ confirm: "Les mots de passe ne correspondent pas." })
      return
    }
    if (password.length < MIN_PASSWORD_LEN) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`)
      return
    }
    if (!supabase) {
      setError("Supabase n'est pas configuré.")
      return
    }
    setLoading(true)
    setError(null)
    const cleanEmail = email.trim().toLowerCase()
    setEmail(cleanEmail)
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        data: {
          full_name: fullName.trim() || undefined,
        },
      },
    })
    setLoading(false)
    if (signUpError) {
      setError(formatSupabaseAuthMessage(signUpError.message))
      return
    }
    if (data.session) {
      router.push(redirectTo)
      router.refresh()
      return
    }
    if (data.user) {
      setSignupSuccess("confirm_email")
    }
  }

  if (signupSuccess === "confirm_email") {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Send size={20} strokeWidth={1.25} className="text-[rgba(13,27,42,0.30)]" aria-hidden />
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-[#0D1B2A]">Confirmez votre email</h2>
          <span className="block h-px w-10 bg-black/12" />
        </div>
        <p className="text-sm leading-relaxed text-[rgba(13,27,42,0.55)]">
          Nous avons envoyé un lien de confirmation à{" "}
          <span className="font-medium text-[#0D1B2A]">{email}</span>. Cliquez sur le lien pour
          activer votre compte, puis vous pourrez vous connecter.
        </p>
        <p className="text-xs leading-relaxed text-[rgba(13,27,42,0.40)]">
          Pas reçu ? Vérifiez vos spams ou attendez quelques secondes.
        </p>
        <button
          type="button"
          onClick={() => {
            setSignupSuccess(null)
            setEmail("")
            setPassword("")
            setConfirmPassword("")
            setFullName("")
            setMode("login")
          }}
          className="text-[9px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.35)] transition-colors hover:text-[#0D1B2A]"
        >
          ← Retour à la connexion
        </button>
      </div>
    )
  }

  return (
    <div className="relative z-[1] space-y-8">
      <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-7">
        {error && (
          <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="space-y-5">
          {mode === "signup" && (
            <div className="space-y-1">
              <label
                htmlFor="full-name-pass"
                className="block text-[9px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]"
              >
                Nom <span className="font-normal normal-case tracking-normal text-[rgba(13,27,42,0.30)]">(optionnel)</span>
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[rgba(13,27,42,0.25)]"
                  size={15}
                  strokeWidth={1.25}
                  aria-hidden
                />
                <input
                  id="full-name-pass"
                  type="text"
                  autoComplete="name"
                  placeholder="Prénom Nom"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-0 text-base text-[#0D1B2A] placeholder:text-[rgba(13,27,42,0.25)] focus:border-[#0D1B2A] focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label
              htmlFor="email-pass"
              className="block text-[9px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]"
            >
              Adresse email <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[rgba(13,27,42,0.25)]"
                size={15}
                strokeWidth={1.25}
                aria-hidden
              />
              <input
                id="email-pass"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-0 text-base text-[#0D1B2A] placeholder:text-[rgba(13,27,42,0.25)] focus:border-[#0D1B2A] focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="password-pass"
              className="block text-[9px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]"
            >
              Mot de passe <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[rgba(13,27,42,0.25)]"
                size={15}
                strokeWidth={1.25}
                aria-hidden
              />
              <input
                id="password-pass"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "signup" ? MIN_PASSWORD_LEN : undefined}
                aria-describedby={mode === "signup" ? "password-hint" : undefined}
                className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-10 text-base text-[#0D1B2A] placeholder:text-[rgba(13,27,42,0.25)] focus:border-[#0D1B2A] focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="tap-target absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-[rgba(13,27,42,0.35)] hover:text-[#0D1B2A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1B2A]"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff size={16} strokeWidth={1.25} /> : <Eye size={16} strokeWidth={1.25} />}
              </button>
            </div>
            {mode === "signup" && (
              <p id="password-hint" className="text-xs text-[rgba(13,27,42,0.40)]">
                Au moins {MIN_PASSWORD_LEN} caractères.
              </p>
            )}
          </div>
          {mode === "signup" && (
            <div className="space-y-1">
              <label
                htmlFor="password-confirm"
                className="block text-[9px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]"
              >
                Confirmer le mot de passe <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[rgba(13,27,42,0.25)]"
                  size={15}
                  strokeWidth={1.25}
                  aria-hidden
                />
                <input
                  id="password-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (fieldErrors.confirm) setFieldErrors({})
                  }}
                  required
                  aria-invalid={Boolean(fieldErrors.confirm)}
                  aria-describedby={fieldErrors.confirm ? "confirm-error" : undefined}
                  className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-10 text-base text-[#0D1B2A] placeholder:text-[rgba(13,27,42,0.25)] focus:border-[#0D1B2A] focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="tap-target absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-[rgba(13,27,42,0.35)] hover:text-[#0D1B2A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1B2A]"
                  aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
                >
                  {showConfirm ? <EyeOff size={16} strokeWidth={1.25} /> : <Eye size={16} strokeWidth={1.25} />}
                </button>
              </div>
              {fieldErrors.confirm && (
                <p id="confirm-error" role="alert" className="text-sm text-red-700">
                  {fieldErrors.confirm}
                </p>
              )}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="tap-target inline-flex w-full items-center justify-center gap-3 border border-[#0D1B2A] bg-[#0D1B2A] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#0D1B2A]/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1B2A] focus-visible:ring-offset-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} strokeWidth={1.25} aria-hidden />
          ) : mode === "login" ? (
            <>
              Accéder à l&apos;espace
              <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
            </>
          ) : (
            <>
              Créer mon compte
              <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
            </>
          )}
        </button>
      </form>

      {/* Liens discrets Connexion / Inscription */}
      {mode === "login" ? (
        <p className="text-center text-[9px] uppercase tracking-[0.18em] text-[rgba(13,27,42,0.35)]">
          Pas encore de compte ?{" "}
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); setFieldErrors({}) }}
            className="text-[#0D1B2A] underline-offset-4 hover:underline"
          >
            S&apos;inscrire
          </button>
        </p>
      ) : (
        <p className="text-center text-[9px] uppercase tracking-[0.18em] text-[rgba(13,27,42,0.35)]">
          Déjà un compte ?{" "}
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setFieldErrors({}) }}
            className="text-[#0D1B2A] underline-offset-4 hover:underline"
          >
            Se connecter
          </button>
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier le build**

```bash
npm run build 2>&1 | tail -20
```
Expected : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add app/login/page.tsx
git commit -m "feat(login): remove tabs from PasswordPanel, underline inputs, discreet mode links"
```

---

## Task 4 : TenantMagicLinkFlow — étape email : supprimer tabs, input underline

**Files:**
- Modify: `components/auth/TenantMagicLinkFlow.tsx:466-583`

- [ ] **Step 1 : Remplacer la section `/* ─── Étape email ─── */` (return final)**

Trouver le commentaire `/* ─── Étape email (onglets + formulaire) ─── */` (ligne ~466) jusqu'à la fin du composant, et remplacer :

```tsx
  /* ─── Étape email (email → continuer) ─── */
  return (
    <div className="relative z-[1] space-y-8">
      <form onSubmit={handleEmailSubmit} className="space-y-6" aria-label="Email">
        {error && (
          <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label
            htmlFor="email-auth"
            className="block text-[9px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]"
          >
            Adresse email <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[rgba(13,27,42,0.25)]"
              size={15}
              strokeWidth={1.25}
              aria-hidden
            />
            <input
              id="email-auth"
              type="email"
              autoComplete="email"
              placeholder="vous@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-0 text-base text-[#0D1B2A] placeholder:text-[rgba(13,27,42,0.25)] focus:border-[#0D1B2A] focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="tap-target inline-flex w-full items-center justify-center gap-3 border border-[#0D1B2A] bg-[#0D1B2A] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#0D1B2A]/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1B2A] focus-visible:ring-offset-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} strokeWidth={1.25} aria-hidden />
          ) : mode === "login" ? (
            <>
              Recevoir le code
              <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
            </>
          ) : (
            <>
              Continuer
              <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
            </>
          )}
        </button>
      </form>

      {/* Liens discrets Connexion / Inscription */}
      {mode === "login" ? (
        <p className="text-center text-[9px] uppercase tracking-[0.18em] text-[rgba(13,27,42,0.35)]">
          Pas encore de compte ?{" "}
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className="text-[#0D1B2A] underline-offset-4 hover:underline"
          >
            S&apos;inscrire
          </button>
        </p>
      ) : (
        <p className="text-center text-[9px] uppercase tracking-[0.18em] text-[rgba(13,27,42,0.35)]">
          Déjà un compte ?{" "}
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="text-[#0D1B2A] underline-offset-4 hover:underline"
          >
            Se connecter
          </button>
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier le build**

```bash
npm run build 2>&1 | tail -20
```
Expected : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add components/auth/TenantMagicLinkFlow.tsx
git commit -m "feat(login): remove tabs from TenantMagicLinkFlow email step, underline input"
```

---

## Task 5 : TenantMagicLinkFlow — étape profil : inputs underline

**Files:**
- Modify: `components/auth/TenantMagicLinkFlow.tsx:312-463`

- [ ] **Step 1 : Remplacer les 4 inputs dans l'étape profil**

Dans le bloc `/* ─── Étape profil ─── */` (ligne ~312), trouver et remplacer chaque input.

**Input Prénom** (id `tenant-fn`) — remplacer la className :
```tsx
// Avant
className="tap-target w-full rounded-none border border-black/12 bg-white px-4 py-3.5 text-base text-navy focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"

// Après
className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 text-base text-[#0D1B2A] focus:border-[#0D1B2A] focus:outline-none focus:ring-0"
```

**Input Nom** (id `tenant-ln`) — même remplacement className :
```tsx
// Avant
className="tap-target w-full rounded-none border border-black/12 bg-white px-4 py-3.5 text-base text-navy focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"

// Après
className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 text-base text-[#0D1B2A] focus:border-[#0D1B2A] focus:outline-none focus:ring-0"
```

**Input Téléphone** (id `tenant-phone`) — même remplacement + placeholder conservé :
```tsx
// Avant
className="tap-target w-full rounded-none border border-black/12 bg-white px-4 py-3.5 text-base text-navy placeholder:text-navy/25 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"

// Après
className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 text-base text-[#0D1B2A] placeholder:text-[rgba(13,27,42,0.25)] focus:border-[#0D1B2A] focus:outline-none focus:ring-0"
```

**Labels** des 3 champs — changer `text-navy/40` → `text-[rgba(13,27,42,0.40)]` et `tracking-[0.3em]` → `tracking-[0.28em]` :
```tsx
// Avant
className="block text-[10px] font-bold uppercase tracking-[0.3em] text-navy/40"

// Après (appliquer aux 3 labels : tenant-fn, tenant-ln, tenant-phone)
className="block text-[9px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]"
```

**Légende civilité** — même ajustement :
```tsx
// Avant
className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-navy/40"

// Après
className="mb-2 block text-[9px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]"
```

- [ ] **Step 2 : Vérifier le build**

```bash
npm run build 2>&1 | tail -20
```
Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add components/auth/TenantMagicLinkFlow.tsx
git commit -m "feat(login): underline inputs on profile step, label style consistency"
```

---

## Task 6 : Tests Playwright — smoke tests login redesign

**Files:**
- Create: `tests/login/redesign.spec.ts`

- [ ] **Step 1 : Créer le fichier de test**

```typescript
import { test, expect } from "@playwright/test";

// Run: npx playwright test tests/login/redesign.spec.ts --reporter=line
// Requires: npm run dev

test.describe("Login Page — Redesign", () => {
  test("page load sans 5xx (flow locataire)", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/login?redirect=/espace-client");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login/);
  });

  test("page load sans 5xx (flow propriétaire)", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/login?redirect=/dashboard/proprio");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login/);
  });

  test("plus de role=tablist dans la page (tabs supprimés)", async ({ page }) => {
    await page.goto("http://localhost:3000/login?redirect=/espace-client");
    const tablist = page.locator("[role='tablist']");
    await expect(tablist).toHaveCount(0);
  });

  test("input email visible — flow locataire", async ({ page }) => {
    await page.goto("http://localhost:3000/login?redirect=/espace-client");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });

  test("input email et password visibles — flow propriétaire", async ({ page }) => {
    await page.goto("http://localhost:3000/login?redirect=/dashboard/proprio");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("footer 'Accès propriétaire' présent sur flow locataire", async ({ page }) => {
    await page.goto("http://localhost:3000/login?redirect=/espace-client");
    await expect(page.getByText(/accès propriétaire/i)).toBeVisible();
  });

  test("footer 'Espace locataire' présent sur flow propriétaire", async ({ page }) => {
    await page.goto("http://localhost:3000/login?redirect=/dashboard/proprio");
    await expect(page.getByText(/espace locataire/i)).toBeVisible();
  });
});
```

- [ ] **Step 2 : Vérifier le build final**

```bash
npm run build 2>&1 | tail -30
```
Expected : build réussi, 0 erreurs TypeScript.

- [ ] **Step 3 : Commit final**

```bash
git add tests/login/redesign.spec.ts
git commit -m "test(login): add Playwright smoke tests for login redesign"
```

---

## Vérification post-implémentation

```bash
# Build TypeScript
npm run build

# Vérifier visuellement à http://localhost:3000/login?redirect=/espace-client
# Vérifier visuellement à http://localhost:3000/login?redirect=/dashboard/proprio
# Sur les deux :
# ✓ Vidéo/image à gauche, badge "Martinique" visible en bas
# ✓ Panneau blanc à droite, "DIAMANT NOIR" en petites capitales
# ✓ Titre Playfair Display
# ✓ Champs email/password : soulignement uniquement (pas de border box)
# ✓ CTA navy plein
# ✓ Liens "Pas encore de compte ?" ou "Déjà un compte ?" sous le CTA
# ✓ Footer : "← Retour au site" et "Accès propriétaire →" ou "Espace locataire →"
# ✓ Aucun onglet Connexion/Inscription visible

# Tests Playwright (nécessite npm run dev dans un autre terminal)
npx playwright test tests/login/redesign.spec.ts --reporter=line
```
