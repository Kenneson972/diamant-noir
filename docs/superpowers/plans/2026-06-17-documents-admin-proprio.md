# Documents Admin + Proprio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin uploads PDFs (factures, reporting, etc.) tagged and associated to owners. Owners view their documents read-only in their dashboard.

**Architecture:** Supabase Storage bucket `owner-documents` + `documents` table with JSONB tags. Server components fetch via `getSupabaseServer()`, API routes use `requireAdmin()`, RLS gates owner access.

**Tech Stack:** Next.js 15, Supabase Storage + Postgres, Tailwind, lucide-react (FileText), React Server Components

## Global Constraints

- Next.js 15.2.9 (stay on this version — BigInt/webpack blocker)
- `requireAdmin()` from `@/lib/auth/server` for API auth
- `isStaffAdmin()` from `@/lib/auth/admin-access` for RLS and layout guards
- Tailwind gold (#D4AF37) / navy (#0A0A0A) palette — text ≥11px
- `npm run build` must pass after each task
- No `src/` directory — code at repo root

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/20260617_documents.sql` | Create | Table, bucket, RLS |
| `app/api/admin/documents/route.ts` | Create | POST upload, DELETE |
| `app/(admin)/admin/documents/page.tsx` | Create | Server page: fetch + render |
| `components/dashboard/admin/DocumentsTable.tsx` | Create | Client table + filters |
| `components/dashboard/admin/UploadDocumentForm.tsx` | Create | Client upload form |
| `app/(proprio)/dashboard/documents/page.tsx` | Create | Server page: fetch own docs |
| `components/dashboard/proprio/DocumentsList.tsx` | Create | Client list read-only |
| `components/dashboard/admin/AdminMenuItems.ts` | Modify | +Documents entry |
| `components/dashboard/proprio/ProprioMenuItems.ts` | Modify | +Mes documents entry |

---

### Task 1: Migration SQL

**Files:**
- Create: `supabase/migrations/20260617_documents.sql`

**Interfaces:**
- Produces: `documents` table (id UUID PK, owner_id FK profiles, name TEXT, file_url TEXT, tags JSONB DEFAULT '[]', file_size BIGINT, created_at TIMESTAMPTZ), bucket `owner-documents` with RLS, RLS policies on documents table

- [ ] **Step 1: Write migration**

```sql
-- Table documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for owner lookup
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);
-- Index for admin filtering
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING gin(tags);

-- RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Admin: full access via is_staff_admin()
DROP POLICY IF EXISTS admin_manage_documents ON public.documents;
CREATE POLICY admin_manage_documents ON public.documents
  FOR ALL TO authenticated
  USING (public.is_staff_admin());

-- Owner: read own documents
DROP POLICY IF EXISTS owner_read_own_documents ON public.documents;
CREATE POLICY owner_read_own_documents ON public.documents
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Grant anon/authenticated SELECT on profiles for owner name lookup
-- (profiles RLS should already allow this, but ensure the join works)
```

- [ ] **Step 2: Apply migration to Supabase**

```bash
# Run via Supabase dashboard SQL editor or psql
# Project: wsdawdxucyuyopkpgjij
# Verify: SELECT * FROM documents LIMIT 1; (should return 0 rows, no error)
```

- [ ] **Step 3: Create bucket `owner-documents`**

In Supabase Dashboard → Storage → New Bucket `owner-documents` → Public: false.
Add RLS policies via SQL:

```sql
-- Admin insert objects
CREATE POLICY admin_insert_owner_documents ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'owner-documents' AND public.is_staff_admin());

-- Admin delete objects
CREATE POLICY admin_delete_owner_documents ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'owner-documents' AND public.is_staff_admin());

-- Owner select own objects (path starts with owner_id/)
CREATE POLICY owner_select_own_documents ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'owner-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 4: Regenerate Supabase types**

```bash
# Via Supabase CLI or dashboard: regenerate types/supabase.ts
# Ensure documents table appears in the generated types
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260617_documents.sql types/supabase.ts
git commit -m "feat(documents): migration table + bucket + RLS"
```

---

### Task 2: API Route POST + DELETE

**Files:**
- Create: `app/api/admin/documents/route.ts`

**Interfaces:**
- Produces: `POST /api/admin/documents` — receives FormData (file: File, owner_id: string, tags: string), returns `Response.json({ document })` or `Response.json({ error }, { status: 400/500 })`
- Produces: `DELETE /api/admin/documents` — receives `{ id: string }`, returns `Response.json({ success: true })`
- Consumes: `requireAdmin` from `@/lib/auth/server`, `getSupabaseServer` from `@/lib/supabase-server`, Supabase Storage API

- [ ] **Step 1: Create route file**

```typescript
// app/api/admin/documents/route.ts
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase-server";

const ALLOWED_TAGS = ["facture", "reporting", "contrat", "autre"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = await getSupabaseServer();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const ownerId = formData.get("owner_id") as string | null;
    const tagsRaw = formData.get("tags") as string | null;

    if (!file || !ownerId) {
      return NextResponse.json({ error: "Fichier et propriétaire requis" }, { status: 400 });
    }

    if (!file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "PDF uniquement" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 MB)" }, { status: 400 });
    }

    let tags: string[] = [];
    if (tagsRaw) {
      try { tags = JSON.parse(tagsRaw); } catch { /* keep [] */ }
    }
    tags = tags.filter((t) => ALLOWED_TAGS.includes(t));

    // Upload to Supabase Storage
    const filePath = `${ownerId}/${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("owner-documents")
      .upload(filePath, buffer, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("owner-documents")
      .getPublicUrl(filePath);

    // Insert DB row
    const { data: document, error: insertError } = await supabase
      .from("documents")
      .insert({
        owner_id: ownerId,
        name: file.name,
        file_url: urlData.publicUrl,
        tags,
        file_size: file.size,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error("POST /api/admin/documents error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = await getSupabaseServer();

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Fetch doc to get file path
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("file_url")
      .eq("id", id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    // Extract path from URL
    const url = new URL(doc.file_url);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/owner-documents\/(.+)/);
    if (pathMatch) {
      const storagePath = decodeURIComponent(pathMatch[1]);
      await supabase.storage.from("owner-documents").remove([storagePath]);
    }

    // Delete DB row
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error("DELETE /api/admin/documents error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npx next build
# Expected: Errors: 0
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/documents/route.ts
git commit -m "feat(documents): API POST upload + DELETE admin"
```

---

### Task 3: UploadDocumentForm (client component)

**Files:**
- Create: `components/dashboard/admin/UploadDocumentForm.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/documents` (FormData)
- Produces: Renders file input, owner select, tag checkboxes, upload button. Calls `onUploaded` callback on success.
- Props: `{ owners: { id: string; name: string }[]; onUploaded: () => void }`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";

type Owner = { id: string; name: string };

const TAGS = [
  { value: "facture", label: "Facture" },
  { value: "reporting", label: "Reporting" },
  { value: "contrat", label: "Contrat" },
  { value: "autre", label: "Autre" },
];

export function UploadDocumentForm({
  owners,
  onUploaded,
}: {
  owners: Owner[];
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [ownerId, setOwnerId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleUpload = async () => {
    if (!file || !ownerId) {
      setError("Sélectionnez un fichier et un propriétaire");
      return;
    }
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("owner_id", ownerId);
    formData.append("tags", JSON.stringify(tags));

    const res = await fetch("/api/admin/documents", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erreur lors de l'upload");
      setUploading(false);
      return;
    }

    setFile(null);
    setOwnerId("");
    setTags([]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    onUploaded();
  };

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5">
      <h2 className="mb-4 text-[12px] font-bold uppercase tracking-[0.2em] text-navy">
        Ajouter un document
      </h2>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {/* File input */}
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/50">
            Fichier PDF
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy file:mr-3 file:rounded file:border-0 file:bg-navy file:px-3 file:py-1 file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.1em] file:text-white"
          />
        </div>

        {/* Owner select */}
        <div className="w-full sm:w-56">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/50">
            Propriétaire
          </label>
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
          >
            <option value="">Sélectionner…</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/50">
          Tags :
        </span>
        {TAGS.map((tag) => (
          <button
            key={tag.value}
            type="button"
            onClick={() => toggleTag(tag.value)}
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
              tags.includes(tag.value)
                ? "border-gold/40 bg-gold/10 text-navy"
                : "border-navy/10 text-navy/50 hover:border-navy/20"
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Upload button */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file || !ownerId}
          className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? "Upload…" : "Uploader"}
        </button>
        {file && (
          <span className="text-[11px] text-navy/60">
            {file.name}{" "}
            <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="ml-1 text-navy/40 hover:text-navy">
              <X size={12} className="inline" />
            </button>
          </span>
        )}
        {error && <span className="text-[11px] text-red-500">{error}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npx next build
# Expected: Errors: 0
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/admin/UploadDocumentForm.tsx
git commit -m "feat(documents): UploadDocumentForm — file, owner select, tags"
```

---

### Task 4: DocumentsTable (client component) + Admin Page

**Files:**
- Create: `components/dashboard/admin/DocumentsTable.tsx`
- Create: `app/(admin)/admin/documents/page.tsx`

**Interfaces:**
- Consumes: Server page fetches `documents` + `profiles(name)` and passes to `DocumentsTable`
- Produces: Table with columns Name | Owner | Tags | Date | Download | Delete, filter bar

- [ ] **Step 1: Write DocumentsTable**

```tsx
"use client";

import { useState } from "react";
import { Download, Trash2, FileText, Search } from "lucide-react";

type Doc = {
  id: string;
  name: string;
  file_url: string;
  tags: string[];
  file_size: number | null;
  created_at: string;
  owner: { name: string } | null;
};

const ALL_TAGS = ["facture", "reporting", "contrat", "autre"];

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DocumentsTable({ documents }: { documents: Doc[] }) {
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [docs, setDocs] = useState(documents);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = docs.filter((d) => {
    const matchSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.owner?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchTags =
      activeTags.length === 0 || activeTags.some((t) => d.tags.includes(t));
    return matchSearch && matchTags;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    await fetch("/api/admin/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-navy/40">
        <FileText size={40} strokeWidth={1} />
        <p className="text-[12px] font-semibold uppercase tracking-[0.15em]">Aucun document</p>
        <p className="text-[11px]">Uploadez un premier document via le formulaire ci-dessus.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                activeTags.includes(tag)
                  ? "border-gold/40 bg-gold/10 text-navy"
                  : "border-navy/10 text-navy/50 hover:border-navy/20"
              }`}
            >
              {tag}
            </button>
          ))}
          {activeTags.length > 0 && (
            <button
              onClick={() => setActiveTags([])}
              className="text-[10px] text-navy/40 hover:text-navy"
            >
              Effacer
            </button>
          )}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-navy/15 py-2 pl-9 pr-3 text-[11px] text-navy placeholder:text-navy/30 sm:w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-navy/10">
        <table className="w-full text-left text-[11px]">
          <thead className="border-b border-navy/10 bg-navy/[0.02]">
            <tr>
              <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Nom</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Propriétaire</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Tags</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Taille</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Date</th>
              <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.1em] text-navy/60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-navy/5 hover:bg-navy/[0.02]">
                <td className="px-4 py-3 font-medium text-navy">{d.name}</td>
                <td className="px-4 py-3 text-navy/70">{d.owner?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {d.tags.map((t) => (
                      <span key={t} className="rounded-full border border-navy/10 bg-navy/[0.03] px-2 py-0.5 text-[10px] text-navy/60">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-navy/50">{formatSize(d.file_size)}</td>
                <td className="px-4 py-3 text-navy/50">
                  {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={d.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-navy/50 hover:bg-navy/[0.06] hover:text-navy"
                      title="Télécharger"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-navy/30 hover:bg-red-50 hover:text-red-500"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write admin page**

```tsx
// app/(admin)/admin/documents/page.tsx
import { getSupabaseServer } from "@/lib/supabase-server";
import { UploadDocumentForm } from "@/components/dashboard/admin/UploadDocumentForm";
import { DocumentsTable } from "@/components/dashboard/admin/DocumentsTable";

export const dynamic = "force-dynamic";

type DocRow = {
  id: string;
  name: string;
  file_url: string;
  tags: string[];
  file_size: number | null;
  created_at: string;
  owner_id: string;
  profiles: { name: string } | null;
};

export default async function AdminDocumentsPage() {
  const supabase = await getSupabaseServer();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, file_url, tags, file_size, created_at, owner_id, profiles!documents_owner_id_fkey(name)")
    .order("created_at", { ascending: false });

  const { data: owners } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("role", "owner")
    .order("name");

  const mapped: Array<{
    id: string;
    name: string;
    file_url: string;
    tags: string[];
    file_size: number | null;
    created_at: string;
    owner: { name: string } | null;
  }> = (documents ?? []).map((d: DocRow) => ({
    id: d.id,
    name: d.name,
    file_url: d.file_url,
    tags: d.tags ?? [],
    file_size: d.file_size,
    created_at: d.created_at,
    owner: d.profiles ? { name: d.profiles.name } : null,
  }));

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
          owners={(owners ?? []).map((o: { id: string; name: string }) => ({ id: o.id, name: o.name ?? o.id }))}
          onUploaded={() => {
            // Revalidation handled by Next.js dynamic rendering
          }}
        />
      </div>

      <DocumentsTable documents={mapped} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npx next build
# Expected: Errors: 0
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/admin/DocumentsTable.tsx app/\(admin\)/admin/documents/page.tsx
git commit -m "feat(documents): admin page + DocumentsTable with filters"
```

---

### Task 5: Proprio page + DocumentsList

**Files:**
- Create: `components/dashboard/proprio/DocumentsList.tsx`
- Create: `app/(proprio)/dashboard/documents/page.tsx`

- [ ] **Step 1: Write DocumentsList**

```tsx
"use client";

import { Download, FileText } from "lucide-react";

type Doc = {
  id: string;
  name: string;
  file_url: string;
  tags: string[];
  file_size: number | null;
  created_at: string;
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DocumentsList({ documents }: { documents: Doc[] }) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-navy/40">
        <FileText size={40} strokeWidth={1} />
        <p className="text-[12px] font-semibold uppercase tracking-[0.15em]">
          Aucun document partagé
        </p>
        <p className="text-[11px]">
          Les documents que l&apos;administrateur Kayvila partage avec vous apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-navy/10">
      <table className="w-full text-left text-[11px]">
        <thead className="border-b border-navy/10 bg-navy/[0.02]">
          <tr>
            <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Nom</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Tags</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Taille</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Date</th>
            <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.1em] text-navy/60">Action</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id} className="border-b border-navy/5 hover:bg-navy/[0.02]">
              <td className="px-4 py-3 font-medium text-navy">{d.name}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {d.tags.map((t) => (
                    <span key={t} className="rounded-full border border-navy/10 bg-navy/[0.03] px-2 py-0.5 text-[10px] text-navy/60">
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-navy/50">{formatSize(d.file_size)}</td>
              <td className="px-4 py-3 text-navy/50">
                {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td className="px-4 py-3 text-right">
                <a
                  href={d.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-navy/50 hover:bg-navy/[0.06] hover:text-navy"
                  title="Télécharger"
                >
                  <Download size={14} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Write proprio page**

```tsx
// app/(proprio)/dashboard/documents/page.tsx
import { getSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { DocumentsList } from "@/components/dashboard/proprio/DocumentsList";

export const dynamic = "force-dynamic";

export default async function ProprioDocumentsPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

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
          Documents partagés par l&apos;équipe Kayvila
        </p>
      </div>
      <DocumentsList documents={docs} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npx next build
# Expected: Errors: 0
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/proprio/DocumentsList.tsx app/\(proprio\)/dashboard/documents/page.tsx
git commit -m "feat(documents): proprio page + DocumentsList read-only"
```

---

### Task 6: Menu entries

**Files:**
- Modify: `components/dashboard/admin/AdminMenuItems.ts`
- Modify: `components/dashboard/proprio/ProprioMenuItems.ts`

- [ ] **Step 1: Add admin menu entry**

In `AdminMenuItems.ts`, after the "Demandes" line (line 15), insert:

```typescript
  { label: "Documents", href: "/admin/documents", icon: "FileText" },
```

Full context — the array becomes:
```typescript
export const adminMenuItems: MenuItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard", exact: true },
  { label: "Villas", href: "/admin/villas", icon: "Building2" },
  { label: "Réservations", href: "/admin/reservations", icon: "CalendarDays" },
  { label: "Clients", href: "/admin/clients", icon: "UserCircle" },
  { label: "Propriétaires", href: "/admin/proprietaires", icon: "Users" },
  { label: "Soumissions", href: "/admin/soumissions", icon: "Home" },
  { label: "Demandes", href: "/admin/demandes", icon: "ClipboardList" },
  { label: "Documents", href: "/admin/documents", icon: "FileText" },
  { label: "Avis", href: "/admin/avis", icon: "Star" },
  { label: "Messagerie", href: "/admin/messagerie", icon: "MessageCircle" },
  { label: "Revenus", href: "/admin/revenus", icon: "DollarSign" },
  { label: "Sync OTA", href: "/admin/sync-ota", icon: "Zap" },
  { label: "Tarification", href: "/admin/tarification", icon: "Percent" },
  { label: "Paramètres", href: "/admin/parametres", icon: "Settings" },
];
```

- [ ] **Step 2: Add proprio menu entry**

In `ProprioMenuItems.ts`, after the "Statistiques" line, append:

```typescript
  { label: "Mes documents", href: "/dashboard/documents", icon: "FileText" },
```

Full context — the array becomes:
```typescript
export const proprioMenuItems: MenuItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: "LayoutDashboard", exact: true },
  { label: "Mes Villas", href: "/dashboard/villas", icon: "Building2" },
  { label: "Réservations", href: "/dashboard/reservations", icon: "CalendarDays" },
  { label: "Revenus", href: "/dashboard/revenus", icon: "DollarSign" },
  { label: "Tâches", href: "/dashboard/taches", icon: "ClipboardList" },
  { label: "Statistiques", href: "/dashboard/statistiques", icon: "BarChart3" },
  { label: "Mes documents", href: "/dashboard/documents", icon: "FileText" },
];
```

- [ ] **Step 3: Verify build**

```bash
npx next build
# Expected: Errors: 0
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/admin/AdminMenuItems.ts components/dashboard/proprio/ProprioMenuItems.ts
git commit -m "feat(documents): menu entries admin + proprio sidebar"
```
