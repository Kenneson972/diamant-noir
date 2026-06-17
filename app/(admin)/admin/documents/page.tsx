import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import { UploadDocumentForm } from "@/components/dashboard/admin/UploadDocumentForm";
import { DocumentsTable, type Doc } from "@/components/dashboard/admin/DocumentsTable";

export const metadata: Metadata = {
  title: "Documents — Administration Kayvila",
};

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage() {
  const supabase = supabaseAdmin();

  const [{ data: documents }, { data: owners }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, name, file_url, tags, file_size, created_at, owner_id, profiles!documents_owner_id_fkey(full_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "owner")
      .order("full_name"),
  ]);

  const mapped: Doc[] = (documents ?? []).map(
    (d: Record<string, unknown>) => ({
      id: d.id as string,
      name: d.name as string,
      file_url: d.file_url as string,
      tags: (d.tags as string[]) ?? [],
      file_size: (d.file_size as number) ?? null,
      created_at: d.created_at as string,
      owner: (d as Record<string, unknown>).profiles
        ? { name: ((d as Record<string, unknown>).profiles as Record<string, unknown>).full_name as string }
        : null,
    })
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl text-navy">Documents</h1>
        <p className="mt-1 text-[11px] text-navy/50">
          Gérez les documents partagés avec les propriétaires
        </p>
      </div>

      <div className="mb-8">
        <UploadDocumentForm
          owners={(owners ?? []).map((o: { id: string; full_name: string | null }) => ({
            id: o.id,
            name: o.full_name ?? o.id,
          }))}
          onUploaded={() => {
            // Revalidation handled by Next.js dynamic rendering
          }}
        />
      </div>

      <DocumentsTable documents={mapped} />
    </div>
  );
}
