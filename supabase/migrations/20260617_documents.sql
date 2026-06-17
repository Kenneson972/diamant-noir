-- Migration: Create documents table, indexes, RLS policies
-- Date: 2026-06-17
-- Description: Document storage for owner documents (booklets, contracts, etc.)

-- 1. Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING gin(tags);

-- 3. Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Admin: full access (manage all documents)
DROP POLICY IF EXISTS admin_manage_documents ON public.documents;
CREATE POLICY admin_manage_documents ON public.documents
  FOR ALL TO authenticated
  USING (public.is_staff_admin());

-- Owner: read own documents only
DROP POLICY IF EXISTS owner_read_own_documents ON public.documents;
CREATE POLICY owner_read_own_documents ON public.documents
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- 5. Storage bucket RLS policies
-- NOTE: The bucket 'owner-documents' must be created manually in the Supabase Dashboard
-- (Storage -> New Bucket -> name: owner-documents -> Public: false)
-- Then run the following policies in the SQL Editor:

-- Policy: Admin can insert objects into owner-documents
DROP POLICY IF EXISTS admin_insert_owner_documents ON storage.objects;
CREATE POLICY admin_insert_owner_documents ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'owner-documents' AND public.is_staff_admin());

-- Policy: Admin can delete objects from owner-documents
DROP POLICY IF EXISTS admin_delete_owner_documents ON storage.objects;
CREATE POLICY admin_delete_owner_documents ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'owner-documents' AND public.is_staff_admin());

-- Policy: Owner can select (view) own files in owner-documents
-- Files are stored under the path: {owner_id}/{filename}
DROP POLICY IF EXISTS owner_select_own_documents ON storage.objects;
CREATE POLICY owner_select_own_documents ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'owner-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
