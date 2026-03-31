"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { SupabaseDebug } from "@/components/debug/SupabaseDebug"

import Link from "next/link"
import Image from "next/image"
import { Plus, Home, ArrowRight, LogOut, MoreVertical, Edit, Trash2, ExternalLink, Sparkles, FileText, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowser } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { revalidateVillas } from "@/lib/actions"
import { ActionMenu } from "@/components/dashboard/ActionMenu"

export default function ConciergeDashboard() {
  const router = useRouter()
  const supabase = getSupabaseBrowser()
  const [villas, setVillas] = useState<any[]>([])
  const [showPublishedOnly, setShowPublishedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function checkAuth() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push("/login")
        }
      }
    }
    checkAuth()
  }, [supabase, router])

  useEffect(() => {
    async function fetchVillas() {
      // Debug : Vérifier si Supabase est configuré
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log("🔍 [Dashboard] Vérification Supabase:");
      console.log("  - URL:", supabaseUrl ? "✅ Configuré" : "❌ Manquant");
      console.log("  - Key:", supabaseKey ? "✅ Configuré" : "❌ Manquant");
      console.log("  - Client:", supabase ? "✅ Créé" : "❌ Null");

      if (!supabase) {
        console.warn("⚠️ [Dashboard] Supabase non configuré");
        setError("Supabase non configuré. Vérifie `.env.local` et redémarre le serveur.")
        setVillas([])
        setLoading(false)
        return
      }

      console.log("📡 [Dashboard] Tentative de récupération des villas depuis Supabase...");
      
      const { data, error } = await supabase
        .from("villas")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ [Dashboard] Erreur Supabase:", error);
        console.error("  - Code:", error.code);
        console.error("  - Message:", error.message);
        console.error("  - Details:", error.details);
        setError(error.message || "Erreur Supabase")
        setVillas([])
      } else {
        console.log("✅ [Dashboard] Villas récupérées:", data?.length || 0);
        if (data && data.length > 0) {
          console.log("  - Villas:", (data as any[]).map((v: any) => v.name));
          setVillas(data)
        } else {
          console.warn("⚠️ [Dashboard] Aucune villa trouvée dans Supabase.");
          setVillas([])
        }
      }
      setLoading(false)
    }

    fetchVillas()
  }, [supabase])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4500)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }
    }
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const upcoming = villas.reduce((total, villa) => {
      // Si on avait les bookings ici on pourrait compter, mais on va faire une query simple
      return total
    }, 0)
    return { count: villas.length }
  }, [villas])

  const [upcomingCount, setUpcomingCount] = useState(0)

  useEffect(() => {
    async function fetchStats() {
      if (!supabase) return
      const now = new Date().toISOString()
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .gte("start_date", now)
      
      if (count !== null) setUpcomingCount(count)
    }
    fetchStats()
  }, [supabase, villas])

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut()
    router.push("/")
  }

  const handleDeleteVilla = async (id: string, name: string) => {
    if (!supabase) return
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ? Cette action est irréversible.`)) {
      return
    }

    setPendingDelete({ id, name })
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
    }

    deleteTimerRef.current = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError("Session expirée. Veuillez vous reconnecter.")
        setPendingDelete(null)
        return
      }

      const response = await fetch("/api/dashboard/delete-villa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ villaId: id }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setError(payload?.error || "Suppression impossible")
        setPendingDelete(null)
        return
      }

      setVillas((prev) => prev.filter((v) => v.id !== id))
      await revalidateVillas()
      setPendingDelete(null)
    }, 10000)
  }

  const handleUndoDelete = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
    }
    setPendingDelete(null)
  }

  const visibleVillas = showPublishedOnly
    ? villas.filter((villa) => villa.is_published)
    : villas

  return (
    <main className="flex min-h-screen flex-col bg-offwhite">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/95 md:bg-white/80 md:backdrop-blur-md">
        <div className="mx-auto flex min-h-24 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white font-display text-xl">
              D
            </div>
            <div className="flex flex-col">
              <h1 className="font-display text-xl text-navy leading-none">Administration</h1>
              <p className="text-[10px] uppercase tracking-widest text-gold mt-1 font-bold">Conciergerie de Luxe</p>
            </div>
          </div>
          <div className="flex w-full items-center justify-end gap-2 overflow-x-auto no-scrollbar sm:w-auto sm:justify-start sm:gap-4">
            <Button
              variant="outline"
              size="sm"
              className="flex h-10 w-10 shrink-0 items-center justify-center gap-0 rounded-full border-gold/20 bg-gold/5 px-0 text-gold transition-all hover:bg-gold hover:text-navy sm:h-auto sm:w-auto sm:gap-2 sm:px-6"
              onClick={() => router.push("/dashboard/proprio/assistant")}
              aria-label="Assistant IA"
            >
              <Sparkles size={16} />
              <span className="hidden text-[10px] font-bold uppercase tracking-widest sm:inline">Assistant IA</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex h-10 w-10 shrink-0 items-center justify-center gap-0 rounded-full border-navy/10 px-0 sm:h-auto sm:w-auto sm:gap-2 sm:px-4"
              onClick={() => router.push("/dashboard/proprio/analytics")}
              aria-label="Analytics"
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex h-10 w-10 shrink-0 items-center justify-center gap-0 rounded-full border-navy/10 px-0 sm:h-auto sm:w-auto sm:gap-2 sm:px-4"
              onClick={() => router.push("/dashboard/proprio/submissions")}
              aria-label="Soumissions"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">Soumissions</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex h-10 w-10 shrink-0 items-center justify-center gap-0 rounded-full border-navy/10 px-0 sm:h-auto sm:w-auto sm:gap-2 sm:px-4"
              onClick={() => router.push("/dashboard/proprio/new")}
              aria-label="Nouvelle villa"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nouvelle Villa</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="rounded-full text-navy/60 hover:text-navy tap-target">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b pt-12 pb-12 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Vue d'ensemble</span>
              <h2 className="font-display text-4xl text-navy">Mon Portefeuille de Villas</h2>
              <p className="text-sm text-navy/60 max-w-md">
                Gérez vos propriétés, suivez les performances et optimisez vos réservations depuis ce hub central.
              </p>
            </div>
            <div className="flex gap-4 items-center flex-wrap">
              <div className="rounded-2xl bg-offwhite p-4 text-center min-w-[120px]">
                <p className="text-2xl font-bold text-navy">{villas.length}</p>
                <p className="text-[10px] uppercase tracking-widest text-navy/40 font-bold">Villas</p>
              </div>
              <div className="rounded-2xl bg-offwhite p-4 text-center min-w-[120px]">
                <p className="text-2xl font-bold text-navy">{upcomingCount}</p>
                <p className="text-[10px] uppercase tracking-widest text-navy/40 font-bold">Arrivées</p>
              </div>
              <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 border border-navy/10">
                <span className="text-[10px] uppercase tracking-widest text-navy/40 font-bold">Filtre</span>
                <button
                  type="button"
                  onClick={() => setShowPublishedOnly((prev) => !prev)}
                  className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    showPublishedOnly
                      ? "bg-gold text-navy"
                      : "bg-offwhite text-navy/50 hover:text-navy"
                  }`}
                >
                  {showPublishedOnly ? "Publiées" : "Toutes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid of Villas */}
      <section className="mx-auto w-full max-w-7xl p-6 py-12">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Erreur Supabase : {error}. Vérifie les clés `.env.local`, la RLS et que tes villas existent.
          </div>
        )}
        {pendingDelete && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <span>Suppression de "{pendingDelete.name}" dans 10s…</span>
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleUndoDelete}>
              Annuler
            </Button>
          </div>
        )}
        {!loading && !error && villas.length === 0 && (
          <div className="mb-6 rounded-2xl border border-navy/10 bg-white p-6 text-sm text-navy/60">
            Aucune villa trouvée dans Supabase. Ajoute une villa dans la table `villas` puis recharge la page.
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Add New Villa Card (Mobile/Inline) */}
          <button
            className="group flex flex-col items-center justify-center gap-4 rounded-[40px] border-2 border-dashed border-navy/10 bg-white/50 p-8 transition-all hover:bg-white hover:border-gold lg:min-h-[300px]"
            onClick={() => router.push("/dashboard/proprio/new")}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy/5 text-navy group-hover:bg-gold group-hover:text-navy transition-all">
              <Plus size={32} />
            </div>
            <div className="text-center">
              <p className="font-bold text-navy">Ajouter une villa</p>
              <p className="text-xs text-navy/40">Élargissez votre catalogue</p>
            </div>
          </button>

          {loading ? (
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="h-[300px] rounded-[40px] bg-white animate-pulse" />
            ))
          ) : (
            visibleVillas.map((villa) => (
              <div key={villa.id} className="group relative">
                <div className="absolute top-4 right-4 z-20">
                  <ActionMenu
                    items={[
                      {
                        label: "Modifier",
                        icon: <Edit size={14} />,
                        onClick: () => router.push(`/dashboard/proprio/${villa.id}`),
                      },
                      {
                        label: "Voir en ligne",
                        icon: <ExternalLink size={14} />,
                        onClick: () => window.open(`/villas/${villa.id}`, "_blank"),
                      },
                      {
                        label: "Supprimer",
                        icon: <Trash2 size={14} />,
                        onClick: () => handleDeleteVilla(villa.id, villa.name),
                        variant: "danger",
                      },
                    ]}
                    trigger={
                      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-sm hover:bg-white transition-colors cursor-pointer">
                        <MoreVertical size={14} className="text-navy" />
                      </div>
                    }
                  />
                </div>

                <Link href={`/dashboard/proprio/${villa.id}`} className="block h-full">
                  <Card className="overflow-hidden rounded-[40px] border-none shadow-sm group-hover:shadow-xl transition-all h-full">
                    <div className="relative h-48 w-full bg-navy/10 overflow-hidden">
                      <Image
                        src={villa.image_url || "/villa-hero.jpg"}
                        alt={villa.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute left-4 top-4 rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest bg-white/90 backdrop-blur-md">
                        <span className={villa.is_published ? "text-emerald-600" : "text-navy/50"}>
                          {villa.is_published ? "Publié" : "Brouillon"}
                        </span>
                      </div>
                    </div>
                    <CardHeader className="p-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold">
                          <Home size={12} />
                          {villa.location || "Martinique"}
                        </div>
                        <CardTitle className="text-2xl">{villa.name}</CardTitle>
                        <CardDescription className="text-navy/40 font-medium">
                          {villa.status || "Aucune activité récente"}
                        </CardDescription>
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t border-navy/5 pt-6">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy group-hover:text-gold transition-colors">
                          Tableau de bord
                        </span>
                        <ArrowRight size={16} className="text-navy/20 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
      
      {/* Debug Panel */}
      <SupabaseDebug />
    </main>
  )
}
