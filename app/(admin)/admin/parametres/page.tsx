import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import {
  Settings,
  Bell,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";

export const metadata: Metadata = {
  title: "Paramètres — Administration Kayvila",
};

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/[0.06]">
          <Icon className="h-4 w-4 text-navy" />
        </div>
        <h2 className="text-base font-semibold text-navy">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ConfigField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3">
      <div className="mb-1 text-sm font-medium text-gray-700">{label}</div>
      <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-900">
        {value}
      </div>
    </div>
  );
}

export default async function AdminParametresPage() {
  const supabase = await getSupabaseServer();

  // Charger les stats du site
  const [villasCount, bookingsCount, { count: usersCount }] =
    await Promise.all([
      supabase
        .from("villas")
        .select("*", { count: "exact", head: true })
        .then((r) => r.count ?? 0),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .then((r) => r.count ?? 0),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true }),
    ]);

  const { count: confirmedBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "confirmed");

  const { data: lastBooking } = await supabase
    .from("bookings")
    .select("total_price_cents")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: allPaid } = await supabase
    .from("bookings")
    .select("total_price_cents")
    .eq("status", "confirmed");

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, color, months")
    .order("id");

  const revenueAllTime = (allPaid ?? []).reduce(
    (sum, b) => sum + (b.total_price_cents ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <AdminPageIntro
        title="Paramètres"
        description="Indicateurs plateforme, paiements et conformité (aperçu)."
      />

      <SettingsSection icon={Settings} title="Configuration générale">
        <ConfigField label="Statut du site" value="En ligne" />
        <ConfigField label="Villas enregistrées" value={`${villasCount}`} />
        <ConfigField label="Réservations totales" value={`${bookingsCount}`} />
        <ConfigField label="Utilisateurs" value={`${usersCount ?? 0}`} />
      </SettingsSection>

      <SettingsSection icon={CreditCard} title="Paiements & Revenus">
        <ConfigField
          label="Revenus totaux (confirmés)"
          value={formatCurrency(revenueAllTime)}
        />
        <ConfigField
          label="Dernière réservation"
          value={
            lastBooking?.total_price_cents
              ? `${formatCurrency(lastBooking.total_price_cents)}`
              : "Aucune"
          }
        />
        <ConfigField
          label="Réservations confirmées"
          value={`${confirmedBookings ?? 0}`}
        />
      </SettingsSection>

      <SettingsSection icon={ShieldCheck} title="Sécurité & RGPD">
        <ConfigField label="Type d'authentification" value="Supabase Auth" />
        <ConfigField
          label="Protection CSRF"
          value="Activée (Next.js Server Actions)"
        />
        <ConfigField label="Consentement cookies" value="Activé (CookieConsent)" />
      </SettingsSection>

      <SettingsSection icon={Bell} title="Notifications">
        <ConfigField
          label="Statut notifications"
          value="Configurer dans les paramètres avancés (à venir)"
        />
      </SettingsSection>

      <SettingsSection icon={Settings} title="Saisons — Martinique">
        <p className="mb-4 text-xs text-gray-500">
          Configuration des périodes saisonnières utilisées dans les graphiques du portail propriétaire.
        </p>
        {seasons && seasons.length > 0 ? (
          <div className="space-y-3">
            {seasons.map((s: { id: number; name: string; color: string; months: number[] }) => {
              const MONTH_NAMES = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
              const monthLabels = [...s.months]
                .sort((a, b) => a - b)
                .map((m) => MONTH_NAMES[m])
                .join(", ");
              return (
                <div key={s.id} className="rounded-md border bg-gray-50 p-3">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span
                      className="inline-block h-2.5 w-8 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-sm font-semibold text-gray-800">{s.name}</span>
                  </div>
                  <p className="text-xs text-gray-500">Mois : {monthLabels}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Couleur : {s.color}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            Aucune saison configurée. Exécuter la migration SQL pour créer la table seasons.
          </p>
        )}
        <p className="mt-3 text-xs text-gray-400">
          Pour modifier les saisons, utiliser l&apos;éditeur SQL Supabase (table <code className="text-xs bg-gray-100 px-1 rounded">seasons</code>).
        </p>
      </SettingsSection>
    </div>
  );
}
