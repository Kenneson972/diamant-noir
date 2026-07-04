import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { checkCsrf } from "@/lib/security";

const ALLOWED_TAGS = ["facture", "reporting", "contrat", "autre"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

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
        storage_path: filePath,
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
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  try {
    await requireAdmin(request);
    const supabase = await getSupabaseServer();

    const { id } = await request.json();
    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Fetch doc to get storage path
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    // Delete from storage using stored storage_path
    if (doc.storage_path) {
      await supabase.storage.from("owner-documents").remove([doc.storage_path]);
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
