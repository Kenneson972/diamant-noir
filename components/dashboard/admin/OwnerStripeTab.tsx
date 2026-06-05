"use client";

import { useEffect, useState } from "react";
import { Chip } from "@heroui/react";

interface Props {
  profile: any;
}

interface StripeData {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  disputes: any[];
  payouts: any[];
}

export function OwnerStripeTab({ profile }: Props) {
  const [data, setData] = useState<StripeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/owners/${profile.id}/stripe`);
        if (res.ok) {
          setData(await res.json());
        } else {
          setError("Impossible de charger les données Stripe.");
        }
      } catch {
        setError("Erreur lors du chargement Stripe.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile.id]);

  if (loading) {
    return <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-navy/40">Chargement...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-navy/40">{error}</div>;
  }

  if (!profile.stripe_connect_account_id) {
    return (
      <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-12 text-center">
        <p className="text-navy/40">Aucun compte Stripe Connect configuré pour ce propriétaire.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connect Status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/35">Charges</p>
          <Chip
            size="sm"
            variant="soft"
            className={`mt-1 ${data?.chargesEnabled ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
          >
            {data?.chargesEnabled ? "Activées" : "Désactivées"}
          </Chip>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/35">Payouts</p>
          <Chip
            size="sm"
            variant="soft"
            className={`mt-1 ${data?.payoutsEnabled ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
          >
            {data?.payoutsEnabled ? "Activés" : "Désactivés"}
          </Chip>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/35">Vérification</p>
          <Chip
            size="sm"
            variant="soft"
            className={`mt-1 ${data?.detailsSubmitted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
          >
            {data?.detailsSubmitted ? "Complétée" : "En attente"}
          </Chip>
        </div>
      </div>

      {/* Disputes */}
      {data?.disputes && data.disputes.length > 0 ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-navy/40">
            Litiges ({data.disputes.length})
          </h3>
          <div className="space-y-2">
            {data.disputes.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg bg-navy/[0.02] px-4 py-3 text-sm">
                <div>
                  <span className="font-mono text-xs text-navy/60">{d.dispute_id?.slice(0, 12)}...</span>
                  <span className="ml-2 text-navy">{d.reason}</span>
                </div>
                <Chip size="sm" variant="soft" className="bg-amber-100 text-amber-700">
                  {d.status}
                </Chip>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center">
          <p className="text-navy/40">Aucun litige en cours.</p>
        </div>
      )}
    </div>
  );
}
