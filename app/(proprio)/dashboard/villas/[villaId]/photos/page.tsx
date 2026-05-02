import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { VillaImageManagerWrapper } from "@/components/dashboard/villa-editor/VillaImageManagerWrapper";

export const metadata: Metadata = {
  title: "Photos — Kayvila",
};

interface Props {
  params: Promise<{ villaId: string }>;
}

export default async function VillaPhotosPage({ params }: Props) {
  const { villaId } = await params;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: villa } = await supabase
    .from("villas")
    .select("id, name, image_urls")
    .eq("id", villaId)
    .single();

  if (!villa) {
    notFound();
  }

  const initialPhotos = (villa.image_urls as string[]) ?? [];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/dashboard/villas/${villa.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour à la villa
      </Link>

      {/* Title */}
      <h1 className="font-display text-2xl font-bold text-navy-900">
        Photos — {villa.name}
      </h1>

      {/* VillaImageManager */}
      <VillaImageManagerWrapper
        villaId={villa.id}
        initialPhotos={initialPhotos}
      />
    </div>
  );
}
