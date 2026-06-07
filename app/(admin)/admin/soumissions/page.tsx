import { supabaseAdmin } from "@/lib/supabase";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { Home, Mail, Phone, MapPin, Check, X, MessageSquare } from "lucide-react";
import { AcceptRejectButtons } from "./AcceptRejectButtons";

export const dynamic = "force-dynamic";

async function getSubmissions() {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("villa_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function AdminSoumissionsPage() {
  const submissions = await getSubmissions();

  const pending = submissions.filter((s) => s.status === "pending");
  const others = submissions.filter((s) => s.status !== "pending");

  const all = [...pending, ...others];

  return (
    <div className="space-y-8">
      <AdminPageIntro
        title="Soumissions villa"
        description="Propriétaires souhaitant confier leur villa. Acceptez ou refusez chaque soumission."
      />

      {all.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Home className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">Aucune soumission pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {all.map((s: any) => (
            <div
              key={s.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-navy">
                      {s.villa_name || "Villa sans nom"}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        s.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : s.status === "accepted"
                          ? "bg-emerald-100 text-emerald-700"
                          : s.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.status === "pending" ? "En attente" : s.status === "accepted" ? "Accepté" : s.status === "rejected" ? "Refusé" : s.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-navy/60">
                    <span className="inline-flex items-center gap-1">
                      <Mail size={12} /> {s.email}
                    </span>
                    {s.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} /> {s.phone}
                      </span>
                    )}
                    {s.villa_location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} /> {s.villa_location}
                      </span>
                    )}
                  </div>

                  {s.villa_description && (
                    <p className="text-sm text-navy/50 italic">
                      <MessageSquare size={12} className="inline mr-1" />
                      {s.villa_description}
                    </p>
                  )}

                  {s.message && (
                    <p className="rounded bg-navy/[0.02] px-3 py-2 text-sm text-navy/70 italic">
                      « {s.message} »
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-[11px] text-navy/40">
                    {s.name && <span>{s.name}</span>}
                    {s.adresse_postale && <span>· {s.adresse_postale}</span>}
                    {s.chambres && <span>· {s.chambres} ch.</span>}
                    {s.salles_de_bains && <span>· {s.salles_de_bains} sdb</span>}
                    {s.airbnb_url && (
                      <a href={s.airbnb_url} target="_blank" rel="noopener" className="text-gold hover:underline">
                        Lien Airbnb ↗
                      </a>
                    )}
                    <span>· {new Date(s.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>

                {s.status === "pending" && (
                  <AcceptRejectButtons id={s.id} name={s.villa_name || s.name} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
