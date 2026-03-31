"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase"
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Send,
  User,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { BrandLogo } from "@/components/layout/BrandLogo"
import { TenantMagicLinkFlow } from "@/components/auth/TenantMagicLinkFlow"

/**
 * Vidéo panneau gauche (desktop), formulaire à droite : /public/login-side.mp4
 * Ratio recommandé : 9:16 (portrait) — adapté à une colonne ~50% × 100vh + object-cover.
 */

const MIN_PASSWORD_LEN = 8

function formatSupabaseAuthMessage(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("already registered") || m.includes("user already")) {
    return "Un compte existe déjà avec cet email. Passez à l’onglet Connexion."
  }
  if (m.includes("password") && (m.includes("least") || m.includes("short"))) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "Adresse email invalide."
  }
  if (m.includes("signup") && m.includes("disabled")) {
    return "Les inscriptions sont temporairement désactivées. Contactez le support."
  }
  return message || "Une erreur est survenue. Réessayez."
}

type PasswordMode = "login" | "signup"

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
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password })
    if (signError) {
      setError(
        signError.message.toLowerCase().includes("invalid")
          ? "Identifiants incorrects. Vérifiez votre email et votre mot de passe."
          : formatSupabaseAuthMessage(signError.message)
      )
      setLoading(false)
    } else {
      router.push(redirectTo)
      router.refresh()
    }
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
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
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
        <Send size={22} strokeWidth={1.25} className="text-navy/35" aria-hidden />
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-navy">Confirmez votre email</h2>
          <span className="block h-px w-10 bg-black/12" />
        </div>
        <p className="text-sm leading-relaxed text-navy/55">
          Nous avons envoyé un lien de confirmation à{" "}
          <span className="font-medium text-navy">{email}</span>. Cliquez sur le lien pour activer votre compte, puis
          vous pourrez vous connecter.
        </p>
        <p className="text-xs leading-relaxed text-navy/40">
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
          className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/35 transition-colors hover:text-navy"
        >
          ← Retour à la connexion
        </button>
      </div>
    )
  }

  return (
    <div className="relative z-[1] space-y-8">
      <div
        className="isolate grid grid-cols-2 gap-px border border-black/12 bg-black/12"
        role="tablist"
        aria-label="Connexion ou inscription"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => {
            setMode("login")
            setError(null)
            setFieldErrors({})
          }}
          className={`flex min-h-[48px] cursor-pointer touch-manipulation items-center justify-center gap-2 px-2 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 sm:tracking-[0.22em] ${
            mode === "login"
              ? "bg-navy text-white"
              : "bg-white text-navy/60 hover:bg-navy/[0.04] hover:text-navy active:bg-navy/[0.06]"
          }`}
        >
          <LogIn size={14} strokeWidth={1.25} aria-hidden />
          Connexion
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => {
            setMode("signup")
            setError(null)
            setFieldErrors({})
          }}
          className={`flex min-h-[48px] cursor-pointer touch-manipulation items-center justify-center gap-2 px-2 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 sm:tracking-[0.22em] ${
            mode === "signup"
              ? "bg-navy text-white"
              : "bg-white text-navy/60 hover:bg-navy/[0.04] hover:text-navy active:bg-navy/[0.06]"
          }`}
        >
          <UserPlus size={14} strokeWidth={1.25} aria-hidden />
          Inscription
        </button>
      </div>

      <p className="text-sm leading-relaxed text-navy/50">
        {mode === "login"
          ? "Connectez-vous avec l’email et le mot de passe de votre compte propriétaire."
          : "Créez un compte pour accéder au tableau de bord des biens et des réservations."}
      </p>

      <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-8">
        {error && (
          <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="space-y-6">
          {mode === "signup" && (
            <div className="space-y-2">
              <label
                htmlFor="full-name-pass"
                className="block text-[10px] font-bold uppercase tracking-[0.3em] text-navy/40"
              >
                Nom <span className="font-normal normal-case tracking-normal text-navy/30">(optionnel)</span>
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/25"
                  size={16}
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
                  className="tap-target w-full rounded-none border border-black/12 bg-white py-3.5 pl-11 pr-4 text-navy placeholder:text-navy/25 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label
              htmlFor="email-pass"
              className="block text-[10px] font-bold uppercase tracking-[0.3em] text-navy/40"
            >
              Adresse email <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/25"
                size={16}
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
                className="tap-target w-full rounded-none border border-black/12 bg-white py-3.5 pl-11 pr-4 text-navy placeholder:text-navy/25 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password-pass"
              className="block text-[10px] font-bold uppercase tracking-[0.3em] text-navy/40"
            >
              Mot de passe <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/25"
                size={16}
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
                className="tap-target w-full rounded-none border border-black/12 bg-white py-3.5 pl-11 pr-14 text-navy placeholder:text-navy/25 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((s) => !s)}
                className="tap-target absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-navy/40 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.25} /> : <Eye size={18} strokeWidth={1.25} />}
              </button>
            </div>
            {mode === "signup" && (
              <p id="password-hint" className="text-xs text-navy/40">
                Au moins {MIN_PASSWORD_LEN} caractères.
              </p>
            )}
          </div>
          {mode === "signup" && (
            <div className="space-y-2">
              <label
                htmlFor="password-confirm"
                className="block text-[10px] font-bold uppercase tracking-[0.3em] text-navy/40"
              >
                Confirmer le mot de passe <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/25"
                  size={16}
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
                  className="tap-target w-full rounded-none border border-black/12 bg-white py-3.5 pl-11 pr-14 text-navy placeholder:text-navy/25 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((s) => !s)}
                  className="tap-target absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-navy/40 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                  aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
                >
                  {showConfirm ? <EyeOff size={18} strokeWidth={1.25} /> : <Eye size={18} strokeWidth={1.25} />}
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
          className="tap-target inline-flex w-full items-center justify-center gap-3 border border-navy bg-navy px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
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

      {mode === "login" && (
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-navy/35">
          Pas encore de compte ?{" "}
          <Link href={`/register?redirect=${encodeURIComponent(redirectTo)}`} className="text-navy underline-offset-4 hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      )}
      {mode === "signup" && (
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-navy/35">
          Déjà un compte ?{" "}
          <button
            type="button"
            onClick={() => setMode("login")}
            className="text-navy underline-offset-4 hover:underline"
          >
            Se connecter
          </button>
        </p>
      )}
    </div>
  )
}

function LoginSideVideo() {
  return (
    <div className="relative z-0 min-h-[220px] w-full shrink-0 overflow-hidden bg-black lg:min-h-0 lg:flex-1">
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
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 lg:bg-gradient-to-r"
        aria-hidden
      />
    </div>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/dashboard/proprio"
  const isTenant = redirectTo.startsWith("/espace-client")
  const passwordTab = searchParams.get("tab") === "signup" ? "signup" : "login"

  const title = isTenant ? "Votre espace" : "Espace propriétaire"
  const eyebrow = isTenant ? "Locataires · Lien magique" : "Propriétaires · Accès sécurisé"
  const tagline = isTenant
    ? "Réservations, livret et conciergerie."
    : "Suivi des biens et des réservations."

  return (
    <main className="flex min-h-[100dvh] flex-col bg-offwhite lg:flex-row">
      {/* Mobile : vidéo en haut ; desktop : colonne gauche */}
      <LoginSideVideo />

      <div className="relative z-[1] flex w-full flex-col justify-center border-black/8 px-6 py-12 lg:w-[min(100%,28rem)] lg:shrink-0 lg:border-l lg:px-12 lg:py-16 xl:w-[min(100%,32rem)]">
        <div className="mx-auto w-full max-w-sm space-y-10">
          <BrandLogo variant="onLight" size="sm" />

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-navy/40">{eyebrow}</p>
            <h1 className="font-display text-[1.85rem] leading-tight text-navy md:text-[2.1rem]">
              {title}
            </h1>
            <span className="block h-px w-10 bg-black/12" />
            <p className="text-sm text-navy/45">{tagline}</p>
          </div>

          {isTenant ? (
            <TenantMagicLinkFlow redirectTo={redirectTo} />
          ) : (
            <PasswordPanel redirectTo={redirectTo} initialMode={passwordTab} />
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/8 pt-6 text-[10px] uppercase tracking-[0.18em] text-navy/35">
            <Link href="/" className="transition-colors hover:text-navy">
              ← Retour au site
            </Link>
            {isTenant ? (
              <Link
                href="/login?redirect=/dashboard/proprio"
                className="transition-colors hover:text-navy"
              >
                Accès propriétaire
              </Link>
            ) : (
              <Link
                href="/login?redirect=/espace-client"
                className="transition-colors hover:text-navy"
              >
                Espace locataire
              </Link>
            )}
          </div>

          <p className="text-[10px] uppercase tracking-[0.25em] text-navy/25">
            © 2026 Diamant Noir
          </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-offwhite">
          <Loader2 className="animate-spin text-navy/40" size={22} strokeWidth={1.25} aria-hidden />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
