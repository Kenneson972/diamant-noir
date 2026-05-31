"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { X, Plus } from "lucide-react";

interface CreateBookingModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateBookingModal({ open, onClose, onCreated }: CreateBookingModalProps) {
  const supabase = getSupabaseBrowser();
  const [villas, setVillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    villa_id: "",
    guest_name: "",
    guest_email: "",
    start_date: "",
    end_date: "",
    total_price_cents: "",
    status: "confirmed",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !supabase) return;
    (async () => {
      const { data } = await supabase.from("villas").select("id, name, price_per_night").order("name");
      setVillas(data ?? []);
    })();
  }, [open, supabase]);

  // Auto-calculer le prix quand dates ou villa changent
  useEffect(() => {
    if (!form.start_date || !form.end_date || !form.villa_id) {
      setForm((f) => ({ ...f, total_price_cents: "" }));
      return;
    }
    const villa = villas.find((v) => v.id === form.villa_id);
    if (!villa?.price_per_night) return;
    const nights = Math.round(
      (new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000
    );
    if (nights > 0) {
      setForm((f) => ({ ...f, total_price_cents: String(nights * villa.price_per_night * 100) }));
    }
  }, [form.start_date, form.end_date, form.villa_id, villas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    setLoading(true);

    if (!form.villa_id || !form.guest_name || !form.start_date || !form.end_date) {
      setError("Veuillez remplir tous les champs obligatoires.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("bookings").insert({
      villa_id: form.villa_id,
      guest_name: form.guest_name,
      guest_email: form.guest_email || null,
      start_date: form.start_date,
      end_date: form.end_date,
      total_price_cents: parseInt(form.total_price_cents) || 0,
      status: form.status,
      source: "manual",
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      onCreated();
      onClose();
      setForm({ villa_id: "", guest_name: "", guest_email: "", start_date: "", end_date: "", total_price_cents: "", status: "confirmed" });
    }
    setLoading(false);
  };

  if (!open) return null;

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy/[0.06]">
          <h2 className="text-lg font-semibold text-navy">Nouvelle réservation</h2>
          <button onClick={onClose} className="text-navy/30 hover:text-navy">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Villa */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50 block mb-1">
              Villa *
            </label>
            <select
              value={form.villa_id}
              onChange={(e) => set("villa_id", e.target.value)}
              className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
              required
            >
              <option value="">Sélectionner une villa...</option>
              {villas.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Client */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50 block mb-1">
                Nom du client *
              </label>
              <input
                type="text"
                value={form.guest_name}
                onChange={(e) => set("guest_name", e.target.value)}
                placeholder="Jean Dupont"
                className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50 block mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.guest_email}
                onChange={(e) => set("guest_email", e.target.value)}
                placeholder="jean@exemple.fr"
                className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50 block mb-1">
                Arrivée *
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50 block mb-1">
                Départ *
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => set("end_date", e.target.value)}
                className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
                required
              />
            </div>
          </div>

          {/* Prix */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50 block mb-1">
              Prix total (€)
            </label>
            <input
              type="number"
              value={form.total_price_cents ? String(Number(form.total_price_cents) / 100) : ""}
              onChange={(e) => set("total_price_cents", e.target.value ? String(Math.round(parseFloat(e.target.value) * 100)) : "")}
              placeholder="Auto-calculé si vide"
              className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
            />
          </div>

          {/* Statut */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50 block mb-1">
              Statut
            </label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
            >
              <option value="confirmed">Confirmée</option>
              <option value="pending">En attente</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white hover:bg-gold/90 disabled:opacity-50"
            >
              <Plus size={16} />
              {loading ? "Création..." : "Créer la réservation"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-navy/50 hover:text-navy border border-navy/10 rounded-xl"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
