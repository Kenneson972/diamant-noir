import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import type { Villa } from "@/types/domain";
import { VillaEditor } from "@/components/dashboard/villa-editor/VillaEditor";

export const metadata: Metadata = {
  title: "Modifier la villa — Kayvila",
};

interface Props {
  params: Promise<{ villaId: string }>;
}

export default async function VillaEditPage({ params }: Props) {
  const { villaId } = await params;

  const supabase = await getSupabaseServer();

  const { data: villa } = await supabase
    .from("villas")
    .select("*")
    .eq("id", villaId)
    .single();

  if (!villa) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/villas"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux villas
      </Link>

      {/* Title */}
      <h1 className="font-display text-2xl font-bold text-navy-900">
        {villa.name}
      </h1>

      {/* Layout: 2/3 edit + 1/3 sidebar */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main — Form fields + Amenities */}
        <div className="space-y-8 lg:col-span-2">
          <VillaEditor villa={villa as unknown as Villa} />
        </div>

        {/* Sidebar — Photo management link */}
        <div className="space-y-4">
          <div className="dashboard-card">
            <h3 className="text-sm font-semibold text-navy-900">Gestion</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href={`/dashboard/villas/${villa.id}/photos`}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-navy-900/[0.03] hover:text-navy-900"
                >
                  <KayvilaPngIcon name="camera" size={20} className="aria-hidden" />
                  Gerer les photos
                </Link>
              </li>
              <li>
                <Link
                  href={`/dashboard/villas/${villa.id}/disponibilites`}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-navy-900/[0.03] hover:text-navy-900"
                >
                  <KayvilaPngIcon name="calendar" size={20} className="aria-hidden" />
                  Gérer les disponibilités
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
