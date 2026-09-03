"use client"

import { Suspense, useEffect, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase"
import {
  Eye,
  EyeOff,
  Loader2,
  Send,
  User,
} from "lucide-react"
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon"
import { GoogleIcon } from "@/components/icons/GoogleIcon"
import Link from "next/link"
import { postLoginDestination } from "@/lib/auth/admin-access"
import { useLocale } from "@/contexts/LocaleContext"

/**
 * Layout 60/40 (vidéo / panneau) — asset : /public/login-side.webm
 */

const MIN_PASSWORD_LEN = 8

function loginUrlErrorMessage(
  error: string | null,
  t: (key: string) => string
): string | null {
  if (!error) return null
  try {
    const e = decodeURIComponent(error).toLowerCase()
    if (e.includes("access_denied")) return t("auth.error_login_cancelled")
    if (e.includes("expired") || e.includes("otp")) return t("auth.error_link_expired")
  } catch {
    /* ignore */
  }
  return t("auth.error_login_generic")
}

function formatSupabaseAuthMessage(message: string, t: (key: string) => string): string {
  const m = message.toLowerCase()
  if (m.includes("already registered") || m.includes("user already")) {
    return t("auth.error_already_registered")
  }
  if (m.includes("password") && (m.includes("least") || m.includes("short"))) {
    return t("auth.error_password_min")
  }
  if (m.includes("invalid") && m.includes("email")) {
    return t("auth.error_invalid_email")
  }
  if (m.includes("signup") && m.includes("disabled")) {
    return t("auth.error_signup_disabled")
  }
  return message || t("auth.error_generic")
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
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowser()
  const { t } = useLocale()

  // Restaurer l'email sauvegardé au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kv-remembered-email")
      if (saved) {
        setEmail(saved)
        setRememberMe(true)
      }
    } catch { /* localStorage indisponible */ }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setError(t("auth.error_supabase_unconfigured"))
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
          ? t("auth.error_invalid_credentials")
          : formatSupabaseAuthMessage(signError.message, t)
      )
      setLoading(false)
    } else {
      // Sauvegarder ou effacer l'email pour "Se souvenir de moi"
      try {
        if (rememberMe) {
          localStorage.setItem("kv-remembered-email", cleanEmail)
        } else {
          localStorage.removeItem("kv-remembered-email")
        }
      } catch { /* localStorage indisponible */ }

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
      // Délai pour laisser les cookies Supabase s'écrire avant redirection
      await new Promise((resolve) => setTimeout(resolve, 300));
      window.location.href = dest
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    if (password !== confirmPassword) {
      setFieldErrors({ confirm: t("auth.error_password_mismatch") })
      return
    }
    if (password.length < MIN_PASSWORD_LEN) {
      setError(t("auth.error_password_min"))
      return
    }
    if (!supabase) {
      setError(t("auth.error_supabase_unconfigured"))
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
      setError(formatSupabaseAuthMessage(signUpError.message, t))
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
      await new Promise((resolve) => setTimeout(resolve, 300));
      window.location.href = dest
      return
    }
    if (data.user) {
      setSignupSuccess("confirm_email")
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) { setError(t("auth.error_supabase_unconfigured")); return }
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
      setError(formatSupabaseAuthMessage(resetError.message, t))
    } else {
      setForgotSuccess(true)
    }
  }

  const handleGoogleLogin = async () => {
    if (!supabase) { setError(t("auth.error_supabase_unconfigured")); return }
    setError(null)
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo || "/espace-client")}` },
    })
    if (googleError) {
      setError(formatSupabaseAuthMessage(googleError.message, t))
    }
  }

  if (forgotSuccess) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Send size={20} strokeWidth={1.5} className="text-navy/60" aria-hidden />
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-navy">{t("auth.check_email_title")}</h2>
          <span className="block h-px w-10 bg-navy/12" />
        </div>
        <p className="text-sm leading-relaxed text-navy/80">
          {t("auth.forgot_sent_prefix")}{" "}
          <span className="font-medium text-navy">{email}</span>.
        </p>
        <p className="text-xs leading-relaxed text-navy/60">
          {t("auth.resend_hint")}
        </p>
        <button
          type="button"
          onClick={() => {
            setForgotSuccess(false)
            setMode("login")
            setError(null)
            setPassword("")
          }}
          className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/60 transition-colors hover:text-navy"
        >
          {t("auth.back_to_login")}
        </button>
      </div>
    )
  }

  if (signupSuccess === "confirm_email") {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Send size={20} strokeWidth={1.5} className="text-navy/60" aria-hidden />
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-navy">{t("auth.confirm_email_title")}</h2>
          <span className="block h-px w-10 bg-navy/12" />
        </div>
        <p className="text-sm leading-relaxed text-navy/80">
          {t("auth.confirm_email_prefix")}{" "}
          <span className="font-medium text-navy">{email}</span>{t("auth.confirm_email_suffix")}
        </p>
        <p className="text-xs leading-relaxed text-navy/60">
          {t("auth.resend_hint")}
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
          className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/60 transition-colors hover:text-navy"
        >
          {t("auth.back_to_login")}
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
                className="block text-[10px] font-bold uppercase tracking-[0.28em] text-navy/60"
              >
                {t("auth.name_label")} <span className="font-normal normal-case tracking-normal text-navy/60">{t("auth.optional")}</span>
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-navy/60"
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden
                />
                <input
                  id="full-name-pass"
                  type="text"
                  autoComplete="name"
                  placeholder={t("auth.name_placeholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-0 text-base text-navy placeholder:text-navy/60 focus:border-navy focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label
              htmlFor="email-pass"
              className="block text-[10px] font-bold uppercase tracking-[0.28em] text-navy/60"
            >
              {t("auth.email_label")} <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <KayvilaPngIcon
                name="mail"
                size={18}
                alt=""
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2"
              />
              <input
                id="email-pass"
                type="email"
                autoComplete="email"
                placeholder={t("auth.email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-0 text-base text-navy placeholder:text-navy/60 focus:border-navy focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1">
              <label
                htmlFor="password-pass"
                className="block text-[10px] font-bold uppercase tracking-[0.28em] text-navy/60"
              >
                {t("auth.password_label")} <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <KayvilaPngIcon
                  name="lock"
                  size={18}
                  alt=""
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2"
                />
                <input
                  id="password-pass"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={t("auth.password_placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "signup" ? MIN_PASSWORD_LEN : undefined}
                  aria-describedby={mode === "signup" ? "password-hint" : undefined}
                  className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-10 text-base text-navy placeholder:text-navy/60 focus:border-navy focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="tap-target absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-navy/60 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                  aria-label={showPassword ? t("auth.hide_password") : t("auth.show_password")}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
              {mode === "signup" && (
                <p id="password-hint" className="text-xs text-navy/60">
                  {t("auth.password_hint")}
                </p>
              )}
            </div>
          )}
          {mode === "signup" && (
            <div className="space-y-1">
              <label
                htmlFor="password-confirm"
                className="block text-[10px] font-bold uppercase tracking-[0.28em] text-navy/60"
              >
                {t("auth.password_confirm_label")} <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <KayvilaPngIcon
                  name="lock"
                  size={18}
                  alt=""
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2"
                />
                <input
                  id="password-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("auth.password_placeholder")}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (fieldErrors.confirm) setFieldErrors({})
                  }}
                  required
                  aria-invalid={Boolean(fieldErrors.confirm)}
                  aria-describedby={fieldErrors.confirm ? "confirm-error" : undefined}
                  className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 pl-6 pr-10 text-base text-navy placeholder:text-navy/60 focus:border-navy focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="tap-target absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-navy/60 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                  aria-label={showConfirm ? t("auth.hide_confirm") : t("auth.show_confirm")}
                >
                  {showConfirm ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
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
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  setRememberMe(e.target.checked)
                  if (!e.target.checked) {
                    try { localStorage.removeItem("kv-remembered-email") } catch { /* ignore */ }
                  }
                }}
                className="h-3.5 w-3.5 cursor-pointer border-navy/30 bg-transparent text-navy accent-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-navy/60">
                {t("auth.remember_me")}
              </span>
            </label>
            <button
              type="button"
              onClick={() => { setMode("forgot"); setError(null) }}
              className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/60 transition-colors hover:text-navy"
            >
              {t("auth.forgot_password")}
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
            <Loader2 className="animate-spin" size={16} strokeWidth={1.5} aria-hidden />
          ) : mode === "login" ? (
            <>
              {t("auth.submit_login")}
              <KayvilaPngIcon name="arrow-right" size={18} alt="" />
            </>
          ) : mode === "forgot" ? (
            <>
              {t("auth.submit_forgot")}
              <KayvilaPngIcon name="arrow-right" size={18} alt="" />
            </>
          ) : (
            <>
              {t("auth.submit_signup")}
              <KayvilaPngIcon name="arrow-right" size={18} alt="" />
            </>
          )}
        </button>

          {mode === "login" && (
            <>
              <div className="flex items-center gap-3" aria-hidden>
                <span className="h-px flex-1 bg-navy/10" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-navy/50">{t("auth.or")}</span>
                <span className="h-px flex-1 bg-navy/10" />
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="tap-target inline-flex w-full items-center justify-center gap-3 border border-navy/20 bg-white px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              >
                <GoogleIcon className="h-4 w-4" />
                {t("auth.google_login")}
              </button>
            </>
          )}
      </form>

      {mode === "login" ? (
        <p className="text-center text-[10px] uppercase tracking-[0.18em] text-navy/60">
          {t("auth.no_account")}{" "}
          <button
            type="button"
            onClick={() => {
              setMode("signup")
              setError(null)
              setFieldErrors({})
            }}
            className="text-navy underline-offset-4 hover:underline"
          >
            {t("auth.signup_cta")}
          </button>
        </p>
      ) : mode === "signup" ? (
        <p className="text-center text-[10px] uppercase tracking-[0.18em] text-navy/60">
          {t("auth.has_account")}{" "}
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setError(null)
              setFieldErrors({})
            }}
            className="text-navy underline-offset-4 hover:underline"
          >
            {t("auth.login_cta")}
          </button>
        </p>
      ) : (
        <p className="text-center text-[10px] uppercase tracking-[0.18em] text-navy/60">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null) }}
            className="text-navy underline-offset-4 hover:underline"
          >
            {t("auth.back_to_login")}
          </button>
        </p>
      )}
    </div>
  )
}

function LoginSideVideo() {
  const [reduceMotion, setReduceMotion] = useState(false)
  const { t } = useLocale()

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
          preload="auto"
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
        <p className="mb-1 text-[8px] tracking-[0.28em] uppercase text-gold">{t("auth.region_tag")}</p>
        <div className="h-px w-5 bg-gold opacity-60" />
      </div>
    </div>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const raw = searchParams.get("redirect") || "/dashboard"
  // Sécurité : n'accepter que les URLs relatives (pas d'open redirect)
  const redirectTo = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard"
  const passwordTab = searchParams.get("tab") === "signup" ? "signup" : "login"
  const urlAuthError = loginUrlErrorMessage(searchParams.get("error"), t)

  return (
    <main className="flex min-h-[100dvh] flex-col bg-white lg:flex-row">
      <LoginSideVideo />

      <div className="relative z-[1] flex w-full flex-col justify-center border-black/[0.06] bg-white px-6 py-10 lg:w-[min(100%,26rem)] lg:shrink-0 lg:border-l lg:px-10 lg:py-14">
        <div className="mx-auto w-full max-w-xs space-y-8">
          <p className="text-[8px] font-bold uppercase tracking-[0.38em] text-navy">{t("auth.brand_tag")}</p>

          <div className="space-y-2">
            <h1 className="font-display text-[1.9rem] leading-tight text-navy">{t("auth.login_title")}</h1>
            <span className="block h-px w-8 bg-navy/12" />
            <p className="text-sm text-navy/60">{t("auth.login_subtitle")}</p>
          </div>

          {urlAuthError && (
            <p role="alert" className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {urlAuthError}
            </p>
          )}

          <PasswordPanel redirectTo={redirectTo} initialMode={passwordTab} />

          <div className="flex items-center justify-start border-t border-black/[0.07] pt-5 text-[10px] uppercase tracking-[0.18em] text-navy/60">
            <Link href="/" className="transition-colors hover:text-navy">
              {t("auth.back_to_site")}
            </Link>
          </div>

          <p className="text-[10px] uppercase tracking-[0.25em] text-navy/60">{t("auth.copyright")}</p>
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
          <Loader2 className="animate-spin text-navy/60" size={22} strokeWidth={1.5} aria-hidden />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
