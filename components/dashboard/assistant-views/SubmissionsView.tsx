"use client";

import { Database, CheckCircle2, Clock, Eye, FileText, ImageOff } from "lucide-react";

type Submission = {
  id: string;
  owner_name?: string;
  villa_name?: string;
  status?: string;
  created_at?: string;
  has_photos?: boolean;
  notes?: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  received: { label: "Reçue", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  examining: { label: "En examen", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  visit: { label: "Visite programmée", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  contract: { label: "Contrat", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  approved: { label: "Approuvée", color: "text-gold bg-gold/10 border-gold/20" },
  rejected: { label: "Refusée", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
};

function fmtDate(s?: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" });
}

export function SubmissionsView({ data }: { data: any }) {
  const submissions: Submission[] = data?.submissions || [];
  const summary = data?.submissions_summary || {};

  const pipelineOrder = ["received", "examining", "visit", "contract", "approved"];

  const pipeline = pipelineOrder.map((status) => ({
    status,
    cfg: STATUS_CONFIG[status] || { label: status, color: "text-white/60 bg-white/5 border-white/10" },
    count: submissions.filter((s) => s.status === status).length,
  }));

  const needsPhotos = submissions.filter((s) => s.has_photos === false);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-3xl text-white">Soumissions propriétaires</h3>
          <p className="text-sm text-white/40">Pipeline de prospection · villas à intégrer</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-purple-400">
          <Database size={14} /> Pipeline
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Total reçues</p>
          <p className="font-display text-2xl text-white">{summary.total ?? submissions.length}</p>
        </div>
        <div className="rounded-3xl border border-blue-400/10 bg-blue-400/5 p-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-400/60">Nouvelles</p>
          <p className="font-display text-2xl text-blue-400">{summary.received ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-amber-400/10 bg-amber-400/5 p-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-400/60">En cours</p>
          <p className="font-display text-2xl text-amber-400">{summary.in_progress ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-gold/20 bg-gold/5 p-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold/60">Approuvées</p>
          <p className="font-display text-2xl text-gold">{summary.approved ?? 0}</p>
        </div>
      </div>

      {/* Pipeline visuel */}
      <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6">
        <h4 className="mb-5 text-[10px] font-bold uppercase tracking-widest text-white/40">Étapes du pipeline</h4>
        <div className="flex flex-wrap items-center gap-2">
          {pipeline.map((step, i) => (
            <div key={step.status} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${step.cfg.color}`}>
                {step.count > 0 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current/20 text-[10px] font-black">
                    {step.count}
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-current opacity-30" />
                )}
                {step.cfg.label}
              </div>
              {i < pipeline.length - 1 && (
                <span className="text-white/15">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alerte photos manquantes */}
      {needsPhotos.length > 0 && (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-6">
          <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-400">
            <ImageOff size={14} /> Photos manquantes ({needsPhotos.length})
          </h4>
          <ul className="space-y-2">
            {needsPhotos.map((s) => (
              <li key={s.id} className="text-sm text-white/70">
                <span className="font-bold">{s.villa_name || s.owner_name || s.id.slice(0, 8)}</span>
                {s.owner_name && s.villa_name ? ` · ${s.owner_name}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Liste récente */}
      {submissions.length > 0 && (
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6">
          <h4 className="mb-4 flex items-center gap-2 font-display text-lg text-white">
            <FileText className="text-gold" size={18} /> Soumissions récentes
          </h4>
          <ul className="space-y-3">
            {submissions.slice(0, 8).map((s) => {
              const cfg = STATUS_CONFIG[s.status || ""] || STATUS_CONFIG["received"];
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-3 text-sm last:border-0 last:pb-0"
                >
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <span className="font-bold text-white/80">
                    {s.villa_name || s.owner_name || `#${s.id.slice(0, 6)}`}
                  </span>
                  {s.owner_name && s.villa_name && (
                    <span className="text-xs text-white/40">{s.owner_name}</span>
                  )}
                  {s.has_photos === false && (
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      Sans photos
                    </span>
                  )}
                  <span className="ml-auto text-xs text-white/25">{fmtDate(s.created_at)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {submissions.length === 0 && (
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-10 text-center">
          <CheckCircle2 size={36} className="mx-auto mb-4 text-white/20" />
          <p className="text-sm text-white/40">Aucune soumission propriétaire pour le moment.</p>
        </div>
      )}
    </div>
  );
}
