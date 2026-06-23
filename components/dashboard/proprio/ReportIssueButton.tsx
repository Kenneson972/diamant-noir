"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { AlertTriangle, Send } from "lucide-react";

const ISSUE_TYPES = [
  "Plomberie", "Électricité", "Clim", "Piscine", "Jardin", "Ménage", "Autre"
] as const;

const PRIORITIES = ["Normal", "Urgent"] as const;

interface ReportIssueButtonProps {
  villaId: string;
  userId: string;
}

export function ReportIssueButton({ villaId, userId }: ReportIssueButtonProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("Plomberie");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("Normal");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Veuillez décrire le problème.");
      return;
    }
    setError("");
    setSending(true);

    const supabase = getSupabaseBrowser();
    if (!supabase) { setSending(false); return; }

    const { error: insertErr } = await supabase.from("tasks").insert({
      villa_id: villaId,
      title: type,
      description: description.trim(),
      status: "pending",
      assigned_to: priority === "Urgent" ? "admin" : null,
    });

    if (insertErr) {
      setError("Erreur lors du signalement. Veuillez réessayer.");
      setSending(false);
      return;
    }

    // Try to notify admin via fetch (non-blocking)
    try {
      await fetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "owner_issue_reported",
          villa_id: villaId,
          issue_type: type,
          description: description.trim(),
          priority,
          reported_by: userId,
        }),
      });
    } catch { /* non-blocking */ }

    setSuccess(true);
    setSending(false);
    setTimeout(() => { setOpen(false); setSuccess(false); setDescription(""); }, 2500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
      >
        <AlertTriangle size={16} strokeWidth={1.5} />
        Signaler un problème
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-navy">Signaler un problème</h3>

            {success ? (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Signalement envoyé. L&apos;équipe Kayvila vous contactera rapidement.
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.1em] text-navy/50 block mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border border-navy/10 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.1em] text-navy/50 block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Décrivez le problème rencontré..."
                    className="w-full border border-navy/10 rounded-lg px-3 py-2 text-sm resize-none transition-colors focus:outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.1em] text-navy/50 block mb-1">Priorité</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-navy/10 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-navy/10 px-4 py-2 text-sm text-navy/80 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={sending}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
                  >
                    <Send size={16} strokeWidth={1.5} />
                    {sending ? "Envoi..." : "Envoyer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
