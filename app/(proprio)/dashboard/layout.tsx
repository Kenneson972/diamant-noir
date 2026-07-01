import { redirect } from "next/navigation";
import { getSupabaseServer, getCurrentUser, getOwnerVillas } from "@/lib/supabase-server";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { proprioMenuItems } from "@/components/dashboard/proprio/ProprioMenuItems";
import { CopilotProvider } from "@/components/dashboard/proprio/CopilotContext";
import { isStaffAdmin, isOwnerRole } from "@/lib/auth/admin-access";
import { applyMenuBadges } from "@/lib/dashboard/apply-menu-badges";

export const metadata = {
  title: "Tableau de bord propriétaire",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProprioDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const [{ data: profile }, { data: ownerVillas }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    getOwnerVillas(user.id),
  ]);

  const adminUser = isStaffAdmin(
    profile?.role,
    user.user_metadata?.role as string | undefined,
    user.email
  );
  if (adminUser) redirect("/admin");

  const ownerUser = isOwnerRole(
    profile?.role,
    user.user_metadata?.role as string | undefined
  );
  if (!ownerUser) redirect("/espace-client");

  // Fetch badge counts
  const ownerVillaIds = (ownerVillas ?? []).map((v) => v.id);

  const [reservations, taches] =
    ownerVillaIds.length > 0
      ? await Promise.all([
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .in("villa_id", ownerVillaIds)
            .eq("status", "pending"),
          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .in("villa_id", ownerVillaIds)
            .neq("status", "done"),
        ])
      : ([{ count: 0 }, { count: 0 }] as const);

  const badgeMap: Record<string, number> = {
    "/dashboard/reservations": reservations.count ?? 0,
    "/dashboard/taches": taches.count ?? 0,
  };

  const menuWithBadges = applyMenuBadges(proprioMenuItems, badgeMap);

  return (
    <CopilotProvider>
      <DashboardShell role="owner" roleLabel="Propriétaire" menu={menuWithBadges}>
        {children}
      </DashboardShell>
    </CopilotProvider>
  );
}
