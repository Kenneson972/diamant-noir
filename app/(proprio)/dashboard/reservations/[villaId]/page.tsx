import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import { BookingList } from "@/components/dashboard/proprio/BookingList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réservations — Kayvila",
};

interface PageProps {
  params: Promise<{ villaId: string }>;
}

export default async function VillaReservationsPage({ params }: PageProps) {
  const { villaId } = await params;

  const supabase = await getSupabaseServer();

  // Fetch villa
  const { data: villa, error: villaError } = await supabase
    .from("villas")
    .select("name")
    .eq("id", villaId)
    .single();

  if (villaError || !villa) {
    notFound();
  }

  // Fetch bookings using admin client to bypass RLS
  const { data: bookings } = await supabaseAdmin()
    .from("bookings")
    .select(
      "id, start_date, end_date, guest_name, status, price, total_price_cents"
    )
    .eq("villa_id", villaId)
    .order("start_date", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au tableau de bord
      </Link>

      {/* Title */}
      <h1 className="font-display text-2xl font-bold text-navy">
        Réservations — {villa.name}
      </h1>

      {/* Booking list */}
      <BookingList
        bookings={bookings ?? []}
        villaId={villaId}
      />
    </div>
  );
}
