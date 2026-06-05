import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { adminMenuItems } from "@/components/dashboard/admin/AdminMenuItems";
import { isStaffAdmin, normalizeRole } from "@/lib/auth/admin-access";

export const metadata = {
  title: "Administration Kayvila",
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

  return (
    <DashboardShell role="admin" roleLabel="Admin" menu={adminMenuItems}>
      {children}
    </DashboardShell>
  );
}
