import { getSupabaseServer, getCurrentUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ConciergeTabs } from "@/components/dashboard/proprio/ConciergeTabs";

export const dynamic = "force-dynamic";

export default async function ProprioConciergePage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/concierge");

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("owner_messages")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("sender_role", "admin")
      .is("read_at", null),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl text-navy">Mon concierge</h1>
        <p className="mt-1 text-[11px] text-navy/50">
          Votre conseiller Kayvila — écrivez-nous, on vous répond sous 24h.
        </p>
      </div>
      <ConciergeTabs ownerId={user.id} firstName={firstName} hasUnread={(unreadCount ?? 0) > 0} />
    </div>
  );
}
