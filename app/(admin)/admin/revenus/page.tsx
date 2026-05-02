import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { TrendingUp, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Revenus — Administration Kayvila",
};

export default async function AdminRevenusPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin/revenus");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Revenus globaux</h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Ce mois</span>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-navy">&mdash;&euro;</p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Cette ann&eacute;e</span>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-navy">&mdash;&euro;</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-8 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-4 text-sm text-gray-500">
          Les graphiques d&eacute;taill&eacute;s seront disponibles
          prochainement.
        </p>
      </div>
    </div>
  );
}
