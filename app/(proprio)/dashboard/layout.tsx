import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { OwnerLayout } from "@/components/dashboard/proprio/OwnerLayout";

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

  return <OwnerLayout>{children}</OwnerLayout>;
}
