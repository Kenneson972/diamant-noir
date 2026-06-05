import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { User } from "lucide-react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";

export const metadata: Metadata = {
  title: "Membre — Administration Kayvila",
};

export default async function AdminMembrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await getSupabaseServer();

  const { id } = await params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/clients"
          className="text-sm text-gold hover:text-gold/80 font-medium"
        >
          ← Retour aux clients
        </Link>
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <User className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            Utilisateur introuvable.
          </p>
        </div>
      </div>
    );
  }

  const { data: villas } = await supabase
    .from("villas")
    .select("id, name, is_published")
    .eq("owner_id", id)
    .order("name");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_date, end_date, status")
    .eq("guest_email", profile.email)
    .order("start_date", { ascending: false })
    .limit(10);

  const roleLabel: Record<string, string> = {
    admin: "Administrateur",
    owner: "Propriétaire",
    proprio: "Propriétaire",
    tenant: "Locataire",
    client: "Client",
  };

  const formattedRole = roleLabel[profile.role] ?? profile.role;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/clients"
        className="text-sm text-gold hover:text-gold/80 font-medium"
      >
        ← Retour aux clients
      </Link>

      <AdminPageIntro
        title={profile.full_name ?? "Membre"}
        description={`${profile.email} · ${formattedRole}`}
        showDivider={false}
      />

      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-lg font-bold text-white">
            {(profile.full_name ?? profile.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="inline-flex items-center rounded-full bg-navy/[0.06] px-2.5 py-0.5 text-xs font-medium text-navy">
              {formattedRole}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Téléphone</p>
            <p className="mt-1 font-medium text-gray-900">
              {profile.phone ?? "Non renseigné"}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Villas</p>
            <p className="mt-1 font-medium text-gray-900">
              {villas?.length ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Réservations</p>
            <p className="mt-1 font-medium text-gray-900">
              {bookings?.length ?? 0}
            </p>
          </div>
        </div>

        {villas && villas.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold text-navy">Villas</h2>
            <div className="divide-y divide-gray-100 rounded-lg border">
              {villas.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">
                    {v.name}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      v.is_published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {v.is_published ? "Publiée" : "Brouillon"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
