import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { BookingDetailCard } from "@/components/dashboard/proprio/BookingDetailCard";
import type { Booking } from "@/types/domain";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function AdminBookingDetailPage({ params }: PageProps) {
  const { bookingId } = await params;

  const [bookingResult, villaResult] = await Promise.all([
    supabaseAdmin().from("bookings").select("*").eq("id", bookingId).single(),
    supabaseAdmin()
      .from("bookings")
      .select("villa_id, villas(name)")
      .eq("id", bookingId)
      .single(),
  ]);

  const { data: booking, error } = bookingResult;
  if (error || !booking) notFound();

  const villaName = (villaResult.data?.villas as any)?.name ?? undefined;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/reservations"
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux réservations
      </Link>

      <BookingDetailCard booking={booking as Booking} villaName={villaName} />
    </div>
  );
}
