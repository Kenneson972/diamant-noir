"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  TrendingUp,
  Send,
  ArrowLeft,
  RefreshCcw,
  Zap,
  Database,
  AlertTriangle,
  Calendar,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/supabase";
import { type OwnerAssistantAction } from "@/lib/owner-assistant-types";

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
  const pathname = usePathname() ?? "";
  const dashboardHomeHref = pathname.startsWith("/admin")
    ? "/admin"
    : "/dashboard/proprio";
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<{ role: string; content: string; action?: OwnerAssistantAction; suggested_prompts?: string[]; isWelcome?: boolean }[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);
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
          "Copilot propriétaire — connecté à vos villas uniquement. Posez n'importe quelle question sur votre portefeuille.",
        isWelcome: true,
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
    setHasInteracted(true);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push("/login");
        return;
      }

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
            action: data.action as OwnerAssistantAction | undefined,
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
    <main className="flex h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden bg-[#09090F] text-white md:h-screen md:flex-row">

      {/* ── LEFT PANEL — Chat ── */}
      <div className="flex min-h-0 w-full flex-1 flex-col border-b border-white/[0.06] bg-[#0B0B15] md:w-[420px] md:shrink-0 md:flex-none md:border-b-0 md:border-r md:border-white/[0.06]">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold/35">Kayvila</p>
            <h1 className="mt-0.5 font-display text-[15px] font-normal text-white/85">
              {pathname.startsWith("/admin")
                ? "Assistant administration"
                : "Assistant propriétaire"}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => router.push(dashboardHomeHref)}
            className="rounded-full p-2 text-white/20 transition-colors hover:text-white/55"
            aria-label="Retour au tableau de bord"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        <div className="mx-7 h-px bg-white/[0.06]" />

        {/* Messages */}
        <div className="flex-1 space-y-5 overflow-y-auto px-7 py-6 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gold/10 text-gold/90"
                    : "border border-white/[0.07] bg-white/[0.035] text-white/75"
                }`}
              >
                {m.role === "assistant" && (
                  <span className="mb-2 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-gold/45" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-gold/35">
                      Copilot
                    </span>
                  </span>
                )}
                <div className="whitespace-pre-line">{m.content}</div>
              </div>

              {m.role === "assistant" && m.suggested_prompts && m.suggested_prompts.length > 0 && (
                <div className="flex max-w-[90%] flex-wrap gap-1.5">
                  {m.suggested_prompts.map((p, j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setInput(p)}
                      className="rounded-full border border-gold/15 px-3 py-1 text-[10px] text-gold/50 transition-all hover:border-gold/35 hover:text-gold/75"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/20">
              <RefreshCcw size={10} className="animate-spin" />
              Calcul en cours
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.06] px-7 py-5">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question sur vos villas…"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3.5 pl-4 pr-11 text-sm text-white placeholder:text-white/20 transition-colors focus:border-gold/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-gold p-1.5 text-[#09090F] transition-all hover:bg-gold/85 disabled:opacity-30"
              aria-label="Envoyer"
            >
              <Send size={14} />
            </button>
          </form>

          {!hasInteracted && (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {["Résumé de ma semaine", "Mes check-ins de demain", "Tâches urgentes"].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="text-[10px] text-white/22 underline-offset-2 transition-colors hover:text-white/45 hover:underline"
                  onClick={() => setInput(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.3em] text-white/15">
            <span className="flex items-center gap-1">
              <Zap size={9} /> Données filtrées par compte
            </span>
            <span className="h-0.5 w-0.5 rounded-full bg-white/10" />
            <span className="flex items-center gap-1">
              <Database size={9} /> owner-assistant
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Data ── */}
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#09090F] px-8 py-8 md:px-14 md:py-12">

        {/* Strategic alert */}
        {strategicAlert && (
          <div
            className={`mb-10 flex items-start gap-4 rounded-2xl border p-5 ${
              strategicAlert.severity === "high"
                ? "border-rose-500/15 bg-rose-500/[0.07]"
                : strategicAlert.severity === "medium"
                  ? "border-amber-500/15 bg-amber-500/[0.06]"
                  : "border-white/8 bg-white/[0.03]"
            }`}
          >
            <AlertTriangle
              size={15}
              className={`mt-0.5 shrink-0 ${
                strategicAlert.severity === "high"
                  ? "text-rose-400/80"
                  : strategicAlert.severity === "medium"
                    ? "text-amber-400/80"
                    : "text-white/35"
              }`}
            />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/25">
                Alerte — {strategicAlert.severity}
              </p>
              <p className="mt-1 text-sm text-white/80">{strategicAlert.description}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {snapshotLoading && (
          <div className="flex flex-1 items-center justify-center">
            <RefreshCcw className="h-4 w-4 animate-spin text-gold/25" />
          </div>
        )}

        {/* Error */}
        {snapshotError && !snapshotLoading && (
          <div className="mb-8 flex items-center gap-4 rounded-xl border border-rose-500/15 bg-rose-500/[0.06] px-5 py-4">
            <p className="flex-1 text-sm text-rose-300/75">{snapshotError}</p>
            <Button
              variant="outline"
              className="border-white/15 text-white/50 hover:text-white"
              type="button"
              onClick={() => loadSnapshot()}
            >
              Réessayer
            </Button>
          </div>
        )}

        {/* ── WELCOME STATE ── */}
        {!snapshotLoading && snapshot && activeView === "welcome" && (
          <div className="flex flex-col gap-12">

            {/* Stats — editorial grid separated by 1px lines */}
            <div className="grid grid-cols-3 gap-px bg-white/[0.055]">
              {/* Portfolio */}
              <div className="bg-[#09090F] pb-7 pr-8 pt-1">
                <p className="eyebrow mb-4">Portfolio</p>
                <p className="font-display text-5xl font-light tabular-nums text-white">
                  {portfolio?.total_villas ?? 0}
                </p>
                <p className="mt-1 text-xs text-white/30">
                  villa{(portfolio?.total_villas ?? 0) > 1 ? "s" : ""} ·{" "}
                  {portfolio?.published_villas ?? 0} publiée{(portfolio?.published_villas ?? 0) > 1 ? "s" : ""}
                </p>
                <div className="mt-5 h-px bg-white/[0.06]" />
                <p className="mt-4 font-display text-base text-gold/75 tabular-nums">
                  €{(portfolio?.total_revenue_paid ?? 0).toLocaleString("fr-FR")}
                </p>
                <p className="text-[10px] text-white/25">CA encaissé</p>
              </div>

              {/* Aujourd'hui */}
              <div className="bg-[#09090F] pb-7 pl-8 pr-8 pt-1">
                <p className="eyebrow mb-4">Aujourd&apos;hui</p>
                <p className="font-display text-5xl font-light tabular-nums text-white">
                  {snapshot.today?.length ?? 0}
                </p>
                <p className="mt-1 text-xs text-white/30">
                  événement{(snapshot.today?.length ?? 0) > 1 ? "s" : ""}
                </p>
                <div className="mt-5 h-px bg-white/[0.06]" />
                <p className="mt-4 text-sm text-white/35 capitalize">
                  {new Date(snapshot.current_date_iso).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>

              {/* À faire */}
              <div className="bg-[#09090F] pb-7 pl-8 pt-1">
                <p className="eyebrow mb-4">À faire</p>
                <p
                  className={`font-display text-5xl font-light tabular-nums ${
                    (portfolio?.pending_tasks_count ?? 0) > 0 ? "text-gold" : "text-white"
                  }`}
                >
                  {portfolio?.pending_tasks_count ?? 0}
                </p>
                <p className="mt-1 text-xs text-white/30">
                  tâche{(portfolio?.pending_tasks_count ?? 0) > 1 ? "s" : ""} ouverte{(portfolio?.pending_tasks_count ?? 0) > 1 ? "s" : ""}
                </p>
                <div className="mt-5 h-px bg-white/[0.06]" />
                <p className="mt-4 text-sm text-white/35">
                  {portfolio?.upcoming_bookings_count ?? 0} réservation{(portfolio?.upcoming_bookings_count ?? 0) > 1 ? "s" : ""} à venir
                </p>
              </div>
            </div>

            {/* Today schedule */}
            {snapshot.today && snapshot.today.length > 0 && (
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="font-display text-lg font-normal text-white/75">Programme du jour</h2>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>
                <div>
                  {snapshot.today.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-baseline gap-5 border-b border-white/[0.05] py-4 last:border-0"
                    >
                      <span className="w-16 shrink-0 text-[9px] font-bold uppercase tracking-[0.3em] text-gold/45">
                        {t.kind}
                      </span>
                      <p className="flex-1 text-sm text-white/75">
                        {t.villa_name}
                        {t.guest_name && (
                          <span className="text-white/35"> · {t.guest_name}</span>
                        )}
                      </p>
                      <span className="shrink-0 text-xs tabular-nums text-white/25">
                        {t.start_date?.slice(0, 10)} → {t.end_date?.slice(0, 10)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {snapshot.alerts && snapshot.alerts.length > 0 && (
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="font-display text-lg font-normal text-amber-200/60">Alertes</h2>
                  <div className="h-px flex-1 bg-amber-500/10" />
                </div>
                <div className="space-y-2">
                  {snapshot.alerts.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-5 py-3.5"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/50" />
                      <p className="text-sm leading-relaxed text-white/70">
                        <span className="font-semibold text-amber-200/75">{a.title}</span>
                        {a.body && <span className="text-white/40"> — {a.body}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open tasks */}
            {snapshot.tasks_open && snapshot.tasks_open.length > 0 && (
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="font-display text-lg font-normal text-white/75">Tâches ouvertes</h2>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>
                <div>
                  {snapshot.tasks_open.map((t) => (
                    <div key={t.id} className="border-b border-white/[0.05] py-5 last:border-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-gold/40">
                        {t.villa_name}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/65">{t.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick action shortcuts */}
            <div>
              <div className="mb-6 flex items-center gap-4">
                <p className="eyebrow">Accès rapides</p>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {[
                  {
                    label: "Revenus & stats",
                    sub: "KPIs financiers",
                    icon: TrendingUp,
                    prompt: "Analyse mes revenus du mois et compare avec le mois dernier",
                  },
                  {
                    label: "Check-ins du jour",
                    sub: "Arrivées · départs",
                    icon: Calendar,
                    prompt: "Quels sont mes check-ins et check-outs aujourd'hui ?",
                  },
                  {
                    label: "Tâches urgentes",
                    sub: "En retard · today",
                    icon: ListChecks,
                    prompt: "Liste mes tâches urgentes et en retard",
                  },
                  {
                    label: "Santé OTA",
                    sub: "Sync · canaux",
                    icon: Zap,
                    prompt: "Montre-moi l'état de la synchronisation OTA de mes villas",
                  },
                  {
                    label: "Soumissions",
                    sub: "Pipeline propriétaires",
                    icon: Database,
                    prompt: "Donne-moi le pipeline des soumissions de villa en attente",
                  },
                  {
                    label: "Check-up général",
                    sub: "Anomalies · alertes",
                    icon: AlertTriangle,
                    prompt: "Fais un check-up complet : y a-t-il des problèmes sur mes villas ?",
                  },
                ].map(({ label, sub, icon: Icon, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="group flex items-center gap-3.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-4 text-left transition-all hover:border-gold/20 hover:bg-gold/[0.04]"
                  >
                    <Icon
                      size={15}
                      className="shrink-0 text-gold/35 transition-colors group-hover:text-gold/60"
                    />
                    <div>
                      <p className="text-xs font-medium text-white/60 transition-colors group-hover:text-white/85">
                        {label}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/20">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Occupancy badge when in data view */}
        {activeView !== "welcome" && viewData && (
          <div className="mb-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {(viewData as { metrics?: { occupancyRate?: string } }).metrics?.occupancyRate && (
              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-gold/15 bg-gold/[0.05] px-3.5 py-2">
                <TrendingUp size={12} className="text-gold/60" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/65">
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
