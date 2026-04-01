"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Home, Check, X, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/supabase";

type Submission = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  villa_name: string | null;
  villa_location: string | null;
  airbnb_url: string | null;
  no_photos: boolean;
  status: string;
  created_at: string;
};

import { ProprioPageIntro } from "@/components/dashboard/proprio/ui";

export default function SubmissionsPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
      if (!session) {
        router.push("/login");
        return;
      }
    })();
  }, [supabase, router]);

  useEffect(() => {
    async function fetchSubmissions() {
      const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/villa-submissions", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          setError("Impossible de charger les soumissions.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setSubmissions(Array.isArray(data) ? data : []);
      } catch {
        setError("Erreur réseau.");
      }
      setLoading(false);
    }
    fetchSubmissions();
  }, [supabase, router]);

  const updateStatus = async (id: string, status: string) => {
    const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
    if (!session?.access_token) return;
    setUpdating(id);
    try {
      const res = await fetch("/api/villa-submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status } : s))
        );
      }
    } finally {
      setUpdating(null);
    }
  };

  const statusLabel: Record<string, string> = {
    pending: "En attente",
    accepted: "Acceptée",
    rejected: "Refusée",
    info_requested: "Infos demandées",
  };

  return (
    <>
      <ProprioPageIntro
        eyebrow="Leads & Prospection"
        title="Soumissions de villas"
        subtitle="Gérez les demandes de propriétaires souhaitant rejoindre le catalogue Diamant Noir."
        variant="white"
      />

      <div className="page-px mx-auto max-w-4xl py-8 md:py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : submissions.length === 0 ? (
          <p className="text-navy/60 text-center py-12">Aucune soumission pour le moment.</p>
        ) : (
          <ul className="space-y-4">
            {submissions.map((s) => (
              <li
                key={s.id}
                className="group bg-white border border-navy/10 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md hover:border-gold/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-display text-xl text-navy">{s.name}</span>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${
                          s.status === "pending"
                            ? "bg-gold/10 text-gold"
                            : s.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : s.status === "rejected"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-navy/5 text-navy/70"
                        }`}
                      >
                        {statusLabel[s.status] || s.status}
                      </span>
                    </div>
                    <a
                      href={`mailto:${s.email}`}
                      className="flex items-center gap-1.5 text-sm text-navy/70 hover:text-gold transition-colors"
                    >
                      <Mail size={14} />
                      {s.email}
                    </a>
                    {s.villa_name && (
                      <p className="flex items-center gap-1.5 text-sm text-navy/70 mt-1">
                        <Home size={14} />
                        {s.villa_name}
                        {s.villa_location && ` — ${s.villa_location}`}
                      </p>
                    )}
                    {s.airbnb_url && (
                      <a
                        href={s.airbnb_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gold hover:underline mt-1 inline-block font-medium"
                      >
                        Voir annonce Airbnb
                      </a>
                    )}
                    {s.no_photos && (
                      <p className="text-[11px] uppercase tracking-widest font-bold text-navy/40 mt-2">Sans photos — Diamant s&apos;en charge</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    {s.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-navy text-white hover:bg-gold hover:text-navy rounded-full tap-target transition-all"
                          onClick={() => updateStatus(s.id, "accepted")}
                          disabled={updating === s.id}
                        >
                          {updating === s.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Accepter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-full tap-target"
                          onClick={() => updateStatus(s.id, "rejected")}
                          disabled={updating === s.id}
                        >
                          <X size={14} />
                          Refuser
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-navy/10 text-navy/70 hover:bg-navy/5 hover:text-navy rounded-full tap-target"
                          onClick={() => updateStatus(s.id, "info_requested")}
                          disabled={updating === s.id}
                        >
                          <MessageCircle size={14} />
                          Infos
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-navy/5">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-navy/40">
                    Reçue le {new Date(s.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
