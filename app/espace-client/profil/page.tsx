"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { ProfileForm } from "@/components/espace-client/ProfileForm";
import { FileText, Download, Heart, Calendar, Clock, Baby } from "lucide-react";
import { Button } from "@/components/espace-client/tenant-ui";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  linkAsButtonClasses,
  Spinner,
} from "@/components/espace-client/tenant-ui";

export default function ProfilPage() {
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allergies, setAllergies] = useState("");
  const [specialOccasion, setSpecialOccasion] = useState("");
  const [specialOccasionDate, setSpecialOccasionDate] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [needsBabyBed, setNeedsBabyBed] = useState(false);
  const [needsHighChair, setNeedsHighChair] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(session.user);
      setLoading(false);
    })();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("allergies, special_occasion, special_occasion_date, estimated_arrival, needs_baby_bed, needs_high_chair").eq("id", user.id).maybeSingle();
      if (data) {
        setAllergies(data.allergies ?? "");
        setSpecialOccasion(data.special_occasion ?? "");
        setSpecialOccasionDate(data.special_occasion_date ?? "");
        setEstimatedArrival(data.estimated_arrival ?? "");
        setNeedsBabyBed(data.needs_baby_bed ?? false);
        setNeedsHighChair(data.needs_high_chair ?? false);
      }
    })();
  }, [supabase, user]);

  const metadata = user?.user_metadata ?? {};

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-lg rounded-none border border-navy/10 bg-white shadow-none">
        <CardContent className="space-y-5 px-8 py-14 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-navy/30">Profil</p>
          <p className="font-display text-xl text-navy">Connexion requise</p>
          <p className="mx-auto max-w-md text-sm text-navy/50">
            Connectez-vous pour accéder à vos informations personnelles.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/login?redirect=/espace-client/profil"
              className={linkAsButtonClasses("primary", "md", "rounded-none uppercase no-underline")}
            >
              Se connecter
            </Link>
            <Link
              href="/villas"
              className={linkAsButtonClasses("outline", "md", "rounded-none border-navy/25 uppercase no-underline")}
            >
              Voir les villas
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user?.id) return;
    setProfileLoading(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      allergies,
      special_occasion: specialOccasion,
      special_occasion_date: specialOccasionDate || null,
      estimated_arrival: estimatedArrival,
      needs_baby_bed: needsBabyBed,
      needs_high_chair: needsHighChair,
    });
    setProfileLoading(false);
    if (!error) { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }
  };

  return (
    <div className="space-y-8 max-w-md">
      <div>
        <h1 className="font-display text-2xl text-navy">Mon profil</h1>
        <p className="text-sm text-navy/50 mt-1">Gérez vos informations personnelles</p>
      </div>

      <Card className="rounded-none border border-navy/10 bg-white shadow-none">
        <CardHeader className="px-6 pb-0 pt-6">
          <CardTitle className="font-display text-base font-normal text-navy">
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ProfileForm
            email={user.email ?? ""}
            initialName={metadata.full_name ?? ""}
            initialPhone={metadata.phone ?? ""}
            userId={user.id}
            currentAvatar={metadata.avatar_url}
            demoMode={false}
          />
        </CardContent>
      </Card>

      {/* Préférences de séjour */}
      <Card className="rounded-none border border-navy/10 bg-white shadow-none">
        <CardHeader className="px-6 pb-0 pt-6">
          <CardTitle className="flex items-center gap-2 font-display text-base font-normal text-navy">
            <Heart size={16} className="text-gold" />
            Préférences de séjour
          </CardTitle>
          <p className="text-xs text-navy/40 mt-1">Ces informations aident notre équipe à préparer votre accueil.</p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-2">Allergies & régimes alimentaires</label>
              <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="ex: arachides, lactose, végétarien" className="w-full border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/50" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-2">Occasion spéciale</label>
                <select value={specialOccasion} onChange={(e) => setSpecialOccasion(e.target.value)} className="w-full border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/50">
                  <option value="">Aucune</option>
                  <option value="anniversary">Anniversaire de mariage</option>
                  <option value="birthday">Anniversaire</option>
                  <option value="honeymoon">Lune de miel</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-2">Date</label>
                <input type="date" value={specialOccasionDate} onChange={(e) => setSpecialOccasionDate(e.target.value)} className="w-full border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/50" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-2"><Clock size={12} className="inline mr-1" />Heure d'arrivée estimée</label>
              <select value={estimatedArrival} onChange={(e) => setEstimatedArrival(e.target.value)} className="w-full border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/50">
                <option value="">Non précisée</option>
                {Array.from({ length: 9 }, (_, i) => i + 14).map(h => (<option key={h} value={`${h}:00`}>{h}:00</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-2"><Baby size={12} className="inline mr-1" />Équipement bébé</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-navy/70 cursor-pointer">
                  <input type="checkbox" checked={needsBabyBed} onChange={(e) => setNeedsBabyBed(e.target.checked)} className="w-4 h-4 border-navy/20 text-gold focus:ring-gold" />
                  Lit bébé
                </label>
                <label className="flex items-center gap-2 text-sm text-navy/70 cursor-pointer">
                  <input type="checkbox" checked={needsHighChair} onChange={(e) => setNeedsHighChair(e.target.checked)} className="w-4 h-4 border-navy/20 text-gold focus:ring-gold" />
                  Chaise haute
                </label>
              </div>
            </div>
            {profileSaved && <p className="text-[11px] text-emerald-600 font-medium">✓ Préférences sauvegardées</p>}
            <Button type="submit" variant="primary" fullWidth disabled={profileLoading} className="h-12 rounded-xl border-0 bg-navy text-[11px] font-semibold uppercase tracking-[0.15em] text-white hover:bg-gold hover:text-navy">
              {profileLoading ? "Enregistrement..." : "Enregistrer les préférences"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-none border border-navy/10 bg-white shadow-none">
        <CardHeader className="px-6 pb-0 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display text-base font-normal text-navy">
              <FileText size={16} className="text-gold" />
              Mes documents
            </CardTitle>
            <Chip color="default" className="text-[10px] uppercase tracking-[0.2em]">
              Bientôt disponible
            </Chip>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Download size={32} className="text-navy/20" />
            <p className="text-sm text-navy/40">
              Vos contrats et factures apparaîtront ici dès qu&apos;ils seront disponibles.
            </p>
            <a
              href="/contact"
              className="text-[11px] font-bold uppercase tracking-widest text-gold transition-colors hover:text-navy"
            >
              Demander un document →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
