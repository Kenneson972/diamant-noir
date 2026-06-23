"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { getSupabaseBrowser } from "@/lib/supabase";

const SUBJECTS = [
  { value: "reversement", label: "Reversement / Facturation" },
  { value: "disponibilites", label: "Disponibilités" },
  { value: "contrat", label: "Mon contrat" },
  { value: "autre", label: "Autre" },
] as const;

type Subject = (typeof SUBJECTS)[number]["value"];

interface Props {
  ownerId: string;
  villas: { id: string; name: string }[];
}

export function OwnerContactFAB({ ownerId, villas }: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<Subject>("reversement");
  const [villaId, setVillaId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (message.trim().length < 10) {
      setError("Message trop court (minimum 10 caractères).");
      return;
    }
    setSending(true);
    setError("");

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setSending(false);
      return;
    }

    // Rate limit : max 5 messages / heure
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabase
      .from("owner_contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 5) {
      setError("Limite de 5 messages par heure atteinte. Réessayez plus tard.");
      setSending(false);
      return;
    }

    const { error: insertErr } = await supabase
      .from("owner_contact_messages")
      .insert({
        owner_id: ownerId,
        villa_id: villaId || null,
        subject,
        message: message.trim(),
      });

    if (insertErr) {
      setError("Erreur lors de l'envoi. Veuillez réessayer.");
      setSending(false);
      return;
    }

    // Déclencher l'edge function (fire-and-forget)
    supabase.functions
      .invoke("send-owner-contact", {
        body: {
          ownerId,
          villaId: villaId || null,
          subject,
          message: message.trim(),
        },
      })
      .catch(() => {});

    setSuccess(true);
    setSending(false);

    setTimeout(() => {
      setSuccess(false);
      setOpen(false);
      setMessage("");
      setSubject("reversement");
      setVillaId("");
    }, 3000);
  };

  return (
    <>
      {/* Bouton FAB bas-droite */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-6 z-40 flex items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-navy/90"
        aria-label="Contacter Kayvila"
      >
        <KayvilaPngIcon name="mail" size={20} />
        <span className="hidden sm:inline">Contacter Kayvila</span>
      </button>

      {/* Overlay modale */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-base font-semibold text-navy">
              Contacter Kayvila
            </h2>

            {success ? (
              <p className="py-8 text-center text-sm text-emerald-600">
                ✓ Votre message a bien été envoyé. Nous vous répondrons sous 48h.
              </p>
            ) : (
              <div className="space-y-4">
                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-navy/70">
                    Objet
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as Subject)}
                    className="w-full rounded-lg border border-navy/10 px-3 py-2 text-sm text-navy focus:border-gold/50 focus:outline-none"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {villas.length > 0 && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy/70">
                      Villa concernée (optionnel)
                    </label>
                    <select
                      value={villaId}
                      onChange={(e) => setVillaId(e.target.value)}
                      className="w-full rounded-lg border border-navy/10 px-3 py-2 text-sm text-navy focus:border-gold/50 focus:outline-none"
                    >
                      <option value="">Aucune villa spécifique</option>
                      {villas.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-navy/70">
                    Message{" "}
                    <span className="text-navy/60">({message.length}/2000)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) =>
                      setMessage(e.target.value.slice(0, 2000))
                    }
                    rows={4}
                    placeholder="Décrivez votre demande…"
                    className="w-full resize-none rounded-lg border border-navy/10 px-3 py-2 text-sm text-navy focus:border-gold/50 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-navy/10 py-2.5 text-sm text-navy"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={sending || message.trim().length < 10}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-navy py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
                  >
                    <Send size={16} strokeWidth={1.5} aria-hidden />
                    {sending ? "Envoi…" : "Envoyer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
