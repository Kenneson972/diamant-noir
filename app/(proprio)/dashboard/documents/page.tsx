import { getSupabaseServer, getCurrentUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { DocumentsList } from "@/components/dashboard/proprio/DocumentsList";

export const dynamic = "force-dynamic";

export default async function ProprioDocumentsPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await getCurrentUser();

  if (!user) redirect("/login?redirect=/dashboard/documents");

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, file_url, tags, file_size, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const docs = (documents ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    file_url: d.file_url,
    tags: d.tags ?? [],
    file_size: d.file_size,
    created_at: d.created_at,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl text-navy">Mes documents</h1>
        <p className="mt-1 text-[11px] text-navy/50">
          Documents partag&eacute;s par l&apos;&eacute;quipe Kayvila
        </p>
      </div>
      <DocumentsList documents={docs} />
    </div>
  );
}
