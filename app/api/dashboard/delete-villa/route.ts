import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth/server";
import { isStaffAdmin } from "@/lib/auth/admin-access";
import { checkCsrf } from "@/lib/security";

export const runtime = "nodejs";

/**
 * Les photos sont uploadées sous un chemin aléatoire (pas de préfixe villaId) :
 * le seul lien fiable vers les fichiers est l'URL publique stockée sur la villa.
 * On en réextrait bucket + chemin pour ne pas laisser d'orphelins en storage.
 */
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest = url.slice(idx + marker.length).split("?")[0];
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  return {
    bucket: rest.slice(0, slash),
    path: decodeURIComponent(rest.slice(slash + 1)),
  };
}

export async function POST(request: Request) {
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const { villaId } = await request.json();
    if (!villaId) {
      return NextResponse.json({ error: "Missing villaId" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: villa, error: villaError } = await admin
      .from("villas")
      .select("owner_id, image_url, image_urls")
      .eq("id", villaId)
      .single();

    if (villaError || !villa) {
      return NextResponse.json({ error: "Villa not found" }, { status: 404 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = isStaffAdmin(profile?.role, user.email);
    const isOwner = villa.owner_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error: deleteError } = await admin
      .from("villas")
      .delete()
      .eq("id", villaId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Storage nettoyé après la suppression en base : un fichier orphelin est
    // moins grave qu'une villa dont les photos ont disparu si le delete échoue.
    const byBucket = new Map<string, string[]>();
    const urls = [
      villa.image_url,
      ...(Array.isArray(villa.image_urls) ? villa.image_urls : []),
    ].filter((u): u is string => typeof u === "string" && u.length > 0);

    for (const url of urls) {
      const parsed = parseStorageUrl(url);
      if (!parsed) continue;
      const paths = byBucket.get(parsed.bucket) ?? [];
      paths.push(parsed.path);
      byBucket.set(parsed.bucket, paths);
    }

    let removedFiles = 0;
    for (const [bucket, paths] of byBucket) {
      const { error: storageError } = await admin.storage.from(bucket).remove(paths);
      if (storageError) {
        console.error(`Storage cleanup failed (${bucket}):`, storageError.message);
      } else {
        removedFiles += paths.length;
      }
    }

    return NextResponse.json({ success: true, removedFiles });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
