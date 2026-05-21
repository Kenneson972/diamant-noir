"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";

interface OwnerOption {
  id: string;
  full_name: string | null;
  email: string;
}

export function AdminVillaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/owners");
        const json = await res.json();
        setOwners(json.owners ?? []);
      } catch {
        // silent fail
      } finally {
        setOwnersLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError("Session expirée. Reconnectez-vous.");
      setLoading(false);
      return;
    }

    const form = new FormData(e.currentTarget);
    const capacityRaw = form.get("capacity");
    const commissionRaw = form.get("commission_rate");
    const cleaningFeeRaw = form.get("cleaning_fee_euros");
    const ownerId = form.get("owner_id") as string;

    const data: Record<string, unknown> = {
      name: form.get("name") as string,
      location: (form.get("location") as string) || null,
      price_per_night: Number(form.get("price_per_night")),
      description: (form.get("description") as string) || null,
      is_published: form.get("is_published") === "on",
      capacity:
        capacityRaw && String(capacityRaw).trim() !== ""
          ? Math.max(1, Number(capacityRaw))
          : 4,
      commission_rate:
        commissionRaw && String(commissionRaw).trim() !== ""
          ? Number(commissionRaw)
          : 25,
      cleaning_fee_cents: cleaningFeeRaw && String(cleaningFeeRaw).trim() !== "" ? Math.round(Number(cleaningFeeRaw) * 100) : 0,
      owner_id: ownerId || null,
    };

    const imageUrl = (form.get("image_url") as string)?.trim();
    if (imageUrl) data.image_url = imageUrl;

    try {
      const res = await fetch("/api/dashboard/create-villa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Erreur lors de la création");
        return;
      }

      const newId = result.data?.id as string | undefined;
      if (!newId) {
        setError("Réponse serveur invalide (pas d'identifiant villa).");
        return;
      }

      router.push(`/admin/villas/${newId}`);
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 font-body-dashboard">
      <AdminPageIntro
        title="Ajouter une villa"
        description="Créez la fiche minimale : vous pourrez enrichir médias, équipements et tarifs saisonniers dans l'éditeur complet (hub classique)."
      />

      <div className="rounded-2xl border border-navy/8 bg-amber-50/80 px-4 py-3 text-sm text-navy/75">
        <p className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-gold" aria-hidden />
          Après création, utilisez{" "}
          <strong className="font-semibold text-navy">Éditeur complet</strong>{" "}
          sur la fiche villa pour tout aligner avec le hub classique.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-6 font-display-dashboard text-base font-semibold text-navy">
            Informations principales
          </h2>
          <div className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-navy"
              >
                Nom de la villa *
              </label>
              <input
                id="name"
                name="name"
                required
                autoComplete="off"
                className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                placeholder="ex. Villa Azur"
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-1 block text-sm font-medium text-navy"
              >
                Localisation
              </label>
              <input
                id="location"
                name="location"
                className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                placeholder="ex. Trois-Îlets, Martinique"
              />
            </div>

            <div>
              <label
                htmlFor="owner_id"
                className="mb-1 block text-sm font-medium text-navy"
              >
                Propriétaire
              </label>
              <select
                id="owner_id"
                name="owner_id"
                defaultValue=""
                className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 bg-white"
                disabled={ownersLoading}
              >
                <option value="">
                  {ownersLoading
                    ? "Chargement des propriétaires…"
                    : "Sélectionner un propriétaire"}
                </option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.full_name ?? owner.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="price_per_night"
                  className="mb-1 block text-sm font-medium text-navy"
                >
                  Prix par nuit (€) *
                </label>
                <input
                  id="price_per_night"
                  name="price_per_night"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  placeholder="250"
                />
              </div>
              <div>
                <label
                  htmlFor="capacity"
                  className="mb-1 block text-sm font-medium text-navy"
                >
                  Capacité (personnes)
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={4}
                  className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="commission_rate"
                  className="mb-1 block text-sm font-medium text-navy"
                >
                  Commission (%)
                </label>
                <input
                  id="commission_rate"
                  name="commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  defaultValue={25}
                  className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-navy" htmlFor="cleaning_fee_euros">
                  Frais de menage (EUR)
                </label>
                <input
                  id="cleaning_fee_euros"
                  name="cleaning_fee_euros"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={0}
                  className="w-full rounded-none border border-gray-300 px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-navy/40">100 % reverse a Kayvila pour le menage et la blanchisserie</p>
              </div>
              <div>
                <label
                  htmlFor="image_url"
                  className="mb-1 block text-sm font-medium text-navy"
                >
                  Image principale (URL)
                </label>
                <input
                  id="image_url"
                  name="image_url"
                  type="url"
                  className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  placeholder="https://…"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-navy"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="w-full resize-none rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                placeholder="Points forts, vue, esprit du lieu…"
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-navy/8 bg-navy/[0.02] px-4 py-3">
              <input
                id="is_published"
                name="is_published"
                type="checkbox"
                className="h-4 w-4 rounded border-navy/30 text-gold focus:ring-gold"
              />
              <label htmlFor="is_published" className="text-sm text-navy/80">
                Publier immédiatement sur le site
              </label>
            </div>
          </div>
        </div>

        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {loading ? "Création…" : "Créer la villa"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-navy/15 px-6 py-3 text-sm font-medium text-navy/70 transition-colors hover:border-navy/25 hover:text-navy"
          >
            Annuler
          </button>
          <Link
            href="/admin/villas"
            className="text-sm font-medium text-gold underline-offset-2 hover:underline"
          >
            Retour à la liste
          </Link>
        </div>
      </form>
    </div>
  );
}
