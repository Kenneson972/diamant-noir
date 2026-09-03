"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { ProfileForm } from "@/components/espace-client/ProfileForm";
import { Baby } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Button } from "@heroui/react";
import { Spinner } from "@/components/espace-client/tenant-ui";
import { KayvilaEmptyState, KayvilaTenantWidget } from "@/components/ui/pro";
import { TenantSectionHeader } from "@/components/espace-client/TenantSectionHeader";
import { tenantFieldClass, tenantLabelClass } from "@/components/espace-client/tenant-form-styles";
import { useLocale } from "@/contexts/LocaleContext";

export default function ProfilPage() {
  const { t } = useLocale();
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
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [googleLinkError, setGoogleLinkError] = useState("");

  const googleLinked = user?.identities?.some((i: { provider?: string }) => i.provider === "google") ?? false;

  const handleLinkGoogle = async () => {
    if (!supabase) return;
    setLinkingGoogle(true);
    setGoogleLinkError("");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=/espace-client/profil` },
    });
    if (error) {
      setLinkingGoogle(false);
      setGoogleLinkError(t("auth.google_link_error"));
    }
  };

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
      <div className="mx-auto max-w-2xl space-y-6">
        <TenantSectionHeader title={t("client.my_profile")} />
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-gold" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <TenantSectionHeader title={t("client.my_profile")} />
        <KayvilaEmptyState
          title={t("client.profil_login_required_title")}
          description={t("client.profil_login_required_desc")}
          actionLabel={t("client.profil_login_cta")}
          actionHref="/login?redirect=/espace-client/profil"
        />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-6">
        <TenantSectionHeader
          title={t("client.my_profile")}
          description={t("client.profil_description")}
        />

        <KayvilaTenantWidget title={t("client.profil_personal_info_title")}>
          <ProfileForm
            email={user.email ?? ""}
            initialName={metadata.full_name ?? ""}
            initialPhone={metadata.phone ?? ""}
            userId={user.id}
            currentAvatar={metadata.avatar_url}
            demoMode={false}
          />
        </KayvilaTenantWidget>

        <KayvilaTenantWidget title={t("auth.security_title")}>
          {googleLinked ? (
            <div className="flex items-center gap-3 rounded bg-gray-50 px-4 py-3">
              <GoogleIcon className="h-4 w-4 shrink-0" />
              <p className="text-sm text-navy">{t("auth.google_linked")}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLinkGoogle}
              disabled={linkingGoogle}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-3 border border-navy/20 bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-navy/5 disabled:opacity-50"
            >
              {linkingGoogle ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              {t("auth.link_google")}
            </button>
          )}
          {googleLinkError && (
            <p role="alert" className="text-sm text-red-700">
              {googleLinkError}
            </p>
          )}
        </KayvilaTenantWidget>

        <KayvilaTenantWidget
          title={t("client.profil_stay_preferences_title")}
          description={t("client.profil_stay_preferences_desc")}
        >
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className={tenantLabelClass}>{t("client.profil_allergies_label")}</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder={t("client.profil_allergies_placeholder")}
                className={tenantFieldClass}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={tenantLabelClass}>{t("client.profil_occasion_label")}</label>
                <select
                  value={specialOccasion}
                  onChange={(e) => setSpecialOccasion(e.target.value)}
                  className={tenantFieldClass}
                >
                  <option value="">{t("client.profil_occasion_none")}</option>
                  <option value="anniversary">{t("client.profil_occasion_anniversary")}</option>
                  <option value="birthday">{t("client.profil_occasion_birthday")}</option>
                  <option value="honeymoon">{t("client.profil_occasion_honeymoon")}</option>
                  <option value="other">{t("client.profil_occasion_other")}</option>
                </select>
              </div>
              <div>
                <label className={tenantLabelClass}>{t("client.profil_date_label")}</label>
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
                {t("client.profil_arrival_label")}
              </label>
              <select
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(e.target.value)}
                className={tenantFieldClass}
              >
                <option value="">{t("client.profil_arrival_unspecified")}</option>
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
                {t("client.profil_baby_equipment_label")}
              </label>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-navy/70">
                  <input
                    type="checkbox"
                    checked={needsBabyBed}
                    onChange={(e) => setNeedsBabyBed(e.target.checked)}
                    className="h-4 w-4 border-navy/20 text-gold focus:ring-gold"
                  />
                  {t("client.profil_baby_bed")}
                </label>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-navy/70">
                  <input
                    type="checkbox"
                    checked={needsHighChair}
                    onChange={(e) => setNeedsHighChair(e.target.checked)}
                    className="h-4 w-4 border-navy/20 text-gold focus:ring-gold"
                  />
                  {t("client.profil_high_chair")}
                </label>
              </div>
            </div>
            {profileSaved ? (
              <p role="status" className="text-[11px] font-medium text-emerald-700">
                {t("client.profil_saved")}
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
              {t("client.profil_save_cta")}
            </Button>
          </form>
        </KayvilaTenantWidget>

      </div>
    </>
  );
}
