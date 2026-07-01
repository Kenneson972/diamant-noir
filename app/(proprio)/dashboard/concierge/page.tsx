import { getSupabaseServer, getCurrentUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { DashboardCopilotChat } from "@/components/dashboard/DashboardCopilotChat";

export const dynamic = "force-dynamic";

export default async function ProprioConciergePage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/concierge");

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl text-navy">Mon concierge</h1>
        <p className="mt-1 text-[11px] text-navy/50">
          Votre assistant IA Kayvila — posez vos questions ou demandez une action
          (prix, blocage de dates, réservations)
        </p>
      </div>
      {/* Même copilot que le dashboard (actions incluses), en pleine hauteur */}
      <DashboardCopilotChat fullHeight />
    </div>
  );
}
