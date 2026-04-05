"use client"

/** Locataire : email → OTP → profil (inscription). Template mail Supabase : {{ .Token }} pour le code. */

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase"

const OTP_LEN = 6
const RESEND_COOLDOWN_SEC = 60

type AuthMode = "login" | "signup"
type Step = "email" | "otp" | "profile"
type Salutation = "madame" | "monsieur" | "unspecified"

type TenantMagicLinkFlowProps = {
  redirectTo: string
}

export function TenantMagicLinkFlow({ redirectTo }: TenantMagicLinkFlowProps) {
  const router = useRouter()
  const supabase = getSupabaseBrowser()

  const [mode, setMode] = useState<AuthMode>("login")
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LEN).fill(""))
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [salutation, setSalutation] = useState<Salutation>("madame")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendSec, setResendSec] = useState(0)
  const verifyingRef = useRef(false)

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`

  const resetToEmail = useCallback(() => {
    setStep("email")
    setDigits(Array(OTP_LEN).fill(""))
    setError(null)
    verifyingRef.current = false
  }, [])

  const sendOtp = useCallback(async () => {
    if (!supabase) {
      setError("Supabase n'est pas configuré.")
      return false
    }
    setLoading(true)
    setError(null)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    })
    setLoading(false)
    if (otpError) {
      setError("Impossible d'envoyer le code. Vérifiez votre adresse.")
      return false
    }
    setResendSec(RESEND_COOLDOWN_SEC)
    return true
  }, [supabase, email, emailRedirectTo])

  useEffect(() => {
    if (resendSec <= 0) return
    const id = window.setInterval(() => setResendSec((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [resendSec])

  useEffect(() => {
    if (step !== "otp") return
    const id = window.requestAnimationFrame(() => otpInputRefs.current[0]?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [step])

  const verifyCode = useCallback(
    async (raw: string) => {
      const token = raw.replace(/\D/g, "").slice(0, OTP_LEN)
      if (token.length !== OTP_LEN || !supabase || verifyingRef.current) return
      verifyingRef.current = true
      setLoading(true)
      setError(null)

      const tryTypes = ["email", "magiclink"] as const
      let lastErr: Error | null = null

      for (const type of tryTypes) {
        const { error: vErr } = await supabase.auth.verifyOtp({
          email,
          token,
          type,
        })
        if (!vErr) {
          setLoading(false)
          verifyingRef.current = false
          if (mode === "signup") {
            setStep("profile")
          } else {
            router.push(redirectTo)
            router.refresh()
          }
          return
        }
        lastErr = vErr
      }

      setLoading(false)
      verifyingRef.current = false
      setError(
        lastErr?.message?.toLowerCase().includes("expired") ? "Code expiré." : "Code invalide."
      )
      setDigits(Array(OTP_LEN).fill(""))
      otpInputRefs.current[0]?.focus()
    },
    [supabase, email, mode, redirectTo, router]
  )

  useEffect(() => {
    if (step !== "otp" || loading) return
    const code = digits.join("")
    if (code.length !== OTP_LEN || !/^\d{6}$/.test(code)) return
    const t = window.setTimeout(() => void verifyCode(code), 200)
    return () => window.clearTimeout(t)
  }, [digits, step, loading, verifyCode])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await sendOtp()
    if (ok) setStep("otp")
  }

  const handleResend = async () => {
    if (resendSec > 0 || loading) return
    await sendOtp()
  }

  const setDigitAt = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[i] = d
    setDigits(next)
    if (d && i < OTP_LEN - 1) otpInputRefs.current[i + 1]?.focus()
  }

  const onOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      otpInputRefs.current[i - 1]?.focus()
    }
  }

  const onOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN)
    if (!pasted) return
    const next = Array(OTP_LEN)
      .fill("")
      .map((_, idx) => pasted[idx] ?? "")
    setDigits(next)
    const lastIdx = Math.min(pasted.length, OTP_LEN) - 1
    otpInputRefs.current[lastIdx >= 0 ? lastIdx : 0]?.focus()
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError("Champs obligatoires manquants.")
      return
    }
    if (!termsAccepted) {
      setError("CGU requises.")
      return
    }
    if (!supabase) {
      setError("Supabase n'est pas configuré.")
      return
    }
    setLoading(true)
    setError(null)
    const { error: uErr } = await supabase.auth.updateUser({
      data: {
        salutation,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: phone.trim(),
        marketing_opt_in: marketingOptIn,
        terms_accepted_at: new Date().toISOString(),
      },
    })
    setLoading(false)
    if (uErr) {
      setError("Enregistrement impossible.")
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  const switchMode = (m: AuthMode) => {
    setMode(m)
    setError(null)
    resetToEmail()
    if (m === "login") {
      setFirstName("")
      setLastName("")
      setPhone("")
      setTermsAccepted(false)
      setMarketingOptIn(false)
    }
  }

  /* ─── Étape code ─── */
  if (step === "otp") {
    return (
      <div className="relative z-[1] space-y-8">
        <button
          type="button"
          onClick={resetToEmail}
          className="tap-target -ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[rgba(13,27,42,0.45)] transition-colors hover:text-[#0D1B2A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1B2A] focus-visible:ring-offset-2"
        >
          <ArrowLeft size={16} strokeWidth={1.25} aria-hidden />
          Retour
        </button>

        <div className="space-y-1">
          <h2 className="font-display text-xl text-[#0D1B2A] sm:text-2xl">Code</h2>
          <p className="text-sm text-[rgba(13,27,42,0.55)]">
            <span className="font-medium text-[#0D1B2A]">{email}</span>
          </p>
        </div>

        {error && (
          <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3" onPaste={onOtpPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                otpInputRefs.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={d}
              onChange={(e) => setDigitAt(i, e.target.value)}
              onKeyDown={(e) => onOtpKeyDown(i, e)}
              aria-label={`Chiffre ${i + 1} sur ${OTP_LEN}`}
              className="tap-target h-12 w-10 border-0 border-b-2 border-navy/25 bg-transparent text-center font-display text-xl text-navy transition-colors focus:border-navy focus:outline-none focus:ring-0 sm:h-14 sm:w-12 sm:text-2xl"
            />
          ))}
        </div>

        <button
          type="button"
          disabled={loading || digits.join("").length !== OTP_LEN}
          onClick={() => verifyCode(digits.join(""))}
          className="tap-target inline-flex w-full items-center justify-center gap-3 border border-[#0D1B2A] bg-[#0D1B2A] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[rgba(13,27,42,0.90)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1B2A] focus-visible:ring-offset-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} strokeWidth={1.25} aria-hidden />
          ) : (
            <>
              Valider
              <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
            </>
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            disabled={resendSec > 0 || loading}
            onClick={handleResend}
            className="text-[10px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)] transition-colors hover:text-[#0D1B2A] disabled:opacity-40"
          >
            {resendSec > 0 ? `Renvoyer (${resendSec}s)` : "Renvoyer"}
          </button>
        </div>
      </div>
    )
  }

  /* ─── Étape profil (inscription seulement) ─── */
  if (step === "profile") {
    return (
      <div className="relative z-[1] space-y-8">
        <button
          type="button"
          onClick={() => {
            setStep("otp")
            setError(null)
          }}
          className="tap-target -ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[rgba(13,27,42,0.45)] transition-colors hover:text-[#0D1B2A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1B2A] focus-visible:ring-offset-2"
        >
          <ArrowLeft size={16} strokeWidth={1.25} aria-hidden />
          Retour
        </button>

        <div className="space-y-1">
          <h2 className="font-display text-xl uppercase tracking-[0.12em] text-[#0D1B2A] sm:text-2xl">
            Créer le compte
          </h2>
          <p className="text-sm text-[rgba(13,27,42,0.50)]">{email}</p>
        </div>

        {error && (
          <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <fieldset className="space-y-3 border-0 p-0">
            <legend className="mb-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]">
              Civilité <span className="text-red-600">*</span>
            </legend>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  { v: "madame" as const, label: "Madame" },
                  { v: "monsieur" as const, label: "Monsieur" },
                  { v: "unspecified" as const, label: "Non spécifié" },
                ] as const
              ).map(({ v, label }) => (
                <label
                  key={v}
                  className="flex cursor-pointer items-center gap-2 text-sm text-[#0D1B2A] touch-manipulation"
                >
                  <input
                    type="radio"
                    name="salutation"
                    checked={salutation === v}
                    onChange={() => setSalutation(v)}
                    className="h-4 w-4 border-[rgba(13,27,42,0.30)] text-[#0D1B2A] focus:ring-[#0D1B2A]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="tenant-fn" className="block text-[10px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]">
                Prénom <span className="text-red-600">*</span>
              </label>
              <input
                id="tenant-fn"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 text-base text-[#0D1B2A] focus:border-[#0D1B2A] focus:outline-none focus:ring-0"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="tenant-ln" className="block text-[10px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]">
                Nom <span className="text-red-600">*</span>
              </label>
              <input
                id="tenant-ln"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 text-base text-[#0D1B2A] focus:border-[#0D1B2A] focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="tenant-phone" className="block text-[10px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]">
              Téléphone mobile <span className="text-red-600">*</span>
            </label>
            <input
              id="tenant-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+596 690 00 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="tap-target w-full border-0 border-b border-black/[0.18] bg-transparent py-3 text-base text-[#0D1B2A] placeholder:text-[rgba(13,27,42,0.25)] focus:border-[#0D1B2A] focus:outline-none focus:ring-0"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-[rgba(13,27,42,0.65)] touch-manipulation">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 border-[rgba(13,27,42,0.30)] text-[#0D1B2A] focus:ring-[#0D1B2A]"
            />
            <span>
              Offres & actualités (optionnel).{" "}
              <Link href="/confidentialite" className="text-[#0D1B2A] underline-offset-4 hover:underline">
                Confidentialité
              </Link>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-[rgba(13,27,42,0.65)] touch-manipulation">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 border-[rgba(13,27,42,0.30)] text-[#0D1B2A] focus:ring-[#0D1B2A]"
            />
            <span>
              J’accepte les{" "}
              <Link href="/terms" className="text-[#0D1B2A] underline-offset-4 hover:underline">
                CGU
              </Link>
              . <span className="text-red-600">*</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="tap-target inline-flex w-full items-center justify-center gap-3 border border-[#0D1B2A] bg-[#0D1B2A] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[rgba(13,27,42,0.90)] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1B2A] focus-visible:ring-offset-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} strokeWidth={1.25} aria-hidden />
            ) : (
              "Créer le compte"
            )}
          </button>
        </form>
      </div>
    )
  }

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
            className="block text-[10px] font-bold uppercase tracking-[0.28em] text-[rgba(13,27,42,0.40)]"
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
          aria-busy={loading}
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

      {mode === "login" ? (
        <p className="text-center text-[10px] uppercase tracking-[0.18em] text-[rgba(13,27,42,0.35)]">
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
        <p className="text-center text-[10px] uppercase tracking-[0.18em] text-[rgba(13,27,42,0.35)]">
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
