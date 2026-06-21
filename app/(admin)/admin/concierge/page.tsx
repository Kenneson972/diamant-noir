import { getSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { AdminCopilotChat } from "@/components/dashboard/admin/AdminCopilotChat";
import { isStaffAdmin } from "@/lib/auth/admin-access";

export const dynamic = "force-dynamic";

export default async function AdminConciergePage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/concierge");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!isStaffAdmin(profile?.role, user.user_metadata?.role as string | undefined, user.email)) {
    redirect("/espace-client");
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl text-navy">Concierge IA</h1>
        <p className="mt-1 text-[11px] text-navy/50">
          Supervision globale — questions et actions (prix, blocage, soumissions)
        </p>
      </div>
      <AdminCopilotChat />
    </div>
  );
}
