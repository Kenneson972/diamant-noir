import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { PerformanceMetrics } from "@/components/dashboard/proprio/PerformanceMetrics";
import { OccupancyChart } from "@/components/dashboard/proprio/OccupancyChart";

export const metadata: Metadata = {
  title: "Statistiques — Kayvila",
};

interface PageProps {
  params: Promise<{ villaId: string }>;
}

const occupancyData = [
  { month: "Jan", rate: 65 },
  { month: "Fév", rate: 58 },
  { month: "Mar", rate: 72 },
  { month: "Avr", rate: 80 },
  { month: "Mai", rate: 85 },
];

export default async function StatistiquesVillaPage({ params }: PageProps) {
  const { villaId } = await params;

  const supabase = await getSupabaseServer();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  // Fetch villa
  const { data: villa, error: villaError } = await supabase
    .from("villas")
    .select("name")
    .eq("id", villaId)
    .single();

  if (villaError || !villa) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/villas"
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux villas
      </Link>

      {/* Title */}
      <h1 className="font-display text-2xl font-bold text-navy">
        Statistiques — {villa.name}
      </h1>

      {/* Performance metrics */}
      <PerformanceMetrics
        occupancyRate={72}
        totalNights={156}
        avgRating={4.8}
        totalReviews={42}
      />

      {/* Occupancy chart */}
      <OccupancyChart data={occupancyData} />
    </div>
  );
}
