import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase-server";
import { BookingDetailCard } from "@/components/dashboard/proprio/BookingDetailCard";
import type { Booking } from "@/types/domain";

interface PageProps {
  params: Promise<{ villaId: string; bookingId: string }>;
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { villaId, bookingId } = await params;

  const supabase = await getSupabaseServer();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // Fetch booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

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
      <BookingDetailCard booking={typedBooking} />
    </div>
  );
}
