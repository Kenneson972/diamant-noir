import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { OwnerLayout } from "@/components/dashboard/proprio/OwnerLayout";
import { isStaffAdmin, isOwnerRole } from "@/lib/auth/admin-access";

export const metadata = {
  title: "Tableau de bord propriétaire",
};

export default async function ProprioDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const adminUser = isStaffAdmin(
    profile?.role,
    user.user_metadata?.role as string | undefined,
    user.email
  );

  if (adminUser) {
    redirect("/admin");
  }

  const ownerUser = isOwnerRole(
    profile?.role,
    user.user_metadata?.role as string | undefined
  );

  if (!ownerUser) {
    redirect("/espace-client");
  }

  return <OwnerLayout>{children}</OwnerLayout>;
}
