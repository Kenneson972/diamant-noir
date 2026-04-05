"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Terminal, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  ListChecks, 
  Send, 
  ArrowLeft, 
  RefreshCcw,
  Zap,
  Activity,
  ChevronRight,
  Database,
  Clock,
  AlertTriangle,
  Lightbulb,
  Info,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/supabase";

// Specialized Views for Right Pane
import { StatsView } from "@/components/dashboard/assistant-views/StatsView";
import { VillasView } from "@/components/dashboard/assistant-views/VillasView";
import { BookingsView } from "@/components/dashboard/assistant-views/BookingsView";
import { MaintenanceView } from "@/components/dashboard/assistant-views/MaintenanceView";

export default function AdminAssistantPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<"welcome" | "stats" | "logistics" | "villas" | "bookings">("welcome");
  const [viewData, setViewData] = useState<any>(null);
  const [strategicAlert, setStrategicAlert] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        role: "assistant",
        content: "Système Diamant Noir Intelligence [Version 2.0.0]\nPrêt pour analyse stratégique. Que souhaitez-vous savoir ?"
      }
    ]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, sessionid: "admin-session" })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.response,
          action: data.action
        }]);

        // Handle Dynamic Visual Update (V2)
        const actionData = data.action_data || {};
        const context = actionData.context || actionData; // Fallback to root action_data
        
        // Update strategic alert if present
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
        } else if (data.action === "SHOW_TASKS" || data.action === "LIST_TASKS" || data.action === "COMPLETE_TASK") {
          setActiveView("logistics");
          setViewData(context);
        } else if (data.action === "SHOW_BOOKINGS" || data.action === "CONFIRM") {
          setActiveView("bookings");
          setViewData(context);
        } else {
          // Default data update even if action is unknown
          setViewData(context);
        }
      }
    } catch (error) {
      console.error("Assistant Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#0A0A0F] text-white">
      {/* LEFT PANE: TERMINAL */}
      <div className="flex w-[450px] flex-col border-r border-white/5 bg-[#0D0D14]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
              <Terminal size={18} />
            </div>
            <h1 className="font-display text-sm font-bold uppercase tracking-widest text-gold/80">Terminal Admin</h1>
          </div>
          <button 
            onClick={() => router.push("/dashboard/proprio")}
            className="rounded-full p-2 text-white/20 hover:bg-white/5 hover:text-white transition-all"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* Terminal Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-gold/10 text-gold border border-gold/20' 
                  : 'bg-white/5 text-white/80 font-mono border border-white/5'
              }`}>
                {m.role === 'assistant' && <span className="mb-2 block text-[10px] text-gold/40 font-bold uppercase tracking-tighter">&gt; DIAMANT_AI_INIT</span>}
                <div className="whitespace-pre-line">{m.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-gold/40 animate-pulse font-mono text-[10px] uppercase">
              <RefreshCcw size={12} className="animate-spin" />
              Calcul en cours...
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Terminal Input */}
        <div className="border-t border-white/5 bg-black/20 p-6">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="w-full rounded-xl border border-white/5 bg-white/5 py-4 pl-4 pr-12 text-sm text-white placeholder:text-white/20 focus:border-gold/40 focus:outline-none transition-all font-mono"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-gold p-2 text-navy hover:scale-105 transition-all disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
            <span className="flex items-center gap-1"><Zap size={10} /> Mode Haute Performance</span>
            <span className="h-1 w-1 rounded-full bg-white/10" />
            <span className="flex items-center gap-1"><Database size={10} /> Supabase Connecté</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: VISUAL CONTEXT */}
      <div className="flex-1 bg-[radial-gradient(circle_at_center,_#171717_0%,_#000000_100%)] p-12 overflow-y-auto custom-scrollbar">
        {/* STRATEGIC ALERT BAR */}
        {strategicAlert && (
          <div className={`mb-8 flex items-center gap-4 rounded-3xl border p-6 animate-in slide-in-from-top-4 duration-500 ${
            strategicAlert.severity === 'high' ? 'bg-rose-500/10 border-rose-500/20' : 
            strategicAlert.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 
            'bg-blue-500/10 border-blue-500/20'
          }`}>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
              strategicAlert.severity === 'high' ? 'bg-rose-500/20 text-rose-500' : 
              strategicAlert.severity === 'medium' ? 'bg-amber-500/20 text-amber-500' : 
              'bg-blue-500/20 text-blue-500'
            }`}>
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Alerte Stratégique - Sévérité {strategicAlert.severity}</p>
              <p className="text-sm font-bold text-white">{strategicAlert.description}</p>
            </div>
            {strategicAlert.severity === 'high' && (
              <div className="px-4 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Action Requise
              </div>
            )}
          </div>
        )}

        {/* SMART INSIGHTS BAR (Quick Metrics) */}
        {activeView !== "welcome" && viewData && (
          <div className="mb-8 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {viewData.metrics?.occupancyRate && (
              <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-gold/10 border border-gold/20 px-4 py-3">
                <Activity size={16} className="text-gold" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold/80">
                  {viewData.metrics.occupancyRate}% Occupation
                </span>
              </div>
            )}
            {viewData.metrics?.revPAR && (
              <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                <TrendingUp size={16} className="text-white/60" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                  €{viewData.metrics.revPAR} RevPAR
                </span>
              </div>
            )}
            {viewData.insights?.isHighSeason && (
              <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                <Sparkles size={16} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                  Haute Saison Détectée
                </span>
              </div>
            )}
          </div>
        )}

        {activeView === "welcome" && (
          <div className="flex h-full flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-gold/20 animate-pulse"></div>
              <Sparkles className="relative text-gold h-20 w-20" />
            </div>
            <div className="space-y-4 max-w-xl">
              <h2 className="font-display text-5xl text-white">Hub Intelligence V2</h2>
              <p className="text-white/40 leading-relaxed uppercase tracking-[0.2em] text-xs">
                Votre directeur de stratégie IA proactif pour Diamant Noir. 
                Analyse, détection d'anomalies et croissance.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-12">
              <button 
                onClick={() => setInput("Analyse mes revenus et mon occupation")}
                className="flex items-center gap-4 rounded-3xl border border-white/5 bg-white/5 p-6 hover:bg-white/10 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-2xl bg-gold/10 text-gold flex items-center justify-center group-hover:scale-110 transition-all">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Analyse Stratégique</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">KPIs & Revenus</p>
                </div>
              </button>
              <button 
                onClick={() => setInput("Y a-t-il des problèmes sur mes villas ?")}
                className="flex items-center gap-4 rounded-3xl border border-white/5 bg-white/5 p-6 hover:bg-white/10 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-all">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Check-up Santé</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Villas & Maintenance</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeView === "stats" && <StatsView data={viewData} />}
        {activeView === "villas" && <VillasView data={viewData} />}
        {activeView === "bookings" && <BookingsView data={viewData} />}
        {activeView === "logistics" && <MaintenanceView data={viewData} />}
      </div>
    </main>
  );
}
