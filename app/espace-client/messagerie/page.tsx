import { redirect } from "next/navigation";
import { getSupabaseServer, getCurrentUser } from "@/lib/supabase-server";
import { tenantBookingsOrFilter } from "@/lib/booking-tenant";
import { TenantSectionHeader } from "@/components/espace-client/TenantSectionHeader";
import { TenantTeamThread } from "@/components/espace-client/TenantTeamThread";

export const dynamic = "force-dynamic";

export default async function MessageriePage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await getCurrentUser();
  if (!user) redirect("/login?redirect=/espace-client/messagerie");

  const [{ data: profile }, { data: bookingRows }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("bookings")
      .select("id, villa_id")
      .or(tenantBookingsOrFilter(user.id, user.email))
      .in("status", ["confirmed", "pending"])
      .gt("end_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(1),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const booking = bookingRows?.[0] ?? null;

  let villaName: string | null = null;
  if (booking?.villa_id) {
    const { data: villa } = await supabase
      .from("villas")
      .select("name")
      .eq("id", booking.villa_id)
      .maybeSingle();
    villaName = villa?.name ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <TenantSectionHeader
        title="Notre équipe"
        description="Une question, un besoin pendant votre séjour ? Écrivez-nous, on vous répond sous 24h."
      />
      <TenantTeamThread guestId={user.id} firstName={firstName} villaName={villaName} />
    </div>
  );
}
