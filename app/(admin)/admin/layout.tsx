import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { AdminLayout } from "@/components/dashboard/admin/AdminLayout";

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

  return <AdminLayout>{children}</AdminLayout>;
}
