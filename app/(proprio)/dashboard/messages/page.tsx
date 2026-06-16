import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { OwnerMessaging } from "@/components/dashboard/proprio/OwnerMessaging";

export const metadata: Metadata = {
  title: "Messages — Kayvila",
};

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Messages
          </h1>
          <p className="text-sm text-muted">
            Communiquez directement avec l&apos;équipe Kayvila.
          </p>
        </div>
        <OwnerMessaging userId={user!.id} />
      </div>
    </div>
  );
}
