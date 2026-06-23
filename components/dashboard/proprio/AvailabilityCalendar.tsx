"use client";

import { useState } from "react";
import {
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
  startOfDay,
  isWithinInterval,
  parseISO,
  isEqual,
  subDays,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase";

export type DateBlock = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  origin: string | null;
};

export type BookedRange = {
  id: string;
  start_date: string;
  end_date: string;
};

type Props = {
  villaId: string;
  userId: string;
  initialBlocks: DateBlock[];
  initialBookings: BookedRange[];
};

type DayStatus = "available" | "booked" | "blocked" | "past";

function getDayStatus(
  date: Date,
  blocks: DateBlock[],
  bookings: BookedRange[]
): DayStatus {
  const today = startOfDay(new Date());
  if (isBefore(date, today)) return "past";
  const d = startOfDay(date);
  for (const b of bookings) {
    // end_date est le jour de départ (exclu de la plage occupée, comme la RPC '[)')
    if (
      isWithinInterval(d, {
        start: parseISO(b.start_date),
        end: subDays(parseISO(b.end_date), 1),
      })
    )
      return "booked";
  }
  for (const b of blocks) {
    if (
      isWithinInterval(d, {
        start: parseISO(b.start_date),
        end: subDays(parseISO(b.end_date), 1),
      })
    )
      return "blocked";
  }
  return "available";
}

const STATUS_CLASSES: Record<DayStatus, string> = {
  available:
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer",
  booked: "bg-red-100 text-red-800 cursor-default",
  blocked: "bg-navy text-white hover:bg-navy/80 cursor-pointer",
  past: "bg-white text-navy/50 cursor-default",
};

export function AvailabilityCalendar({
  villaId,
  userId,
  initialBlocks,
  initialBookings,
}: Props) {
  const [baseMonth, setBaseMonth] = useState(startOfMonth(new Date()));
  const [blocks, setBlocks] = useState<DateBlock[]>(initialBlocks);
  const [selectStart, setSelectStart] = useState<Date | null>(null);
  const [modal, setModal] = useState<{ start: Date; end: Date } | null>(null);
  const [editBlock, setEditBlock] = useState<DateBlock | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const months = [
    baseMonth,
    addMonths(baseMonth, 1),
    addMonths(baseMonth, 2),
  ];

  const handleDayClick = (
    date: Date,
    status: DayStatus,
    block?: DateBlock
  ) => {
    if (status === "past" || status === "booked") return;
    if (status === "blocked" && block) {
      setEditBlock(block);
      setReason(block.reason ?? "");
      return;
    }
    if (!selectStart) {
      setSelectStart(date);
      return;
    }
    const start = isBefore(selectStart, date) ? selectStart : date;
    const end = isBefore(selectStart, date) ? date : selectStart;
    setModal({ start, end });
    setSelectStart(null);
  };

  const handleSaveBlock = async () => {
    if (!modal) return;
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setSaving(false);
      return;
    }

    const { data: conflicts } = await supabase.rpc("check_booking_conflict", {
      p_villa_id: villaId,
      p_start: format(modal.start, "yyyy-MM-dd"),
      p_end: format(modal.end, "yyyy-MM-dd"),
    });

    if ((conflicts ?? 0) > 0) {
      setError(
        `${conflicts} réservation(s) confirmée(s) sur cette période — blocage impossible.`
      );
      setSaving(false);
      return;
    }

    const { data, error: insertErr } = await supabase
      .from("villa_date_blocks")
      .insert({
        villa_id: villaId,
        start_date: format(modal.start, "yyyy-MM-dd"),
        end_date: format(modal.end, "yyyy-MM-dd"),
        reason: reason.trim() || null,
        origin: "Propriétaire",
        created_by: userId,
      })
      .select()
      .single();

    if (insertErr || !data) {
      setError("Erreur lors du blocage.");
    } else {
      setBlocks((prev) => [...prev, data as DateBlock]);
      setModal(null);
      setReason("");
    }
    setSaving(false);
  };

  const handleDeleteBlock = async (blockId: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const { error: deleteErr } = await supabase
      .from("villa_date_blocks")
      .delete()
      .eq("id", blockId);
    if (deleteErr) {
      setError("Erreur lors de la suppression du blocage");
      return;
    }
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setEditBlock(null);
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setBaseMonth((m) => addMonths(m, -1))}
          className="rounded-lg p-2 hover:bg-navy/5 transition-colors"
        >
          <ChevronLeft size={18} className="text-navy/80" />
        </button>
        <span className="text-sm font-medium text-navy capitalize">
          {format(baseMonth, "MMMM yyyy", { locale: fr })}
        </span>
        <button
          onClick={() => setBaseMonth((m) => addMonths(m, 1))}
          className="rounded-lg p-2 hover:bg-navy/5 transition-colors"
        >
          <ChevronRight size={18} className="text-navy/80" />
        </button>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 text-xs">
        {[
          { color: "bg-emerald-100", label: "Disponible" },
          { color: "bg-red-100", label: "Réservé" },
          { color: "bg-navy", label: "Bloqué" },
          { color: "bg-white border border-navy/10", label: "Passé" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded ${l.color}`} />
            <span className="text-navy/80">{l.label}</span>
          </span>
        ))}
        {selectStart && (
          <span className="text-xs font-medium text-gold">
            Début : {format(selectStart, "dd/MM")} — cliquez la date de fin
          </span>
        )}
      </div>

      {/* Grilles de mois */}
      <div className="grid gap-6 md:grid-cols-3">
        {months.map((month) => {
          const days = eachDayOfInterval({
            start: startOfMonth(month),
            end: endOfMonth(month),
          });
          const firstDow = (startOfMonth(month).getDay() + 6) % 7;
          return (
            <div key={month.toISOString()}>
              <p className="mb-2 text-center text-xs font-semibold text-navy capitalize">
                {format(month, "MMMM yyyy", { locale: fr })}
              </p>
              <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-navy/60">
                {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDow }).map((_, i) => (
                  <span key={`pad-${i}`} />
                ))}
                {days.map((day) => {
                  const d = startOfDay(day);
                  const status = getDayStatus(d, blocks, initialBookings);
                  const blockForDay = blocks.find((b) =>
                    isWithinInterval(d, {
                      start: parseISO(b.start_date),
                      end: parseISO(b.end_date),
                    })
                  );
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleDayClick(d, status, blockForDay)}
                      className={[
                        "rounded py-1 text-[11px] transition-colors",
                        STATUS_CLASSES[status],
                        selectStart && isEqual(startOfDay(day), startOfDay(selectStart))
                          ? "ring-1 ring-gold"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tableau blocages futurs */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-navy">Blocages à venir</h3>
        {blocks.filter(
          (b) => !isBefore(parseISO(b.end_date), startOfDay(new Date()))
        ).length === 0 ? (
          <p className="text-sm text-navy/60">Aucun blocage programmé.</p>
        ) : (
          <div className="divide-y divide-navy/5 overflow-hidden rounded-xl border border-navy/10">
            {blocks
              .filter(
                (b) =>
                  !isBefore(parseISO(b.end_date), startOfDay(new Date()))
              )
              .sort((a, b) => a.start_date.localeCompare(b.start_date))
              .map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between bg-white px-4 py-3 transition-colors hover:bg-offwhite"
                >
                  <div>
                    <div className="flex items-center gap-2">
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
                    onClick={() => handleDeleteBlock(block.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modale création blocage */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-navy">
              Bloquer du {format(modal.start, "dd/MM")} au{" "}
              {format(modal.end, "dd/MM/yyyy")}
            </h2>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            <label className="mt-4 block">
              <span className="text-xs font-medium text-navy/70">
                Motif (optionnel)
              </span>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex. usage personnel, travaux…"
                className="mt-1 w-full rounded-lg border border-navy/10 px-3 py-2 text-sm text-navy focus:border-gold/50 focus:outline-none"
              />
            </label>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setError("");
                }}
                className="flex-1 rounded-lg border border-navy/10 py-2 text-sm text-navy"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveBlock}
                disabled={saving}
                className="flex-1 rounded-lg bg-navy py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Confirmer le blocage"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale édition blocage existant */}
      {editBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-navy">
              Blocage existant
            </h2>
            <p className="mt-2 text-sm text-navy/80">
              {format(parseISO(editBlock.start_date), "dd/MM/yyyy")} →{" "}
              {format(parseISO(editBlock.end_date), "dd/MM/yyyy")}
            </p>
            {editBlock.reason && (
              <p className="mt-1 text-xs text-navy/50">
                Motif : {editBlock.reason}
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setEditBlock(null)}
                className="flex-1 rounded-lg border border-navy/10 py-2 text-sm text-navy"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBlock(editBlock.id)}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white"
              >
                Supprimer ce blocage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
