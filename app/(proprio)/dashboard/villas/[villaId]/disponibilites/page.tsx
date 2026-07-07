import { notFound } from "next/navigation";
import { getSupabaseServer, getCurrentUser } from "@/lib/supabase-server";
import { AvailabilityCalendar } from "@/components/dashboard/proprio/AvailabilityCalendar";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Disponibilités" };

interface Props {
  params: Promise<{ villaId: string }>;
}

export default async function DisponibilitesPage({ params }: Props) {
  const { villaId } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await getCurrentUser();
  if (!user) notFound();

  const { data: villa } = await supabase
    .from("villas")
    .select("id, name, owner_id")
    .eq("id", villaId)
    .single();

  if (!villa || villa.owner_id !== user.id) notFound();

  const today = new Date().toISOString().split("T")[0];

  const [{ data: blocks }, { data: bookings }] = await Promise.all([
    supabase
      .from("villa_date_blocks")
      .select("id, start_date, end_date, reason, origin")
      .eq("villa_id", villaId)
      .gte("end_date", today),
    supabase
      .from("reservations")
      .select("id, start_date, end_date")
      .eq("villa_id", villaId)
      .in("status", ["confirmed", "paid"])
      .gte("end_date", today),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-navy">
          Disponibilités — {villa.name}
        </h1>
        <p className="mt-1 text-sm text-navy/50">
          Cliquez une date libre pour commencer une sélection, puis une
          seconde date pour bloquer la plage.
        </p>
      </div>
      <AvailabilityCalendar
        villaId={villaId}
        userId={user.id}
        initialBlocks={blocks ?? []}
        initialBookings={bookings ?? []}
      />
    </div>
  );
}
