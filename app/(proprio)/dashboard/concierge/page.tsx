import { getSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { AgentChat } from "@/components/dashboard/shared/AgentChat";

export const dynamic = "force-dynamic";

export default async function ProprioConciergePage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/concierge");

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl text-navy">Mon concierge</h1>
        <p className="mt-1 text-[11px] text-navy/50">
          Votre assistant IA Kayvila — posez-lui vos questions de gestion
        </p>
      </div>
      <AgentChat
        endpoint="/api/concierge/owner"
        title="Agent B · Concierge Propriétaire"
        placeholder="Ex : Quel est mon taux d'occupation ce mois ?"
        suggestedPrompts={[
          "Quel est mon taux d'occupation ?",
          "Quels check-ins cette semaine ?",
          "Y a-t-il des tâches en retard ?",
        ]}
      />
    </div>
  );
}
