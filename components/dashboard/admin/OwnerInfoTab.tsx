"use client";

import { useState } from "react";
import { Button, Chip } from "@heroui/react";
import { Save } from "lucide-react";

interface Props {
  profile: any;
}

export function OwnerInfoTab({ profile }: Props) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/owners/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, phone, email }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Infos personnelles */}
      <div className="space-y-4 rounded-2xl border border-navy/10 bg-white p-6">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-navy/40">
          Informations personnelles
        </h3>
        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-navy/40">
                Nom complet
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy placeholder:text-navy/25 focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-navy/40">
                Téléphone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy placeholder:text-navy/25 focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-navy/40">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy placeholder:text-navy/25 focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            />
          </div>
        </div>
        <Button
          onPress={handleSave}
          isDisabled={saving}
          className="bg-navy text-white"
          size="sm"
        >
          <Save size={14} /> {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      {/* Stripe & Statut */}
      <div className="space-y-4 rounded-2xl border border-navy/10 bg-white p-6">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-navy/40">
          Statut & Stripe
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Stripe Connect</span>
            {profile.stripe_connect_onboarding_completed ? (
              <Chip size="sm" variant="soft" className="bg-emerald-100 text-emerald-700">
                Connecté
              </Chip>
            ) : profile.stripe_connect_account_id ? (
              <Chip size="sm" variant="soft" className="bg-amber-100 text-amber-700">
                En attente
              </Chip>
            ) : (
              <Chip size="sm" variant="soft" className="bg-gray-100 text-gray-500">
                Non configuré
              </Chip>
            )}
          </div>
          {profile.stripe_connect_account_id && (
            <div className="flex items-center justify-between">
              <span className="text-muted">ID Compte</span>
              <span className="font-mono text-xs text-navy">
                {profile.stripe_connect_account_id.slice(0, 12)}...
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted">Compte</span>
            {profile.suspended ? (
              <Chip size="sm" variant="soft" className="bg-red-100 text-red-700">
                Suspendu
              </Chip>
            ) : (
              <Chip size="sm" variant="soft" className="bg-emerald-100 text-emerald-700">
                Actif
              </Chip>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Inscrit le</span>
            <span className="text-navy" suppressHydrationWarning>
              {new Date(profile.created_at).toLocaleDateString("fr-FR")} {/* react-doctor: locale hydration mismatch */}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
