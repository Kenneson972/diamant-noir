"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { TenantAvatar } from "@/components/espace-client/TenantAvatar";
import { TextField, Label, Input, Description, Button, Alert } from "@heroui/react";
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
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description className="text-xs">Mode démo — les modifications ne sont pas sauvegardées.</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <div className="flex items-center gap-5 pb-6 mb-6 border-b border-navy/8">
        <TenantAvatar name={name} url={displayAvatar} size="lg" className="border border-navy/10 shrink-0" />
        {!demoMode && userId ? (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-navy/40 mb-2">Photo de profil</p>
            <label className="cursor-pointer inline-flex items-center gap-2 border border-navy/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/50 hover:border-navy hover:text-navy transition-colors">
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
            <p className="text-[9px] text-navy/25 mt-1.5">JPG, PNG ou WebP · max 2 Mo</p>
          </div>
        ) : null}
      </div>

      <TextField value={email} isReadOnly isDisabled className="w-full">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Adresse e-mail</Label>
        <Input type="email" className="rounded-xl bg-navy/5 text-navy/50 border-navy/10" />
        <Description className="text-[10px] text-navy/30">L&apos;email ne peut pas être modifié.</Description>
      </TextField>

      <TextField value={name} onChange={setName} isDisabled={demoMode} className="w-full">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Nom complet</Label>
        <Input placeholder="Votre nom" className="rounded-xl border-navy/20" />
      </TextField>

      <TextField value={phone} onChange={setPhone} isDisabled={demoMode} className="w-full">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Téléphone</Label>
        <Input type="tel" placeholder="+596 696 00 00 00" className="rounded-xl border-navy/20" />
      </TextField>

      {error && (
        <Alert status="danger" className="rounded-none border-red-200">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description className="text-xs">{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {saved && (
        <Alert status="success" className="rounded-none border-emerald-200">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description className="text-xs">Modifications sauvegardées.</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        isDisabled={loading || demoMode}
        className="h-12 rounded-xl bg-navy text-white font-bold uppercase tracking-widest text-[10px] hover:bg-gold hover:text-navy border-0"
      >
        {loading ? (
          <span className="flex items-center gap-2 justify-center">
            <Loader2 size={16} className="animate-spin" /> Enregistrement…
          </span>
        ) : saved ? (
          <span className="flex items-center gap-2 justify-center">
            <Check size={16} /> Sauvegardé
          </span>
        ) : (
          "Sauvegarder"
        )}
      </Button>
    </form>
  );
}
