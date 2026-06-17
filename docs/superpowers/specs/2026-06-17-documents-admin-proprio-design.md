# Spec — Documents Admin + Proprio (17 Juin 2026)

## Contexte

Prompt Richard #3 + #4. L'admin upload des PDF (factures, reporting, etc.) associés à un propriétaire. Le propriétaire les consulte en lecture seule dans son dashboard.

## Architecture

### Base de données

**Table `documents` :**
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- `tags` = array `["facture", "reporting", "contrat", "autre"]`, stocké en JSONB
- Requêtable avec `?|` pour le filtrage multi-tags

**Bucket Supabase Storage :** `owner-documents`
- RLS : admin insert/delete, proprio select (own files)

### RLS

```sql
-- Admin : tout
CREATE POLICY admin_manage_documents ON documents FOR ALL
  TO authenticated USING (is_staff_admin());

-- Proprio : lecture de ses propres docs
CREATE POLICY owner_read_own_documents ON documents FOR SELECT
  TO authenticated USING (owner_id = auth.uid());
```

### API

**`POST /api/admin/documents`** — Auth `requireAdmin` — reçoit `FormData` : file (PDF), `owner_id`, `tags` (JSON string). Upload vers `owner-documents/{owner_id}/{filename}`, insert DB. Retourne `{ document }`.

**`DELETE /api/admin/documents`** — Auth `requireAdmin` — reçoit `{ id }`. Supprime le fichier du bucket + la ligne.

### Pages

**`/admin/documents` (server component) :**
- Fetch `documents` + `profiles(name)` via `getSupabaseServer()`
- Passe aux client components `DocumentsTable` + `UploadDocumentForm`
- `DocumentsTable` : colonnes Nom | Propriétaire | Tags | Date | Télécharger | Supprimer
- Filtres : chips tags (multi) + select propriétaire
- `UploadDocumentForm` : input file (PDF only), select propriétaire, checkboxes tags, progression + toast

**`/dashboard/documents` (proprio, server component) :**
- Fetch `documents WHERE owner_id = session.user.id`
- Client `DocumentsList` : colonnes Nom | Tags | Date | Télécharger
- Empty state "Aucun document partagé"

### Menu

- Admin : `{ label: "Documents", href: "/admin/documents", icon: "FileText" }`
- Proprio : `{ label: "Mes documents", href: "/dashboard/documents", icon: "FileText" }`

## Tags

Valeurs autorisées : `facture`, `reporting`, `contrat`, `autre`. Multi-sélection. Filtrage dans la table admin via chips.

## Fichiers

| Fichier | Action |
|---------|--------|
| `supabase/migrations/20260617_documents.sql` | Créer |
| `app/api/admin/documents/route.ts` | Créer |
| `app/(admin)/admin/documents/page.tsx` | Créer |
| `components/dashboard/admin/DocumentsTable.tsx` | Créer |
| `components/dashboard/admin/UploadDocumentForm.tsx` | Créer |
| `app/(proprio)/dashboard/documents/page.tsx` | Créer |
| `components/dashboard/admin/AdminMenuItems.ts` | Modifier (+1) |
| `components/dashboard/proprio/ProprioMenuItems.ts` | Modifier (+1) |
