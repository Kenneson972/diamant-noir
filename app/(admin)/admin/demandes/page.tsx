"use client";

import { useState, useEffect, useMemo } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Check, X, MessageCircle, Clock, UserCheck } from "lucide-react";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_STYLES } from "@/lib/constants";
import { KayvilaEmptyState } from "@/components/ui/pro";
import { getSlaStatus } from "@/lib/sla";
import { timeAgo, cn } from "@/lib/utils";

const SLA_LEVEL_COLOR = {
  ok: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  over: "bg-red-50 text-red-700",
} as const;

export default function AdminDemandesPage() {
  const supabase = getSupabaseBrowser();
  const [requests, setRequests] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("pending");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const members = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", ["admin", "proprio", "owner"]);
      setTeamMembers(members.data ?? []);
    })();
  }, [supabase]);

  const fetchRequests = async () => {
    if (!supabase) return;
    const query = supabase
      .from("requests")
      .select("id, type, status, message, admin_response, created_at, booking_id, guest_id, assignee_id, priority, taken_at, resolved_at, bookings(villa_id, villas!bookings_villa_id_fkey(name), guest_name, start_date, end_date)")
      .order("created_at", { ascending: true });
    if (filter !== "all") query.eq("status", filter);
    const { data } = await query;
    setRequests(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [supabase, filter]);

  const sortedRequests = useMemo(() => {
    const rank = (r: any) => {
      const sla = getSlaStatus({ createdAt: r.created_at, priority: r.priority ?? "standard", resolvedAt: r.resolved_at });
      if (sla.level === "over") return 0;
      if (r.priority === "urgent" && !r.resolved_at) return 1;
      if (sla.level === "warn") return 2;
      return 3;
    };
    return [...requests].sort((a, b) => rank(a) - rank(b) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [requests]);

  const handleAction = async (id: string, status: string, guestId?: string, requestType?: string) => {
    if (!supabase) return;
    setActionError(null);
    const resp = responseText[id] ?? "";
    const { error: updateError } = await supabase
      .from("requests")
      .update({
        status,
        admin_response: resp || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      setActionError(updateError.message);
      return;
    }

    if (guestId) {
      const statusLabel = status === "resolved" ? "résolue" : status === "rejected" ? "refusée" : "prise en charge";
      const typeLabel = REQUEST_TYPE_LABELS[requestType ?? ""] ?? requestType ?? "Demande";
      await supabase.from("notifications").insert({
        user_id: guestId,
        type: "request_update",
        title: `Demande ${statusLabel}`,
        body: `Votre demande "${typeLabel}" a été ${statusLabel}.${resp ? ` Réponse : ${resp}` : ""}`,
        action_url: "/espace-client/demandes",
      });
    }

    setResponseText((prev) => { const n = { ...prev }; delete n[id]; return n; });
    fetchRequests();
  };

  const handleAssign = async (requestId: string, assigneeId: string) => {
    if (!supabase) return;
    setActionError(null);
    const { error } = await supabase
      .from("requests")
      .update({
        assignee_id: assigneeId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    if (error) {
      setActionError(error.message);
      return;
    }
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Demandes voyageurs</h1>
        <p className="text-sm text-navy/50 mt-1">Gérez les demandes des voyageurs en temps réel</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["pending", "in_progress", "resolved", "rejected", "all"].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] rounded-full transition-colors ${filter === f ? "bg-navy text-white" : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"}`}>
            {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "in_progress" ? "En cours" : f === "resolved" ? "Résolus" : "Refusés"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-navy/55">Chargement...</p>
      ) : requests.length === 0 ? (
        <KayvilaEmptyState
          icon={<MessageCircle className="size-12" />}
          title="Aucune demande"
          description="Les demandes voyageurs (conciergerie, services) apparaîtront ici."
        />
      ) : (
        <div className="space-y-4">
          {sortedRequests.map((r) => {
            const sla = getSlaStatus({ createdAt: r.created_at, priority: r.priority ?? "standard", resolvedAt: r.resolved_at });
            return (
              <div key={r.id} className="border border-navy/10 bg-white p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">{REQUEST_TYPE_LABELS[r.type] ?? r.type}</span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${REQUEST_STATUS_STYLES[r.status] ?? "bg-gray-50 text-gray-600"}`}>
                        {r.status === "pending" ? "En attente" : r.status === "in_progress" ? "En cours" : r.status === "resolved" ? "Résolu" : r.status}
                      </span>
                      {r.priority === "urgent" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                          ⚡ URGENT
                        </span>
                      )}
                      {/* SLA Badge */}
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", SLA_LEVEL_COLOR[sla.level])}>
                        <Clock size={10} />
                        {timeAgo(r.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-navy">
                      {r.bookings?.villas?.name ?? "Villa"} — {r.bookings?.guest_name ?? "Voyageur"}
                    </p>
                    {r.bookings?.start_date && (
                      <p className="text-[11px] text-navy/55 mt-0.5">
                        {new Date(r.bookings.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} → {new Date(r.bookings.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-navy/30 block">
                      {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {/* Assignation */}
                    <div className="mt-1.5">
                      <select
                        value={r.assignee_id ?? ""}
                        onChange={(e) => handleAssign(r.id, e.target.value)}
                        className="min-h-[44px] rounded-full border border-navy/10 bg-white px-3 py-2 text-[10px] text-navy/60 focus:border-gold/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                      >
                        <option value="">Non assigné</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name ?? m.email}
                          </option>
                        ))}
                      </select>
                      {r.assignee_id && (
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <UserCheck size={10} className="text-gold" />
                          <span className="text-[9px] text-gold">
                            {teamMembers.find((m) => m.id === r.assignee_id)?.full_name ??
                             teamMembers.find((m) => m.id === r.assignee_id)?.email ??
                             "Assigné"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-navy/70 mb-3 bg-navy/[0.02] p-3">{r.message}</p>
                {r.admin_response && (
                  <div className="mb-3 border-l-2 border-gold/30 pl-3">
                    <p className="text-[11px] font-semibold text-gold mb-1">Réponse</p>
                    <p className="text-sm text-navy/60">{r.admin_response}</p>
                  </div>
                )}
                {r.status === "pending" || r.status === "in_progress" ? (
                  <div className="space-y-2">
                    <textarea
                      value={responseText[r.id] ?? ""}
                      onChange={(e) => setResponseText((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Réponse (optionnelle)..."
                      rows={2}
                      className="w-full resize-none border border-navy/15 bg-white px-3 py-2 text-sm focus:border-gold/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(r.id, "resolved", r.guest_id, r.type)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full hover:bg-emerald-100 transition-colors">
                        <Check size={14} /> Résoudre
                      </button>
                      <button onClick={() => handleAction(r.id, "rejected", r.guest_id, r.type)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 text-[11px] font-semibold rounded-full hover:bg-red-100 transition-colors">
                        <X size={14} /> Refuser
                      </button>
                      {r.status !== "in_progress" && (
                        <button onClick={() => handleAction(r.id, "in_progress", r.guest_id, r.type)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-full hover:bg-blue-100 transition-colors">
                          <MessageCircle size={14} /> En cours
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
