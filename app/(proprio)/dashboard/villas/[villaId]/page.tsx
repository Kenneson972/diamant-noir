import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import type { Villa } from "@/types/domain";
import { VillaEditor } from "@/components/dashboard/villa-editor/VillaEditor";
import { VillaIcalPanel } from "@/components/dashboard/proprio/VillaIcalPanel";

export const metadata: Metadata = {
  title: "Modifier la villa",
};

interface Props {
  params: Promise<{ villaId: string }>;
}

export default async function VillaEditPage({ params }: Props) {
  const { villaId } = await params;

  const supabase = await getSupabaseServer();

  const { data: villa } = await supabase
    .from("villas")
    .select("*")
    .eq("id", villaId)
    .single();

  if (!villa) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/villas"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux villas
      </Link>

      <VillaEditor
        villa={villa as unknown as Villa}
        icalContent={
          <div className="space-y-4">
            <VillaIcalPanel
              villaId={villa.id}
              icalUrl={(villa.ical_url as string) ?? null}
              otaChannels={(villa.ota_channels as Array<{ source: string; ical_url: string; label?: string }>) ?? null}
            />
            <Link
              href={`/dashboard/villas/${villa.id}/disponibilites`}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-navy/60 transition-colors hover:text-navy"
            >
              <KayvilaPngIcon name="calendar" size={20} alt="" />
              Gérer les disponibilités
            </Link>
          </div>
        }
        photosFooter={
          <Link
            href={`/dashboard/villas/${villa.id}/photos`}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-navy/60 transition-colors hover:text-navy"
          >
            <KayvilaPngIcon name="camera" size={20} alt="" />
            Gérer les photos (page dédiée)
          </Link>
        }
      />
    </div>
  );
}
