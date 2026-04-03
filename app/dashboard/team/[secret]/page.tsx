import { TeamCalendar } from "@/components/TeamCalendar";

export default function TeamDashboard() {
  return (
    <main className="min-h-screen bg-offwhite px-6 pt-12 pb-12 text-navy">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
            Accès Équipe
          </p>
          <h1 className="font-display text-2xl">Arrivées & Départs</h1>
          <p className="text-sm text-slate-600">
            Calendrier en lecture seule pour les équipes d'opérations et de service.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
            Arrivée
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
            Départ
          </span>
        </div>
        <TeamCalendar />
      </div>
    </main>
  );
}
