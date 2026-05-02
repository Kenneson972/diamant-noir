import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { Settings, Bell, CreditCard } from "lucide-react";

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

function PlaceholderField({ label }: { label: string }) {
  return (
    <div className="py-3">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="mt-1 h-9 rounded-md border border-dashed border-gray-300 bg-gray-50" />
    </div>
  );
}

export default async function AdminParametresPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin/parametres");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Param&egrave;tres</h1>
      </div>

      <SettingsSection icon={Settings} title="Configuration g&eacute;n&eacute;rale">
        <PlaceholderField label="Nom du site" />
        <PlaceholderField label="Email de contact" />
        <PlaceholderField label="Adresse" />
        <PlaceholderField label="Num&eacute;ro de t&eacute;l&eacute;phone" />
        <p className="mt-2 text-xs text-gray-400">
          La configuration compl&egrave;te sera disponible
          prochainement.
        </p>
      </SettingsSection>

      <SettingsSection icon={Bell} title="Notifications">
        <PlaceholderField label="Email de notification" />
        <PlaceholderField label="Notification nouvelle r&eacute;servation" />
        <PlaceholderField label="Notification annulation" />
        <p className="mt-2 text-xs text-gray-400">
          Les param&egrave;tres de notification seront configurables
          prochainement.
        </p>
      </SettingsSection>

      <SettingsSection icon={CreditCard} title="Paiements">
        <PlaceholderField label="Cl&eacute; publique Stripe" />
        <PlaceholderField label="Cl&eacute; secr&egrave;te Stripe" />
        <PlaceholderField label="Mode test / production" />
        <p className="mt-2 text-xs text-gray-400">
          La configuration Stripe sera disponible prochainement.
        </p>
      </SettingsSection>
    </div>
  );
}
