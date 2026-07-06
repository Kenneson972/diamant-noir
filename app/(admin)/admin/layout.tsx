import "./globals.css";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { adminMenuItems } from "@/components/dashboard/admin/AdminMenuItems";
import { isStaffAdmin, normalizeRole } from "@/lib/auth/admin-access";
import { applyMenuBadges } from "@/lib/dashboard/apply-menu-badges";

export const metadata = {
  title: "Administration Kayvila",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const effective = normalizeRole(profile?.role ?? user.user_metadata?.role);
  if (
    !isStaffAdmin(
      profile?.role,
      user.user_metadata?.role as string | undefined,
      user.email
    )
  ) {
    if (effective === "owner") {
      redirect("/dashboard");
    }
    redirect("/espace-client");
  }

  const [reservations, soumissions, avis, demandes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("villa_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("priority", "urgent")
      .neq("status", "resolved"),
  ]);

  const badgeMap: Record<string, number> = {
    "/admin/reservations": reservations.count ?? 0,
    "/admin/soumissions": soumissions.count ?? 0,
    "/admin/avis": avis.count ?? 0,
    "/admin/messages": demandes.count ?? 0,
  };

  const menuWithBadges = applyMenuBadges(adminMenuItems, badgeMap);

  return (
    <DashboardShell role="admin" roleLabel="Admin" menu={menuWithBadges}>
      {children}
    </DashboardShell>
  );
}
