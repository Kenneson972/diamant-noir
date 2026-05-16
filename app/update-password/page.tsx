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
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowser()

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      if (!user) {
        router.replace("/login")
      } else {
        setSessionReady(true)
      }
    })
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError(null)
    setError(null)
    if (password.length < MIN_PASSWORD_LEN) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`)
      return
    }
    if (password !== confirm) {
      setFieldError("Les mots de passe ne correspondent pas.")
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
    try {
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
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.")
      setLoading(false)
    }
  }

  if (!sessionReady) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-white">
        <Loader2 className="animate-spin text-navy/40" size={22} strokeWidth={1.25} aria-hidden />
      </main>
    )
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

        <form onSubmit={handleSubmit} aria-busy={loading} className="space-y-7">
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
