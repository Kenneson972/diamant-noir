"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Plus, Trash2, Calendar, Euro, Tag, Save } from "lucide-react";

interface SeasonalRate {
  id: string;
  villa_id: string;
  label: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  created_at: string;
}

export function SeasonalRatesManager() {
  const supabase = getSupabaseBrowser();
  const [villas, setVillas] = useState<any[]>([]);
  const [selectedVilla, setSelectedVilla] = useState<string>("");
  const [rates, setRates] = useState<SeasonalRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Nouveau tarif
  const [newRate, setNewRate] = useState({
    label: "",
    start_date: "",
    end_date: "",
    price_per_night: "",
  });

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data } = await supabase.from("villas").select("id, name, price_per_night").order("name");
      setVillas(data ?? []);
    })();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !selectedVilla) { setRates([]); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("seasonal_rates")
        .select("*")
        .eq("villa_id", selectedVilla)
        .order("start_date", { ascending: true });
      setRates(data ?? []);
      setLoading(false);
    })();
  }, [supabase, selectedVilla]);

  const handleAdd = async () => {
    if (!supabase || !selectedVilla) return;
    setError("");
    setSaving(true);

    if (!newRate.label || !newRate.start_date || !newRate.end_date || !newRate.price_per_night) {
      setError("Tous les champs sont obligatoires.");
      setSaving(false);
      return;
    }

    if (newRate.end_date < newRate.start_date) {
      setError("La date de fin doit être après la date de début.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("seasonal_rates").insert({
      villa_id: selectedVilla,
      label: newRate.label,
      start_date: newRate.start_date,
      end_date: newRate.end_date,
      price_per_night: parseInt(newRate.price_per_night),
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setNewRate({ label: "", start_date: "", end_date: "", price_per_night: "" });
      // Recharger les tarifs
      const { data } = await supabase
        .from("seasonal_rates")
        .select("*")
        .eq("villa_id", selectedVilla)
        .order("start_date", { ascending: true });
      setRates(data ?? []);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    await supabase.from("seasonal_rates").delete().eq("id", id);
    setRates((prev) => prev.filter((r) => r.id !== id));
  };

  const selectedVillaData = villas.find((v) => v.id === selectedVilla);
  const basePrice = selectedVillaData?.price_per_night ?? 0;

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents);

  return (
    <div className="space-y-8">
      {/* Sélection villa */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50 block mb-2">
          Sélectionner une villa
        </label>
        <select
          value={selectedVilla}
          onChange={(e) => setSelectedVilla(e.target.value)}
          className="w-full max-w-md border border-navy/15 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold/50"
        >
          <option value="">Choisir une villa...</option>
          {villas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} — {formatPrice(v.price_per_night)}/nuit (base)
            </option>
          ))}
        </select>
      </div>

      {selectedVilla && basePrice > 0 && (
        <div className="rounded-lg border border-gold/20 bg-gold/[0.03] p-4">
          <p className="text-sm text-navy/70">
            Prix de base : <span className="font-semibold text-navy">{formatPrice(basePrice)}/nuit</span>
            <span className="text-navy/40"> — les tarifs saisonniers remplacent ce prix sur leurs plages de dates.</span>
          </p>
        </div>
      )}

      {/* Liste des tarifs existants */}
      {selectedVilla && (
        <div>
          <h3 className="text-sm font-semibold text-navy mb-3">
            Tarifs saisonniers ({rates.length})
          </h3>

          {loading ? (
            <p className="text-sm text-navy/55">Chargement...</p>
          ) : rates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <Calendar className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Aucun tarif saisonnier défini.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-navy/[0.02] border-b border-navy/[0.05]">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">
                    <th className="px-4 py-3">Saison</th>
                    <th className="px-4 py-3">Début</th>
                    <th className="px-4 py-3">Fin</th>
                    <th className="px-4 py-3">Prix / nuit</th>
                    <th className="px-4 py-3">vs base</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.05]">
                  {rates.map((r) => {
                    const diff = r.price_per_night - basePrice;
                    const diffPct = basePrice > 0 ? Math.round((diff / basePrice) * 100) : 0;
                    return (
                      <tr key={r.id} className="hover:bg-navy/[0.01]">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 font-medium text-navy">
                            <Tag size={12} className="text-gold" />
                            {r.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-navy/70">
                          {new Date(r.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-3 text-navy/70">
                          {new Date(r.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-3 font-medium text-navy">{formatPrice(r.price_per_night)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-navy/40"}`}>
                            {diff > 0 ? "+" : ""}{diffPct}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-navy/20 hover:text-red-500 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ajouter un tarif */}
      {selectedVilla && (
        <div className="rounded-lg border border-navy/10 bg-white p-6">
          <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
            <Plus size={16} className="text-gold" />
            Ajouter une plage tarifaire
          </h3>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-navy/50 block mb-1">
                Saison *
              </label>
              <input
                type="text"
                value={newRate.label}
                onChange={(e) => setNewRate((r) => ({ ...r, label: e.target.value }))}
                placeholder="Haute saison, Noël..."
                className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-navy/50 block mb-1">
                Début *
              </label>
              <input
                type="date"
                value={newRate.start_date}
                onChange={(e) => setNewRate((r) => ({ ...r, start_date: e.target.value }))}
                className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-navy/50 block mb-1">
                Fin *
              </label>
              <input
                type="date"
                value={newRate.end_date}
                onChange={(e) => setNewRate((r) => ({ ...r, end_date: e.target.value }))}
                className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-navy/50 block mb-1">
                Prix / nuit (€) *
              </label>
              <input
                type="number"
                value={newRate.price_per_night}
                onChange={(e) => setNewRate((r) => ({ ...r, price_per_night: e.target.value }))}
                placeholder={basePrice > 0 ? `${basePrice}` : ""}
                className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white hover:bg-gold/90 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Enregistrement..." : "Ajouter la plage tarifaire"}
          </button>
        </div>
      )}
    </div>
  );
}
