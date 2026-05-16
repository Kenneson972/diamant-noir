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

/**
 * Layout 60/40 (vidéo / panneau) — asset : /public/login-side.webm
 */

const MIN_PASSWORD_LEN = 8

function loginUrlErrorMessage(error: string | null): string | null {
  if (!error) return null
  try {
    const e = decodeURIComponent(error).toLowerCase()
    if (e.includes("access_denied")) return "Connexion annulée."
    if (e.includes("expired") || e.includes("otp")) return "Lien ou code expiré. Réessayez."
  } catch {
    /* ignore */
  }
  return "Impossible de finaliser la connexion. Réessayez."
}

function formatSupabaseAuthMessage(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("already registered") || m.includes("user already")) {
    return "Un compte existe déjà avec cet email. Utilisez le bouton Se connecter."
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

type PasswordMode = "login" | "signup" | "forgot"

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
  const [forgotSuccess, setForgotSuccess] = useState(false)
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
      setLoading(false)
    } else {
      // Forcer un rechargement complet pour que le middleware voie les cookies
      const { data: userData } = await supabase.auth.getUser()
      const u = userData.user
      let profileRole: string | null = null
      if (u) {
        const { data: p } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .maybeSingle()
        profileRole = p?.role ?? null
      }
      const dest = postLoginDestination({
        requestedRedirect: redirectTo,
        profileRole,
        metadataRole: u?.user_metadata?.role as string | undefined,
        email: u?.email,
      })
      // window.location.href force un vrai chargement serveur
      // → le middleware Next.js peut lire les cookies et valider la session
      window.location.href = dest
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
      const u = data.session.user
      let profileRole: string | null = null
      if (u) {
        const { data: p } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .maybeSingle()
        profileRole = p?.role ?? null
      }
      const dest = postLoginDestination({
        requestedRedirect: redirectTo,
        profileRole,
        metadataRole: u?.user_metadata?.role as string | undefined,
        email: u?.email,
      })
      window.location.href = dest
      return
    }
    if (data.user) {
      setSignupSuccess("confirm_email")
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) { setError("Supabase n'est pas configuré."); return }
    setLoading(true)
    setError(null)
    const cleanEmail = email.trim().toLowerCase()
    setEmail(cleanEmail)
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
            setPassword("")
          }}
          className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/35 transition-colors hover:text-navy"
        >
          ← Retour à la connexion
        </button>
      </div>
    )
  }

  if (signupSuccess === "confirm_email") {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Send size={20} strokeWidth={1.25} className="text-navy/30" aria-hidden />
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-navy">Confirmez votre email</h2>
          <span className="block h-px w-10 bg-navy/12" />
        </div>
        <p className="text-sm leading-relaxed text-navy/55">
          Nous avons envoyé un lien de confirmation à{" "}
          <span className="font-medium text-navy">{email}</span>. Cliquez sur le lien pour
          activer votre compte, puis vous pourrez vous connecter.
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
      <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot} className="space-y-7">
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
                className="block text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40"
              >
                Nom <span className="font-normal normal-case tracking-normal text-navy/30">(optionnel)</span>
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-navy/25"
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
                  className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-0 text-base text-navy placeholder:text-navy/25 focus:border-navy focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label
              htmlFor="email-pass"
              className="block text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40"
            >
              Adresse email <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-navy/25"
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
                className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-0 text-base text-navy placeholder:text-navy/25 focus:border-navy focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1">
              <label
                htmlFor="password-pass"
                className="block text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40"
              >
                Mot de passe <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-navy/25"
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
              {mode === "signup" && (
                <p id="password-hint" className="text-xs text-navy/40">
                  Au moins {MIN_PASSWORD_LEN} caractères.
                </p>
              )}
            </div>
          )}
          {mode === "signup" && (
            <div className="space-y-1">
              <label
                htmlFor="password-confirm"
                className="block text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40"
              >
                Confirmer le mot de passe <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-navy/25"
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
              {fieldErrors.confirm && (
                <p id="confirm-error" role="alert" className="text-sm text-red-700">
                  {fieldErrors.confirm}
                </p>
              )}
            </div>
          )}
        </div>
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
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="tap-target inline-flex w-full items-center justify-center gap-3 border border-navy bg-navy px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
        >
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
        </button>
      </form>

      {mode === "login" ? (
        <p className="text-center text-[10px] uppercase tracking-[0.18em] text-navy/35">
          Pas encore de compte ?{" "}
          <button
            type="button"
            onClick={() => {
              setMode("signup")
              setError(null)
              setFieldErrors({})
            }}
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
            onClick={() => {
              setMode("login")
              setError(null)
              setFieldErrors({})
            }}
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
    </div>
  )
}

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
    <div className="relative z-0 h-[clamp(220px,42svh,420px)] w-full shrink-0 overflow-hidden bg-navy lg:h-auto lg:min-h-0 lg:flex-[1.5]">
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
          <source src="/login-side.webm" type="video/webm" />
        </video>
      )}
      {/* Mobile: fondu vers le panneau blanc — évite la « coupe » nette quand le formulaire est long */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-28 bg-gradient-to-b from-transparent via-white/35 to-white lg:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 lg:bg-gradient-to-r"
        aria-hidden
      />
      <div className="pointer-events-none absolute bottom-5 left-6 z-10" aria-hidden>
        <p className="mb-1 text-[8px] tracking-[0.28em] uppercase text-gold">Martinique</p>
        <div className="h-px w-5 bg-gold opacity-60" />
      </div>
    </div>
  )
}

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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-white">
          <Loader2 className="animate-spin text-navy/40" size={22} strokeWidth={1.25} aria-hidden />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
