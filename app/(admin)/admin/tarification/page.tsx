import type { Metadata } from "next";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { SeasonalRatesManager } from "@/components/dashboard/admin/SeasonalRatesManager";

export const metadata: Metadata = {
  title: "Tarification saisonnière — Administration Kayvila",
};

export default function AdminTarificationPage() {
  return (
    <div className="space-y-8">
      <AdminPageIntro
        title="Tarification saisonnière"
        description="Définissez des prix par nuit différents selon les périodes (haute saison, vacances, événements)."
      />
      <SeasonalRatesManager />
    </div>
  );
}
