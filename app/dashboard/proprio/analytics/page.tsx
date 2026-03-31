"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, Eye, MousePointer, CreditCard, Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase";

type VillaStats = {
  villaId: string;
  villaName: string;
  views: number;
  clicks: number;
  bookings: number;
  revenue: number;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [stats, setStats] = useState<VillaStats[]>([]);
  const [loading, setLoading] = useState(true);

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
    async function fetchStats() {
      const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/dashboard/analytics-villas", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setStats(Array.isArray(data) ? data : []);
        }
      } catch {
        setStats([]);
      }
      setLoading(false);
    }
    fetchStats();
  }, [supabase, router]);

  return (
    <main className="min-h-screen bg-offwhite">
      <header className="safe-top sticky top-0 z-40 w-full border-b bg-white/95 md:bg-white/80 md:backdrop-blur-md">
        <div className="page-px mx-auto flex h-16 max-w-7xl items-center justify-between gap-2">
          <Link href="/dashboard/proprio" className="tap-target flex items-center gap-2 text-navy/70 hover:text-navy">
            <ArrowLeft size={20} />
            Retour
          </Link>
          <h1 className="flex min-w-0 items-center gap-2 truncate font-display text-base text-navy sm:text-lg">
            <BarChart3 size={22} />
            <span className="truncate">Analytics par villa</span>
          </h1>
        </div>
      </header>

      <div className="page-px mx-auto max-w-5xl py-8 md:py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : stats.length === 0 ? (
          <p className="text-navy/60 text-center py-12">
            Aucune donnée pour le moment. Les vues et clics sur les fiches villas seront enregistrés ici (table villa_events).
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-navy/10 bg-white">
            <table className="min-w-[640px] w-full overflow-hidden">
              <thead>
                <tr className="bg-navy/5 text-left text-xs uppercase tracking-wider text-navy/70">
                  <th className="p-4 font-semibold">Villa</th>
                  <th className="p-4 font-semibold flex items-center gap-1"><Eye size={14} /> Vues</th>
                  <th className="p-4 font-semibold flex items-center gap-1"><MousePointer size={14} /> Clics</th>
                  <th className="p-4 font-semibold">Résas</th>
                  <th className="p-4 font-semibold flex items-center gap-1"><CreditCard size={14} /> CA (€)</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.villaId} className="border-t border-navy/10 hover:bg-navy/5">
                    <td className="p-4 font-medium text-navy">{s.villaName}</td>
                    <td className="p-4 text-navy/70">{s.views}</td>
                    <td className="p-4 text-navy/70">{s.clicks}</td>
                    <td className="p-4 text-navy/70">{s.bookings}</td>
                    <td className="p-4 text-navy font-medium">{s.revenue.toLocaleString("fr-FR")} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
