"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { TenantAvatar } from "@/components/espace-client/TenantAvatar";
import {
  Alert,
  AlertDescription,
  Button,
  Field,
  FieldInput,
} from "@/components/espace-client/tenant-ui";
import { Loader2, Check } from "lucide-react";

interface ProfileFormProps {
  initialName?: string;
  initialPhone?: string;
  email: string;
  userId?: string;
  currentAvatar?: string;
  demoMode?: boolean;
}

export function ProfileForm({
  initialName = "",
  initialPhone = "",
  email,
  userId,
  currentAvatar,
  demoMode = false,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | undefined>();
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  const displayAvatar = previewUrl ?? localAvatarUrl ?? currentAvatar;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (demoMode || !userId) return;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    const local = URL.createObjectURL(file);
    blobRef.current = local;
    setPreviewUrl(local);

    setUploadingAvatar(true);
    setError(null);

    const raw = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safe = ["jpg", "jpeg", "png", "webp"].includes(raw) ? raw : "jpg";
    const path = `${userId}/avatar.${safe}`;

    const { error: upErr } = await supabase.storage.from("profile-avatars").upload(path, file, {
      upsert: true,
    });

    if (upErr) {
      setUploadingAvatar(false);
      setError("Envoi impossible (format ou taille max 2 Mo).");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-avatars").getPublicUrl(path);

    const { error: metaErr } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    setUploadingAvatar(false);

    if (metaErr) {
      setError("La photo n'a pas pu être liée au compte.");
      return;
    }

    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    setPreviewUrl(null);
    setLocalAvatarUrl(publicUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    setLoading(true);
    setError(null);
    setSaved(false);

    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: name, phone },
    });

    setLoading(false);

    if (updateError) {
      setError("Impossible de sauvegarder. Veuillez réessayer.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {demoMode && (
        <Alert status="warning" className="rounded-none border-amber-200">
          <AlertDescription className="text-xs">
            Mode démo — les modifications ne sont pas sauvegardées.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex items-center gap-5 border-b border-navy/8 pb-6">
        <TenantAvatar name={name} url={displayAvatar} size="lg" className="shrink-0 border border-navy/10" />
        {!demoMode && userId ? (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-navy/40">
              Photo de profil
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 border border-navy/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/50 transition-colors hover:border-navy hover:text-navy">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
              {uploadingAvatar ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Envoi…
                </span>
              ) : (
                "Changer la photo"
              )}
            </label>
            <p className="mt-1.5 text-[10px] text-navy/25">JPG, PNG ou WebP · max 2 Mo</p>
          </div>
        ) : null}
      </div>

      <Field id="profile-email" label="Adresse e-mail" hint="L'email ne peut pas être modifié.">
        <FieldInput
          id="profile-email"
          type="email"
          value={email}
          readOnly
          disabled
          className="border-navy/10 bg-navy/5 text-navy/50"
          aria-describedby="profile-email-hint"
        />
      </Field>

      <Field id="profile-name" label="Nom complet">
        <FieldInput
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={demoMode}
          placeholder="Votre nom"
        />
      </Field>

      <Field id="profile-phone" label="Téléphone">
        <FieldInput
          id="profile-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={demoMode}
          placeholder="+596 696 00 00 00"
        />
      </Field>

      {error && (
        <Alert status="danger" className="rounded-none border-red-200">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert status="success" className="rounded-none border-emerald-200">
          <AlertDescription className="text-xs">Modifications sauvegardées.</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={loading || demoMode}
        className="h-12 rounded-xl border-0 bg-navy text-[10px] font-bold uppercase tracking-widest text-white hover:bg-gold hover:text-navy"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Enregistrement…
          </span>
        ) : saved ? (
          <span className="flex items-center justify-center gap-2">
            <Check size={16} /> Sauvegardé
          </span>
        ) : (
          "Sauvegarder"
        )}
      </Button>
    </form>
  );
}
