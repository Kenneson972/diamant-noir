"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { ProfileForm } from "@/components/espace-client/ProfileForm";
import { Baby } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { Button, Chip } from "@heroui/react";
import Link from "next/link";
import { Spinner } from "@/components/espace-client/tenant-ui";
import { KayvilaEmptyState, KayvilaTenantWidget } from "@/components/ui/pro";
import { tenantFieldClass, tenantLabelClass } from "@/components/espace-client/tenant-form-styles";

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
      const { data } = await supabase
        .from("profiles")
        .select(
          "allergies, special_occasion, special_occasion_date, estimated_arrival, needs_baby_bed, needs_high_chair"
        )
        .eq("id", user.id)
        .maybeSingle();
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
    if (!error) {
      setProfileSaved(true);
      window.setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  if (loading) {
    return (
      <>
        <h1 className="font-display text-2xl font-normal text-navy mb-6">Mon profil</h1>
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-gold" />
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <h1 className="font-display text-2xl font-normal text-navy mb-6">Mon profil</h1>
        <KayvilaEmptyState
          title="Connexion requise"
          description="Connectez-vous pour accéder à vos informations personnelles."
          actionLabel="Se connecter"
          actionHref="/login?redirect=/espace-client/profil"
        />
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-normal text-navy mb-6">Mon profil</h1>
      <div className="mx-auto max-w-2xl space-y-6">
        <p className="text-sm text-navy/55">Gérez vos informations et préférences d&apos;accueil.</p>

        <KayvilaTenantWidget title="Informations personnelles">
          <ProfileForm
            email={user.email ?? ""}
            initialName={metadata.full_name ?? ""}
            initialPhone={metadata.phone ?? ""}
            userId={user.id}
            currentAvatar={metadata.avatar_url}
            demoMode={false}
          />
        </KayvilaTenantWidget>

        <KayvilaTenantWidget
          title="Préférences de séjour"
          description="Ces informations aident notre équipe à préparer votre accueil."
        >
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className={tenantLabelClass}>Allergies & régimes alimentaires</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="ex: arachides, lactose, végétarien"
                className={tenantFieldClass}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={tenantLabelClass}>Occasion spéciale</label>
                <select
                  value={specialOccasion}
                  onChange={(e) => setSpecialOccasion(e.target.value)}
                  className={tenantFieldClass}
                >
                  <option value="">Aucune</option>
                  <option value="anniversary">Anniversaire de mariage</option>
                  <option value="birthday">Anniversaire</option>
                  <option value="honeymoon">Lune de miel</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className={tenantLabelClass}>Date</label>
                <input
                  type="date"
                  value={specialOccasionDate}
                  onChange={(e) => setSpecialOccasionDate(e.target.value)}
                  className={tenantFieldClass}
                />
              </div>
            </div>
            <div>
              <label className={tenantLabelClass}>
                <KayvilaPngIcon name="clock" size={18} alt="" className="mr-1 inline" aria-hidden />
                Heure d&apos;arrivée estimée
              </label>
              <select
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(e.target.value)}
                className={tenantFieldClass}
              >
                <option value="">Non précisée</option>
                {Array.from({ length: 9 }, (_, i) => i + 14).map((h) => (
                  <option key={h} value={`${h}:00`}>
                    {h}:00
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={tenantLabelClass}>
                <Baby size={12} className="mr-1 inline" aria-hidden />
                Équipement bébé
              </label>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-navy/70">
                  <input
                    type="checkbox"
                    checked={needsBabyBed}
                    onChange={(e) => setNeedsBabyBed(e.target.checked)}
                    className="h-4 w-4 border-navy/20 text-gold focus:ring-gold"
                  />
                  Lit bébé
                </label>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-navy/70">
                  <input
                    type="checkbox"
                    checked={needsHighChair}
                    onChange={(e) => setNeedsHighChair(e.target.checked)}
                    className="h-4 w-4 border-navy/20 text-gold focus:ring-gold"
                  />
                  Chaise haute
                </label>
              </div>
            </div>
            {profileSaved ? (
              <p role="status" className="text-[11px] font-medium text-emerald-700">
                Préférences sauvegardées
              </p>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isDisabled={profileLoading}
              isPending={profileLoading}
              className="min-h-[48px] rounded-none bg-navy text-[10px] font-bold uppercase tracking-[0.2em] text-white data-[hover=true]:bg-gold data-[hover=true]:text-navy"
            >
              Enregistrer les préférences
            </Button>
          </form>
        </KayvilaTenantWidget>

        <KayvilaTenantWidget
          title="Mes documents"
          description="Contrats et factures de séjour"
          action={
            <Chip size="sm" variant="soft" color="default" className="uppercase">
              Bientôt
            </Chip>
          }
        >
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <KayvilaPngIcon name="download" size={24} alt="" className="text-navy/60" aria-hidden />
            <p className="max-w-sm text-sm text-navy/55">
              Vos contrats et factures apparaîtront ici dès qu&apos;ils seront disponibles.
            </p>
            <Link
              href="/contact"
              className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold transition-colors hover:text-navy"
            >
              Demander un document →
            </Link>
          </div>
        </KayvilaTenantWidget>
      </div>
    </>
  );
}
