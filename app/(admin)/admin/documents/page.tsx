import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import { UploadDocumentForm } from "@/components/dashboard/admin/UploadDocumentForm";
import { DocumentsTable, type Doc } from "@/components/dashboard/admin/DocumentsTable";

export const metadata: Metadata = {
  title: "Documents — Administration Kayvila",
};

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage() {
  let documents: Record<string, unknown>[] = [];
  let owners: { id: string; full_name: string | null }[] = [];
  let fetchError: string | null = null;

  try {
    const supabase = supabaseAdmin();

    const [docsResult, ownersResult] = await Promise.all([
      supabase
        .from("documents")
        .select("id, name, file_url, tags, file_size, created_at, owner_id")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name"),
    ]);

    if (docsResult.error) {
      fetchError = docsResult.error.message;
    } else {
      documents = (docsResult.data as Record<string, unknown>[]) ?? [];
    }

    if (ownersResult.error) {
      // profiles error is non-fatal — on continue sans noms
      console.warn("Profiles fetch error:", ownersResult.error.message);
    } else {
      owners = (ownersResult.data as { id: string; full_name: string | null }[]) ?? [];
    }
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Erreur inconnue";
  }

  // Build owner name map (join manuel au lieu de FK Supabase)
  const ownerNameById: Record<string, string> = {};
  for (const o of owners) {
    if (o.full_name) ownerNameById[o.id] = o.full_name;
  }

  if (fetchError) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="font-display text-xl text-navy">Documents</h1>
          <p className="mt-1 text-[11px] text-navy/50">
            Gérez les documents partagés avec les propriétaires
          </p>
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-amber-200 bg-amber-50 px-6 py-12">
          <p className="text-sm font-semibold text-amber-800">Fonctionnalité en cours de déploiement</p>
          <p className="text-xs text-amber-600 max-w-md text-center">
            La gestion documentaire sera disponible prochainement.
          </p>
          <details className="mt-2 text-[10px] text-amber-400">
            <summary>Détails techniques</summary>
            <code className="mt-1 block">{fetchError}</code>
          </details>
        </div>
      </div>
    );
  }

  const mapped: Doc[] = documents.map((d) => {
    const docOwnerId = d.owner_id as string | undefined;
    const ownerName = docOwnerId ? ownerNameById[docOwnerId] : undefined;
    return {
      id: d.id as string,
      name: d.name as string,
      file_url: d.file_url as string,
      tags: (d.tags as string[]) ?? [],
      file_size: (d.file_size as number) ?? null,
      created_at: d.created_at as string,
      owner: ownerName ? { name: ownerName } : null,
    };
  });

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
