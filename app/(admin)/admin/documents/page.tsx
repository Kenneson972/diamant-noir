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

  let documents: unknown[] = [];
  let owners: unknown[] = [];
  let error: string | null = null;

  try {
    const [docsResult, ownersResult] = await Promise.all([
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

    documents = docsResult.data ?? [];
    owners = ownersResult.data ?? [];

    if (docsResult.error && !docsResult.data) {
      error = `Erreur chargement documents: ${docsResult.error.message}`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Erreur inconnue";
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="font-display text-xl text-navy">Documents</h1>
          <p className="mt-1 text-[11px] text-navy/50">
            Gérez les documents partagés avec les propriétaires
          </p>
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12">
          <p className="text-sm font-semibold text-red-700">Une erreur est survenue</p>
          <p className="text-xs text-red-500 max-w-md text-center">{error}</p>
        </div>
      </div>
    );
  }

  const mapped: Doc[] = (documents as Record<string, unknown>[]).map(
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
          owners={(owners as { id: string; full_name: string | null }[]).map((o) => ({
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
