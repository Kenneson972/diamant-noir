"use client";

import { useCallback, useRef, useState } from "react";
import { Home, Link as LinkIcon, ImageOff, ArrowRight, Check, Upload, X, Image as ImageIcon } from "lucide-react";

type PhotoFile = {
  id: string;
  file: File;
  preview: string;
  uploadedUrl?: string;
  error?: string;
};

const MAX_PHOTOS = 15;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export function VillaSubmissionForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [noPhotos, setNoPhotos] = useState(false);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    const toAdd: PhotoFile[] = [];
    for (const file of list) {
      if (!ALLOWED.includes(file.type)) continue;
      if (file.size > MAX_SIZE) continue;
      if (photos.length + toAdd.length >= MAX_PHOTOS) break;
      toAdd.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }
    setPhotos((prev) => [...prev, ...toAdd]);
  }, [photos.length]);

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const p = prev.find((x) => x.id === id);
      if (p) URL.revokeObjectURL(p.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const photo of photos) {
      if (photo.uploadedUrl) {
        urls.push(photo.uploadedUrl);
        continue;
      }
      const fd = new FormData();
      fd.append("file", photo.file);
      const res = await fetch("/api/villa-photo-upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        urls.push(url);
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, uploadedUrl: url } : p))
        );
      } else {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, error: "Échec upload" } : p))
        );
      }
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const photo_urls = photos.length > 0 ? await uploadPhotos() : [];

      const res = await fetch("/api/villa-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone") || undefined,
          villa_name: data.get("villa_name") || undefined,
          villa_location: data.get("villa_location") || undefined,
          villa_description: data.get("villa_description") || undefined,
          airbnb_url: data.get("airbnb_url") || undefined,
          no_photos: noPhotos,
          message: data.get("message") || undefined,
          photo_urls: photo_urls.length > 0 ? photo_urls : undefined,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        form.reset();
        setNoPhotos(false);
        photos.forEach((p) => URL.revokeObjectURL(p.preview));
        setPhotos([]);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 border border-gold/30 bg-gold/10 p-6">
        <p className="text-sm text-navy/80">
          Après étude de votre dossier, nous vous recontacterons. Une réponse automatique de
          confirmation vous sera envoyée par email. Si votre villa est retenue, nous vous proposerons
          une collaboration officielle et, après validation, une inscription à l&apos;espace
          propriétaire.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="smv-name" className="mb-1 block text-sm font-medium text-navy">
              Nom *
            </label>
            <input
              id="smv-name"
              name="name"
              type="text"
              required
              className="w-full rounded-none border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="smv-email" className="mb-1 block text-sm font-medium text-navy">
              Email *
            </label>
            <input
              id="smv-email"
              name="email"
              type="email"
              required
              className="w-full rounded-none border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="smv-phone" className="mb-1 block text-sm font-medium text-navy">
            Téléphone
          </label>
          <input
            id="smv-phone"
            name="phone"
            type="tel"
            className="w-full rounded-none border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
          />
        </div>

        <div className="border-t border-navy/10 pt-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-navy">
            <LinkIcon size={18} className="text-gold" aria-hidden />
            Lien Airbnb (optionnel)
          </p>
          <input
            id="smv-airbnb"
            name="airbnb_url"
            type="url"
            placeholder="https://www.airbnb.fr/rooms/..."
            className="w-full rounded-none border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
          />
          <p className="mt-1 text-xs text-navy/60">
            Collez l&apos;URL de votre annonce Airbnb pour que nous récupérions automatiquement les
            détails et photos.
          </p>
        </div>

        <div className="border-t border-navy/10 pt-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-navy">
            <Home size={18} className="text-gold" aria-hidden />
            Ou décrivez votre villa
          </p>
          <div className="space-y-4">
            <input
              id="smv-villa-name"
              name="villa_name"
              type="text"
              placeholder="Nom de la villa"
              className="w-full rounded-none border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
            />
            <input
              id="smv-villa-location"
              name="villa_location"
              type="text"
              placeholder="Localisation (ville, quartier)"
              className="w-full rounded-none border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
            />
            <textarea
              id="smv-villa-description"
              name="villa_description"
              rows={3}
              placeholder="Description courte (capacité, équipements...)"
              className="w-full resize-none rounded-none border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        {/* ── Zone drag & drop photos ── */}
        {!noPhotos && (
          <div className="border-t border-navy/10 pt-6">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-navy">
              <ImageIcon size={18} className="text-gold" aria-hidden />
              Photos de la villa{" "}
              <span className="text-xs font-normal text-navy/50">
                (optionnel — max {MAX_PHOTOS}, 10 Mo chacune)
              </span>
            </p>

            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Déposer des photos ici ou cliquer pour sélectionner"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-6 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                isDragging
                  ? "border-gold bg-gold/5"
                  : "border-navy/20 bg-white hover:border-gold/60 hover:bg-gold/[0.02]"
              }`}
            >
              <Upload size={28} className="text-navy/30" aria-hidden />
              <p className="text-sm text-navy/50">
                Glissez vos photos ici ou{" "}
                <span className="font-semibold text-navy/70 underline underline-offset-2">
                  cliquez pour sélectionner
                </span>
              </p>
              <p className="text-xs text-navy/35">JPG, PNG, WEBP — max 10 Mo par fichier</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              className="sr-only"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />

            {/* Prévisualisations */}
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {photos.map((p) => (
                  <div key={p.id} className="group relative aspect-square overflow-hidden bg-navy/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.preview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {p.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/70 text-[9px] font-bold uppercase text-white">
                        Erreur
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }}
                      aria-label="Supprimer cette photo"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    >
                      <X size={12} aria-hidden />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square items-center justify-center border-2 border-dashed border-navy/15 bg-white text-navy/30 transition-colors hover:border-gold/50 hover:text-gold/60"
                    aria-label="Ajouter des photos"
                  >
                    <Upload size={20} aria-hidden />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={noPhotos}
            onChange={(e) => {
              setNoPhotos(e.target.checked);
              if (e.target.checked) {
                photos.forEach((p) => URL.revokeObjectURL(p.preview));
                setPhotos([]);
              }
            }}
            name="no_photos"
            className="rounded border-navy/30 text-gold focus:ring-gold"
          />
          <span className="flex items-center gap-2 text-sm text-navy/80">
            <ImageOff size={16} aria-hidden />
            Je n&apos;ai pas de photos — Diamant Noir s&apos;en charge (état des lieux + photos
            professionnelles)
          </span>
        </label>

        <div>
          <label htmlFor="smv-message" className="mb-1 block text-sm font-medium text-navy">
            Message complémentaire
          </label>
          <textarea
            id="smv-message"
            name="message"
            rows={3}
            className="w-full resize-none rounded-none border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
          />
        </div>

        {status === "sent" && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-600">
            <Check size={20} aria-hidden />
            <span>Demande envoyée. Vous allez recevoir un email de confirmation.</span>
          </div>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600">
            L&apos;envoi a échoué. Réessayez ou contactez-nous via la page Contact.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="flex min-h-[44px] w-full items-center justify-center gap-3 border border-navy bg-navy px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-gold hover:bg-gold hover:text-navy disabled:opacity-50"
        >
          {status === "sending"
            ? photos.length > 0
              ? "Upload en cours..."
              : "Envoi en cours..."
            : "Envoyer ma demande"}
          <ArrowRight size={18} aria-hidden />
        </button>
      </form>
    </div>
  );
}
