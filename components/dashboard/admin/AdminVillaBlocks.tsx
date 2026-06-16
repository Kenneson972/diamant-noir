"use client";

import { useState, useEffect } from "react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { Loader2, Plus, Trash2, Calendar } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase";

type DateBlock = {
  id: string;
  villa_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  origin: string | null;
  created_by: string | null;
};

interface Props {
  villaId: string;
}

export function AdminVillaBlocks({ villaId }: Props) {
  const [blocks, setBlocks] = useState<DateBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  // Form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    // Fetch admin userId and blocks in parallel
    const fetchAll = async () => {
      const [sessionResult, blocksResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from("villa_date_blocks")
          .select("id, villa_id, start_date, end_date, reason, origin, created_by")
          .eq("villa_id", villaId)
          .order("start_date", { ascending: true }),
      ]);

      const userId = sessionResult.data.session?.user?.id ?? null;
      setAdminUserId(userId);
      setBlocks(blocksResult.data ?? []);
      setLoading(false);
    };

    fetchAll();
  }, [villaId]);

  const handleAdd = async () => {
    if (!startDate || !endDate) {
      setError("Les dates de début et de fin sont requises.");
      return;
    }
    if (startDate > endDate) {
      setError("La date de début doit être antérieure ou égale à la date de fin.");
      return;
    }
    if (!adminUserId) {
      setError("Session expirée. Rechargez la page.");
      return;
    }

    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setSaving(false);
      return;
    }

    const { data, error: insertErr } = await supabase
      .from("villa_date_blocks")
      .insert({
        villa_id: villaId,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || null,
        origin: "Kayvila",
        created_by: adminUserId,
      })
      .select("id, villa_id, start_date, end_date, reason, origin, created_by")
      .single();

    if (insertErr || !data) {
      setError(insertErr?.message ?? "Erreur lors de la création du blocage.");
    } else {
      setBlocks((prev) =>
        [...prev, data as DateBlock].sort((a, b) =>
          a.start_date.localeCompare(b.start_date)
        )
      );
      setStartDate("");
      setEndDate("");
      setReason("");
    }
    setSaving(false);
  };

  const handleDelete = async (blockId: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const { error: deleteErr } = await supabase
      .from("villa_date_blocks")
      .delete()
      .eq("id", blockId);
    if (deleteErr) {
      setError("Erreur lors de la suppression du blocage.");
      return;
    }
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const today = startOfDay(new Date());

  return (
    <div className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm space-y-6">
      <h3 className="font-display-dashboard text-base font-semibold text-navy">
        Blocages de disponibilités
      </h3>

      {/* Add block form */}
      <div className="rounded-xl border border-navy/10 bg-navy/[0.02] p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy/50">
          Créer un blocage Kayvila
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="block-start"
              className="mb-1 block text-xs font-medium text-navy"
            >
              Date de début
            </label>
            <input
              id="block-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
          </div>
          <div>
            <label
              htmlFor="block-end"
              className="mb-1 block text-xs font-medium text-navy"
            >
              Date de fin
            </label>
            <input
              id="block-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="block-reason"
            className="mb-1 block text-xs font-medium text-navy"
          >
            Motif (optionnel)
          </label>
          <input
            id="block-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. travaux, entretien, événement…"
            className="w-full rounded-xl border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {saving ? "Création…" : "Ajouter le blocage"}
        </button>
      </div>

      {/* Block list */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-navy/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement…
        </div>
      ) : blocks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Calendar className="h-8 w-8 text-navy opacity-30" aria-hidden />
          <p className="text-sm text-navy/40">Aucun blocage enregistré.</p>
        </div>
      ) : (
        <div className="divide-y divide-navy/5 overflow-hidden rounded-xl border border-navy/10">
          {blocks.map((block) => {
            const isPast = isBefore(parseISO(block.end_date), today);
            return (
              <div
                key={block.id}
                className={[
                  "flex items-center justify-between px-4 py-3 transition-colors hover:bg-offwhite",
                  isPast ? "opacity-50" : "",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-navy">
                      {format(parseISO(block.start_date), "dd/MM/yyyy")} →{" "}
                      {format(parseISO(block.end_date), "dd/MM/yyyy")}
                    </span>
                    {block.origin && (
                      <span
                        className={[
                          "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          block.origin === "Kayvila"
                            ? "bg-gold/15 text-gold"
                            : "bg-navy/10 text-navy/70",
                        ].join(" ")}
                      >
                        {block.origin}
                      </span>
                    )}
                  </div>
                  {block.reason && (
                    <p className="mt-0.5 text-xs text-navy/50">
                      Motif : {block.reason}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(block.id)}
                  className="ml-4 shrink-0 rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Supprimer ce blocage"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
