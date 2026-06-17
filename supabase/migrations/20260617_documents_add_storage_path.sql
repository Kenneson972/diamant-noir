-- Migration: Add storage_path column to documents table
-- Date: 2026-06-17
-- Description: Add storage_path column for reliable storage path retrieval (avoids fragile URL parsing in DELETE handler)

ALTER TABLE IF EXISTS public.documents
  ADD COLUMN IF NOT EXISTS storage_path TEXT NOT NULL DEFAULT '';
