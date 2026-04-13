"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Terminal,
  Sparkles,
  TrendingUp,
  Send,
  ArrowLeft,
  RefreshCcw,
  Zap,
  Database,
  Clock,
  AlertTriangle,
  Calendar,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/supabase";

import { StatsView } from "@/components/dashboard/assistant-views/StatsView";
import { VillasView } from "@/components/dashboard/assistant-views/VillasView";
import { BookingsView } from "@/components/dashboard/assistant-views/BookingsView";
import { MaintenanceView } from "@/components/dashboard/assistant-views/MaintenanceView";
import { FinancesView } from "@/components/dashboard/assistant-views/FinancesView";
import { PlanningView } from "@/components/dashboard/assistant-views/PlanningView";
import { SubmissionsView } from "@/components/dashboard/assistant-views/SubmissionsView";
import { OTAHealthView } from "@/components/dashboard/assistant-views/OTAHealthView";

type Snapshot = {
  current_date_iso: string;
  portfolio: {
    total_villas: number;
    published_villas: number;
    total_revenue_paid: number;
    upcoming_bookings_count: number;
    pending_tasks_count: number;
  };
  today: Array<{
    kind: string;
    villa_name: string;
    guest_name: string | null;
    start_date: string;
    end_date: string;
  }>;
  alerts: Array<{ severity: string; title: string; body: string | null }>;
  tasks_open?: Array<{ id: string; content: string; villa_name: string }>;
  stats: Record<string, unknown>;
} | null;

export default function OwnerAssistantPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<{ role: string; content: string; action?: string; suggested_prompts?: string[] }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>(null);
  const [activeView, setActiveView] = useState<"welcome" | "stats" | "logistics" | "villas" | "bookings" | "finances" | "planning" | "submissions" | "ota">("welcome");
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null);
  const [strategicAlert, setStrategicAlert] = useState<{ severity: string; description: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `owner-${Date.now()}`
  );

  const loadSnapshot = useCallback(async () => {
    if (!supabase) {
      setSnapshotLoading(false);
      setSnapshotError("Supabase non configuré");
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setSnapshotLoading(false);
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/dashboard/owner-assistant", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setSnapshotError(data?.error || "Chargement impossible");
        setSnapshot(null);
        return;
      }
      if (data.success && data.snapshot) {
        setSnapshot(data.snapshot);
      }
    } catch {
      setSnapshotError("Erreur réseau");
    } finally {
      setSnapshotLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "Copilot propriétaire — connecté à vos villas uniquement. Demandez un résumé, des réservations ou des tâches.",
      },
    ]);
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !supabase) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      // Inclure l'historique complet (max 12 messages = 6 échanges) pour la mémoire conversationnelle
      const history = [...messages, { role: "user", content: userMessage }]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-12);

      const response = await fetch("/api/dashboard/owner-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          sessionid: sessionIdRef.current,
          messages: history,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
            action: data.action,
            suggested_prompts: data.suggested_prompts || [],
          },
        ]);

        const actionData = data.action_data || {};
        const context = (actionData.context || actionData) as Record<string, unknown>;

        if (actionData.strategic_alert) {
          setStrategicAlert(actionData.strategic_alert);
        } else {
          setStrategicAlert(null);
        }

        if (data.action === "SHOW_STATS" || data.action === "SHOW_CHART") {
          setActiveView("stats");
          setViewData(context);
        } else if (data.action === "SHOW_VILLAS") {
          setActiveView("villas");
          setViewData(context);
        } else if (
          data.action === "SHOW_TASKS" ||
          data.action === "LIST_TASKS" ||
          data.action === "COMPLETE_TASK"
        ) {
          setActiveView("logistics");
          setViewData(context);
        } else if (data.action === "SHOW_BOOKINGS" || data.action === "CONFIRM") {
          setActiveView("bookings");
          setViewData(context);
        } else if (data.action === "SHOW_FINANCES") {
          setActiveView("finances");
          setViewData(context);
        } else if (data.action === "SHOW_PLANNING") {
          setActiveView("planning");
          setViewData(context);
        } else if (data.action === "SHOW_SUBMISSIONS") {
          setActiveView("submissions");
          setViewData(context);
        } else if (data.action === "SHOW_OTA_HEALTH") {
          setActiveView("ota");
          setViewData(context);
        } else {
          setViewData(context);
        }
      }
    } catch (error) {
      console.error("Assistant Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const portfolio = snapshot?.portfolio;

  return (
    <main className="flex h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden bg-[#0A0A0F] text-white md:h-screen md:flex-row">
      <div className="flex min-h-0 w-full flex-1 flex-col border-b border-white/5 bg-[#0D0D14] md:w-[450px] md:shrink-0 md:flex-none md:border-b-0 md:border-r md:border-white/5">
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
              <Terminal size={18} />
            </div>
            <h1 className="font-display text-sm font-bold uppercase tracking-widest text-gold/80">
              Copilot propriétaire
            </h1>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/proprio")}
            className="rounded-full p-2 text-white/20 transition-all hover:bg-white/5 hover:text-white"
            aria-label="Retour au tableau de bord"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[90%] rounded-2xl border px-4 py-3 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "border-gold/20 bg-gold/10 text-gold"
                    : "border-white/5 bg-white/5 font-mono text-white/80"
                }`}
              >
                {m.role === "assistant" && (
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-tighter text-gold/40">
                    &gt; OWNER_COPILOT
                  </span>
                )}
                <div className="whitespace-pre-line">{m.content}</div>
              </div>
              {m.role === "assistant" && m.suggested_prompts && m.suggested_prompts.length > 0 && (
                <div className="flex max-w-[90%] flex-wrap gap-2">
                  {m.suggested_prompts.map((p, j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => { setInput(p); }}
                      className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-[10px] font-medium text-gold/70 transition-all hover:border-gold/50 hover:bg-gold/15 hover:text-gold"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex animate-pulse items-center gap-2 font-mono text-[10px] uppercase text-gold/40">
              <RefreshCcw size={12} className="animate-spin" />
              Calcul en cours...
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="border-t border-white/5 bg-black/20 p-6">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question sur vos villas..."
              className="w-full rounded-xl border border-white/5 bg-white/5 py-4 pl-4 pr-12 font-mono text-sm text-white placeholder:text-white/20 transition-all focus:border-gold/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-gold p-2 text-navy transition-all hover:scale-105 disabled:opacity-50"
              aria-label="Envoyer"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
            <span className="flex items-center gap-1">
              <Zap size={10} /> Données filtrées par compte
            </span>
            <span className="h-1 w-1 rounded-full bg-white/10" />
            <span className="flex items-center gap-1">
              <Database size={10} /> API owner-assistant
            </span>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto bg-[radial-gradient(circle_at_center,_#171717_0%,_#000000_100%)] p-6 md:p-12">
        {strategicAlert && (
          <div
            className={`mb-8 flex animate-in slide-in-from-top-4 items-center gap-4 rounded-3xl border p-6 duration-500 ${
              strategicAlert.severity === "high"
                ? "border-rose-500/20 bg-rose-500/10"
                : strategicAlert.severity === "medium"
                  ? "border-amber-500/20 bg-amber-500/10"
                  : "border-blue-500/20 bg-blue-500/10"
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                strategicAlert.severity === "high"
                  ? "bg-rose-500/20 text-rose-500"
                  : strategicAlert.severity === "medium"
                    ? "bg-amber-500/20 text-amber-500"
                    : "bg-blue-500/20 text-blue-500"
              }`}
            >
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-50">
                Alerte — {strategicAlert.severity}
              </p>
              <p className="text-sm font-bold text-white">{strategicAlert.description}</p>
            </div>
          </div>
        )}

        {snapshotLoading && (
          <div className="flex flex-1 items-center justify-center text-white/40">
            <RefreshCcw className="mr-2 h-5 w-5 animate-spin" /> Chargement du tableau de bord…
          </div>
        )}

        {snapshotError && !snapshotLoading && (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            {snapshotError}
            <Button variant="outline" className="ml-4 mt-2 border-white/20 text-white" type="button" onClick={() => loadSnapshot()}>
              Réessayer
            </Button>
          </div>
        )}

        {!snapshotLoading && snapshot && activeView === "welcome" && (
          <div className="flex h-full flex-col space-y-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Portfolio</p>
                <p className="mt-2 font-display text-2xl text-white">
                  {portfolio?.total_villas ?? 0} villas
                </p>
                <p className="text-xs text-white/50">
                  {portfolio?.published_villas ?? 0} publiée(s) · CA payé €
                  {(portfolio?.total_revenue_paid ?? 0).toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Aujourd&apos;hui</p>
                <p className="mt-2 flex items-center gap-2 font-display text-2xl text-white">
                  <Calendar size={20} className="text-gold" />
                  {snapshot.today?.length ?? 0}
                </p>
                <p className="text-xs text-white/50">arrivées, séjours, départs</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">À faire</p>
                <p className="mt-2 font-display text-2xl text-white">{portfolio?.pending_tasks_count ?? 0}</p>
                <p className="text-xs text-white/50">tâches ouvertes</p>
              </div>
            </div>

            {snapshot.today && snapshot.today.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-[#0D0D14] p-6">
                <h3 className="mb-4 flex items-center gap-2 font-display text-lg text-white">
                  <Clock className="text-gold" size={18} /> Aujourd&apos;hui
                </h3>
                <ul className="space-y-3">
                  {snapshot.today.map((t, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3 text-sm last:border-0"
                    >
                      <span className="text-white/80">
                        <span className="font-mono text-[10px] uppercase text-gold/60">{t.kind}</span>{" "}
                        {t.villa_name}
                        {t.guest_name ? ` · ${t.guest_name}` : ""}
                      </span>
                      <span className="text-xs text-white/40">
                        {t.start_date?.slice(0, 10)} → {t.end_date?.slice(0, 10)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {snapshot.alerts && snapshot.alerts.length > 0 && (
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
                <h3 className="mb-4 flex items-center gap-2 font-display text-lg text-amber-200">
                  <AlertTriangle size={18} /> Alertes
                </h3>
                <ul className="space-y-2">
                  {snapshot.alerts.map((a, i) => (
                    <li key={i} className="text-sm text-white/90">
                      <span className="font-bold text-amber-400/90">{a.title}</span>
                      {a.body ? <span className="text-white/60"> — {a.body}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {snapshot.tasks_open && snapshot.tasks_open.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-[#0D0D14] p-6">
                <h3 className="mb-4 flex items-center gap-2 font-display text-lg text-white">
                  <ListChecks className="text-gold" size={18} /> Tâches ouvertes
                </h3>
                <ul className="space-y-3">
                  {snapshot.tasks_open.map((t) => (
                    <li
                      key={t.id}
                      className="border-b border-white/5 pb-3 text-sm text-white/85 last:border-0 last:pb-0"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold/50">
                        {t.villa_name}
                      </span>
                      <p className="mt-1 leading-relaxed">{t.content}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col items-center justify-center space-y-8 pb-12 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-gold/20 blur-3xl" />
                <Sparkles className="relative h-16 w-16 text-gold" />
              </div>
              <div className="max-w-xl space-y-4">
                <h2 className="font-display text-4xl text-white">Votre copilot</h2>
                <p className="text-xs uppercase leading-relaxed tracking-[0.2em] text-white/40">
                  Résumé portfolio, journée et alertes — puis posez vos questions dans le terminal.
                </p>
              </div>
              <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: "Revenus & stats", sub: "KPIs & finances", icon: TrendingUp, color: "text-gold bg-gold/10", prompt: "Analyse mes revenus du mois et compare avec le mois dernier" },
                  { label: "Check-ins du jour", sub: "Arrivées & départs", icon: Calendar, color: "text-emerald-400 bg-emerald-400/10", prompt: "Quels sont mes check-ins et check-outs aujourd'hui ?" },
                  { label: "Tâches urgentes", sub: "En retard & today", icon: ListChecks, color: "text-rose-400 bg-rose-400/10", prompt: "Liste mes tâches urgentes et en retard" },
                  { label: "Santé OTA", sub: "Sync & canaux", icon: Zap, color: "text-blue-400 bg-blue-400/10", prompt: "Montre-moi l'état de la synchronisation OTA de mes villas" },
                  { label: "Soumissions villas", sub: "Pipeline propriétaires", icon: Database, color: "text-purple-400 bg-purple-400/10", prompt: "Donne-moi le pipeline des soumissions de villa en attente" },
                  { label: "Check-up général", sub: "Anomalies & alertes", icon: AlertTriangle, color: "text-amber-400 bg-amber-400/10", prompt: "Fais un check-up complet : y a-t-il des problèmes sur mes villas ?" },
                ].map(({ label, sub, icon: Icon, color, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:bg-white/10"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}>
                      <Icon size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{label}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/35">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView !== "welcome" && viewData && (
          <div className="mb-8 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {(viewData as { metrics?: { occupancyRate?: string } }).metrics?.occupancyRate && (
              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-gold/20 bg-gold/10 px-4 py-3">
                <TrendingUp size={16} className="text-gold" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold/80">
                  {(viewData as { metrics?: { occupancyRate?: string } }).metrics?.occupancyRate}% occupation
                </span>
              </div>
            )}
          </div>
        )}

        {activeView === "stats" && viewData && <StatsView data={viewData} />}
        {activeView === "villas" && viewData && <VillasView data={viewData} />}
        {activeView === "bookings" && viewData && <BookingsView data={viewData} />}
        {activeView === "logistics" && viewData && <MaintenanceView data={viewData} />}
        {activeView === "finances" && viewData && <FinancesView data={viewData} />}
        {activeView === "planning" && viewData && <PlanningView data={viewData} />}
        {activeView === "submissions" && viewData && <SubmissionsView data={viewData} />}
        {activeView === "ota" && viewData && <OTAHealthView data={viewData} />}
      </div>
    </main>
  );
}
