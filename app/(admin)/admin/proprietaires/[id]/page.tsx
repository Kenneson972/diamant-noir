import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldOff, Shield } from "lucide-react";
import { OwnerTabs } from "@/components/dashboard/admin/OwnerTabs";

export const metadata: Metadata = {
  title: "Détail Propriétaire — Administration Kayvila",
};

interface OwnerDetail {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  suspended: boolean;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarding_completed: boolean;
}

interface VillaSummary {
  id: string;
  name: string;
  slug: string | null;
  price_per_night: number;
  is_published: boolean;
  commission_rate: number;
  image_urls: string[] | null;
  capacity: number;
}

interface BookingSummary {
  id: string;
  villa_id: string;
  start_date: string;
  end_date: string;
  total_price_cents: number;
  status: string;
  guest_name: string | null;
}

async function getOwnerDetail(id: string) {
  const supabase = supabaseAdmin();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !profile) return null;

  const { data: villas, error: villasError } = await supabase
    .from("villas")
    .select("id, name, slug, price_per_night, is_published, commission_rate, image_urls, capacity")
    .eq("owner_id", id)
    .order("created_at", { ascending: false });

  if (villasError) {
    console.error("getOwnerDetail villas:", villasError);
  }

  const villaIds = (villas ?? []).map((v) => v.id);
  let bookings: BookingSummary[] = [];
  let totalRevenueCents = 0;

  if (villaIds.length > 0) {
    const { data: b } = await supabase
      .from("bookings")
      .select("id, villa_id, start_date, end_date, total_price_cents, status, guest_name")
      .eq("status", "confirmed")
      .in("villa_id", villaIds)
      .order("start_date", { ascending: false })
      .limit(50);

    bookings = (b ?? []) as BookingSummary[];
    totalRevenueCents = bookings.reduce((s, b) => s + (b.total_price_cents ?? 0), 0);
  }

  return {
    profile: profile as OwnerDetail,
    villas: (villas ?? []) as VillaSummary[],
    bookings,
    stats: {
      totalRevenueCents,
      totalBookings: bookings.length,
      totalVillas: villas?.length ?? 0,
      publishedVillas: villas?.filter((v) => v.is_published).length ?? 0,
    },
  };
}

export default async function AdminOwnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getOwnerDetail(id);

  if (!data) {
    return (
      <div className="space-y-4 py-24 text-center">
        <p className="text-navy/60">Propriétaire introuvable.</p>
        <Link href="/admin/proprietaires" className="text-sm text-gold hover:underline">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const { profile, villas, bookings, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/proprietaires"
            className="flex items-center gap-1 text-sm text-muted hover:text-navy transition-colors"
          >
            <ArrowLeft size={16} /> Propriétaires
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/8 text-lg font-bold text-navy">
              {(profile.full_name ?? profile.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">
                {profile.full_name ?? "Sans nom"}
              </h1>
              <p className="text-sm text-muted">{profile.email}</p>
            </div>
          </div>
          {profile.suspended && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
              Suspendu
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-4 py-2 text-xs font-medium text-navy hover:bg-navy/5 transition-colors"
            >
              <Mail size={14} /> Contacter
            </a>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-4 py-2 text-xs font-medium text-navy">
            <Shield size={14} />
            {profile.stripe_connect_onboarding_completed
              ? "Stripe Connecté"
              : profile.stripe_connect_account_id
                ? "Stripe En attente"
                : "Stripe Non configuré"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <OwnerTabs
        ownerId={profile.id}
        profile={profile}
        villas={villas}
        bookings={bookings}
        stats={stats}
      />
    </div>
  );
}
