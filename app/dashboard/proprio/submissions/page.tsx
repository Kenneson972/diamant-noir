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
    <main className="min-h-screen bg-offwhite">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/dashboard/proprio"
            className="flex items-center gap-2 text-navy/70 hover:text-navy"
          >
            <ArrowLeft size={20} />
            Retour
          </Link>
          <h1 className="font-display text-lg text-navy">Soumissions villas</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
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
                className="bg-white border border-navy/10 rounded-xl p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg text-navy">{s.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          s.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : s.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : s.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {statusLabel[s.status] || s.status}
                      </span>
                    </div>
                    <a
                      href={`mailto:${s.email}`}
                      className="flex items-center gap-1 text-sm text-navy/70 hover:text-gold"
                    >
                      <Mail size={14} />
                      {s.email}
                    </a>
                    {s.villa_name && (
                      <p className="flex items-center gap-1 text-sm text-navy/70">
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
                        className="text-sm text-gold hover:underline"
                      >
                        Voir annonce Airbnb
                      </a>
                    )}
                    {s.no_photos && (
                      <p className="text-xs text-navy/60">Sans photos — Diamant s&apos;en charge</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white rounded-full"
                          onClick={() => updateStatus(s.id, "accepted")}
                          disabled={updating === s.id}
                        >
                          {updating === s.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Accepter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50 rounded-full"
                          onClick={() => updateStatus(s.id, "rejected")}
                          disabled={updating === s.id}
                        >
                          <X size={14} />
                          Refuser
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => updateStatus(s.id, "info_requested")}
                          disabled={updating === s.id}
                        >
                          <MessageCircle size={14} />
                          Demander infos
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-navy/50 mt-3">
                  Reçue le {new Date(s.created_at).toLocaleDateString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
