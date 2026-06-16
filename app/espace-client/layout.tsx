import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase-server";
import EspaceClientShell from "./EspaceClientShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Espace client",
  robots: { index: false, follow: false },
};

export default async function EspaceClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/espace-client");
  }

  return <EspaceClientShell>{children}</EspaceClientShell>;
}
