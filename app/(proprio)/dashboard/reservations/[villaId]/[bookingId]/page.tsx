import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { BookingDetailCard } from "@/components/dashboard/proprio/BookingDetailCard";
import type { Booking } from "@/types/domain";

interface PageProps {
  params: Promise<{ villaId: string; bookingId: string }>;
}

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({ params }: PageProps) {
  const { villaId, bookingId } = await params;

  // Fetch booking and villa concurrently
  const [bookingResult, villaResult] = await Promise.all([
    supabaseAdmin()
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single(),
    supabaseAdmin()
      .from("villas")
      .select("name")
      .eq("id", villaId)
      .single(),
  ]);

  const { data: booking, error } = bookingResult;
  const { data: villa } = villaResult;

  if (error || !booking) {
    notFound();
  }

  const typedBooking = booking as Booking;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/dashboard/reservations/${villaId}`}
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux réservations
      </Link>

      {/* Detail card */}
      <BookingDetailCard
        booking={typedBooking}
        villaName={villa?.name ?? undefined}
      />
    </div>
  );
}
