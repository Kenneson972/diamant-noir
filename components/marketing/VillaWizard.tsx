"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  X,
  Image as ImageIcon,
  ImageOff,
  Building2,
  TrendingUp,
  MessageSquare,
  User,
  MapPin,
  ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardData = {
  // Step 1
  villa_name: string;
  villa_location: string;
  villa_type: string;
  surface: string;
  capacity: string;
  equipements: string[];
  // Step 2
  already_listed: string;
  airbnb_url: string;
  monthly_revenue: string;
  // Step 3
  management_type: string;
  message: string;
  // Step 4
  name: string;
  email: string;
  phone: string;
  no_photos: boolean;
};

type PhotoFile = {
  id: string;
  file: File;
  preview: string;
  uploadedUrl?: string;
  error?: string;
};

const INITIAL: WizardData = {
  villa_name: "",
  villa_location: "",
  villa_type: "",
  surface: "",
  capacity: "",
  equipements: [],
  already_listed: "",
  airbnb_url: "",
  monthly_revenue: "",
  management_type: "",
  message: "",
  name: "",
  email: "",
  phone: "",
  no_photos: false,
};

const STEPS = [
  { label: "Votre bien", icon: Building2 },
  { label: "Situation", icon: TrendingUp },
  { label: "Attentes", icon: MessageSquare },
  { label: "Contact", icon: User },
];

const MAX_PHOTOS = 15;
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl">
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center border transition-colors duration-300 ${
                    done
                      ? "border-gold bg-gold text-navy"
                      : active
                      ? "border-navy bg-navy text-white"
                      : "border-navy/20 bg-white text-navy/30"
                  }`}
                >
                  {done ? (
                    <Check size={16} strokeWidth={2} aria-hidden />
                  ) : (
                    <span className="text-[11px] font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`hidden text-[9px] font-bold uppercase tracking-[0.2em] sm:block ${
                    active ? "text-navy" : done ? "text-gold" : "text-navy/30"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-px flex-1 transition-colors duration-500 ${
                    done ? "bg-gold" : "bg-navy/15"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 1 — Votre bien ────────────────────────────────────────────────────────

const EQUIPEMENTS = [
  "Piscine",
  "Vue mer",
  "Accès plage",
  "Jacuzzi",
  "Terrasse",
  "Climatisation",
  "Cuisine équipée",
  "Parking",
];

const VILLA_TYPES = ["Villa", "Appartement", "Bungalow", "Maison", "Autre"];

function Step1({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  const toggle = (eq: string) => {
    const next = data.equipements.includes(eq)
      ? data.equipements.filter((e) => e !== eq)
      : [...data.equipements, eq];
    onChange({ equipements: next });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40">
          Type de bien
        </p>
        <div className="flex flex-wrap gap-2">
          {VILLA_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ villa_type: t })}
              className={`border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                data.villa_type === t
                  ? "border-gold bg-gold text-navy"
                  : "border-navy/20 bg-white text-navy/60 hover:border-navy/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-navy/50">
          Nom de la villa
        </label>
        <input
          type="text"
          value={data.villa_name}
          onChange={(e) => onChange({ villa_name: e.target.value })}
          placeholder="Villa Bois Jolan, Casa del Mar…"
          className="w-full border border-navy/20 bg-white px-4 py-3.5 text-navy placeholder-navy/30 focus:border-gold focus:outline-none"
        />
      </div>

      <div className="flex items-start gap-3">
        <MapPin size={16} className="mt-5 shrink-0 text-gold" aria-hidden />
        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-navy/50">
            Localisation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={data.villa_location}
            onChange={(e) => onChange({ villa_location: e.target.value })}
            placeholder="Sainte-Anne, Le Diamant, Les Trois-Îlets…"
            className="w-full border border-navy/20 bg-white px-4 py-3.5 text-navy placeholder-navy/30 focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-navy/50">
            Surface (m²)
          </label>
          <input
            type="number"
            min="1"
            value={data.surface}
            onChange={(e) => onChange({ surface: e.target.value })}
            placeholder="120"
            className="w-full border border-navy/20 bg-white px-4 py-3.5 text-navy placeholder-navy/30 focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-navy/50">
            Capacité (personnes)
          </label>
          <input
            type="number"
            min="1"
            value={data.capacity}
            onChange={(e) => onChange({ capacity: e.target.value })}
            placeholder="8"
            className="w-full border border-navy/20 bg-white px-4 py-3.5 text-navy placeholder-navy/30 focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40">
          Équipements notables
        </p>
        <div className="flex flex-wrap gap-2">
          {EQUIPEMENTS.map((eq) => (
            <button
              key={eq}
              type="button"
              onClick={() => toggle(eq)}
              className={`border px-3 py-1.5 text-[11px] transition-colors ${
                data.equipements.includes(eq)
                  ? "border-gold bg-gold/10 font-semibold text-navy"
                  : "border-navy/15 bg-white text-navy/55 hover:border-navy/40"
              }`}
            >
              {data.equipements.includes(eq) && (
                <Check size={10} className="mr-1 inline" aria-hidden />
              )}
              {eq}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 2 — Situation actuelle ───────────────────────────────────────────────

const LISTING_OPTIONS = [
  { value: "oui", label: "Oui, déjà sur Airbnb / Booking" },
  { value: "non", label: "Non, bien non encore listé" },
  { value: "partiel", label: "Géré partiellement par moi-même" },
];

const REVENUE_RANGES = [
  "< 1 000 € / mois",
  "1 000 – 2 500 €",
  "2 500 – 5 000 €",
  "5 000 – 10 000 €",
  "> 10 000 €",
  "Je ne sais pas encore",
];

function Step2({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40">
          Votre villa est-elle actuellement en location ?
        </p>
        <div className="space-y-2">
          {LISTING_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 border p-4 transition-colors ${
                data.already_listed === opt.value
                  ? "border-gold bg-gold/5"
                  : "border-navy/15 bg-white hover:border-navy/35"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
                  data.already_listed === opt.value
                    ? "border-gold bg-gold"
                    : "border-navy/25 bg-white"
                }`}
              >
                {data.already_listed === opt.value && (
                  <Check size={11} className="text-navy" aria-hidden />
                )}
              </div>
              <input
                type="radio"
                name="already_listed"
                value={opt.value}
                checked={data.already_listed === opt.value}
                onChange={() => onChange({ already_listed: opt.value })}
                className="sr-only"
              />
              <span className="text-sm text-navy/80">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {data.already_listed === "oui" && (
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-navy/50">
            Lien Airbnb / Booking (optionnel)
          </label>
          <input
            type="url"
            value={data.airbnb_url}
            onChange={(e) => onChange({ airbnb_url: e.target.value })}
            placeholder="https://www.airbnb.fr/rooms/…"
            className="w-full border border-navy/20 bg-white px-4 py-3.5 text-navy placeholder-navy/30 focus:border-gold focus:outline-none"
          />
          <p className="mt-1 text-xs text-navy/45">
            Nous récupérons automatiquement vos données et vos photos.
          </p>
        </div>
      )}

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40">
          Revenus locatifs actuels (estimés)
        </p>
        <div className="flex flex-wrap gap-2">
          {REVENUE_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ monthly_revenue: r })}
              className={`border px-4 py-2 text-[11px] transition-colors ${
                data.monthly_revenue === r
                  ? "border-gold bg-gold font-bold text-navy"
                  : "border-navy/20 bg-white text-navy/60 hover:border-navy/50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Vos attentes ─────────────────────────────────────────────────────

const MANAGEMENT_TYPES = [
  { value: "full", label: "Gestion complète", desc: "Diamant Noir gère tout" },
  { value: "partial", label: "Gestion partielle", desc: "Je garde la main sur certaines tâches" },
  { value: "decouverte", label: "Je veux en savoir plus", desc: "Pas encore décidé" },
];

function Step3({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40">
          Type de gestion souhaité
        </p>
        <div className="space-y-2">
          {MANAGEMENT_TYPES.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-4 border p-4 transition-colors ${
                data.management_type === opt.value
                  ? "border-gold bg-gold/5"
                  : "border-navy/15 bg-white hover:border-navy/35"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
                  data.management_type === opt.value
                    ? "border-gold bg-gold"
                    : "border-navy/25 bg-white"
                }`}
              >
                {data.management_type === opt.value && (
                  <Check size={11} className="text-navy" aria-hidden />
                )}
              </div>
              <input
                type="radio"
                name="management_type"
                value={opt.value}
                checked={data.management_type === opt.value}
                onChange={() => onChange({ management_type: opt.value })}
                className="sr-only"
              />
              <div>
                <p className="text-sm font-semibold text-navy">{opt.label}</p>
                <p className="text-xs text-navy/50">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-navy/50">
          Vos attentes & contraintes particulières
        </label>
        <textarea
          rows={5}
          value={data.message}
          onChange={(e) => onChange({ message: e.target.value })}
          placeholder="Périodes bloquées, exigences particulières, questions sur la conciergerie…"
          className="w-full resize-none border border-navy/20 bg-white px-4 py-3.5 text-navy placeholder-navy/30 focus:border-gold focus:outline-none"
        />
      </div>
    </div>
  );
}

// ── Step 4 — Contact & photos ─────────────────────────────────────────────────

function Step4({
  data,
  onChange,
  photos,
  setPhotos,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  photos: PhotoFile[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoFile[]>>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
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
    },
    [photos.length, setPhotos]
  );

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const p = prev.find((x) => x.id === id);
      if (p) URL.revokeObjectURL(p.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-navy/50">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Jean Dupont"
            className="w-full border border-navy/20 bg-white px-4 py-3.5 text-navy placeholder-navy/30 focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-navy/50">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="jean@example.com"
            className="w-full border border-navy/20 bg-white px-4 py-3.5 text-navy placeholder-navy/30 focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-navy/50">
          Téléphone
        </label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="+596 696 00 00 00"
          className="w-full border border-navy/20 bg-white px-4 py-3.5 text-navy placeholder-navy/30 focus:border-gold focus:outline-none"
        />
      </div>

      {!data.no_photos && (
        <div>
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-navy/50">
            <ImageIcon size={14} className="text-gold" aria-hidden />
            Photos de la villa{" "}
            <span className="font-normal normal-case tracking-normal text-navy/35">
              (optionnel — max {MAX_PHOTOS}, 10 Mo)
            </span>
          </p>

          <div
            role="button"
            tabIndex={0}
            aria-label="Déposer des photos ici ou cliquer pour sélectionner"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-6 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
              isDragging
                ? "border-gold bg-gold/5"
                : "border-navy/20 bg-white hover:border-gold/50"
            }`}
          >
            <Upload size={28} className="text-navy/25" aria-hidden />
            <p className="text-sm text-navy/45">
              Glissez vos photos ici ou{" "}
              <span className="font-semibold text-navy/65 underline underline-offset-2">
                cliquez pour sélectionner
              </span>
            </p>
            <p className="text-xs text-navy/30">JPG, PNG, WEBP — max 10 Mo</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            className="sr-only"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />

          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="group relative aspect-square overflow-hidden bg-navy/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="h-full w-full object-cover" />
                  {p.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/70 text-[9px] font-bold uppercase text-white">
                      Erreur
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(p.id);
                    }}
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
                  className="flex aspect-square items-center justify-center border-2 border-dashed border-navy/15 text-navy/25 hover:border-gold/50 hover:text-gold/50"
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
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
            data.no_photos ? "border-gold bg-gold" : "border-navy/25 bg-white"
          }`}
        >
          {data.no_photos && <Check size={11} className="text-navy" aria-hidden />}
        </div>
        <input
          type="checkbox"
          checked={data.no_photos}
          onChange={(e) => {
            onChange({ no_photos: e.target.checked });
            if (e.target.checked) {
              photos.forEach((p) => URL.revokeObjectURL(p.preview));
              setPhotos([]);
            }
          }}
          className="sr-only"
        />
        <span className="flex items-center gap-2 text-sm text-navy/70">
          <ImageOff size={14} aria-hidden />
          Pas de photos — Diamant Noir s&apos;en charge (état des lieux + photos pro)
        </span>
      </label>
    </div>
  );
}

// ── Confirmation ──────────────────────────────────────────────────────────────

function Confirmation({ name }: { name: string }) {
  return (
    <div className="mx-auto max-w-lg py-8 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-gold bg-gold/10">
        <Check size={32} className="text-gold" strokeWidth={1.5} aria-hidden />
      </div>
      <h2 className="font-display text-3xl font-normal text-navy">
        Merci, {name || "cher propriétaire"}.
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-navy/55">
        Votre dossier a bien été reçu. Notre équipe l&apos;étudiera avec attention et vous
        recontactera sous 48 h ouvrées.
      </p>
      <p className="mt-2 text-sm text-navy/40">
        Un email de confirmation vous a été envoyé à l&apos;adresse indiquée.
      </p>
      <a
        href="/prestations"
        className="mt-10 inline-flex items-center gap-2 border border-navy bg-navy px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90"
      >
        Découvrir la conciergerie
        <ChevronRight size={14} aria-hidden />
      </a>
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep(step: number, data: WizardData): string | null {
  if (step === 0 && !data.villa_location.trim()) {
    return "Veuillez indiquer la localisation de votre villa.";
  }
  if (step === 3 && !data.name.trim()) return "Veuillez indiquer votre nom.";
  if (step === 3 && !data.email.trim()) return "Veuillez indiquer votre email.";
  if (
    step === 3 &&
    data.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  ) {
    return "Veuillez saisir un email valide.";
  }
  return null;
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function VillaWizard() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const change = (patch: Partial<WizardData>) =>
    setData((prev) => ({ ...prev, ...patch }));

  const goNext = () => {
    const err = validateStep(step, data);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
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
      const res = await fetch("/api/villa-photo-upload", {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const { url } = await res.json();
        urls.push(url);
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, uploadedUrl: url } : p))
        );
      } else {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, error: "Échec upload" } : p
          )
        );
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    const err = validateStep(3, data);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const photo_urls = photos.length > 0 ? await uploadPhotos() : [];
      const descParts = [
        data.villa_type && `Type: ${data.villa_type}`,
        data.surface && `Surface: ${data.surface} m²`,
        data.capacity && `Capacité: ${data.capacity} personnes`,
        data.equipements.length > 0 && `Équipements: ${data.equipements.join(", ")}`,
        data.already_listed && `Statut location: ${data.already_listed}`,
        data.monthly_revenue && `Revenus estimés: ${data.monthly_revenue}`,
        data.management_type && `Gestion souhaitée: ${data.management_type}`,
      ].filter(Boolean);

      const res = await fetch("/api/villa-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          villa_name: data.villa_name || undefined,
          villa_location: data.villa_location || undefined,
          villa_description: descParts.length > 0 ? descParts.join(" | ") : undefined,
          airbnb_url: data.airbnb_url || undefined,
          no_photos: data.no_photos,
          message: data.message || undefined,
          photo_urls: photo_urls.length > 0 ? photo_urls : undefined,
        }),
      });
      if (res.ok) {
        photos.forEach((p) => URL.revokeObjectURL(p.preview));
        setDone(true);
      } else {
        setError("L'envoi a échoué. Réessayez ou contactez-nous.");
      }
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <Confirmation name={data.name} />;

  return (
    <div className="mx-auto max-w-2xl">
      <ProgressBar step={step} />

      <div className="mb-8 border-b border-navy/10 pb-3">
        <h2 className="font-display text-2xl font-normal text-navy">
          {STEPS[step].label}
        </h2>
      </div>

      <div className="min-h-[320px]">
        {step === 0 && <Step1 data={data} onChange={change} />}
        {step === 1 && <Step2 data={data} onChange={change} />}
        {step === 2 && <Step3 data={data} onChange={change} />}
        {step === 3 && (
          <Step4
            data={data}
            onChange={change}
            photos={photos}
            setPhotos={setPhotos}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-10 flex items-center justify-between border-t border-navy/10 pt-6">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="flex min-h-[44px] items-center gap-2 border border-navy/25 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/60 transition-colors hover:border-navy hover:text-navy"
          >
            <ArrowLeft size={14} aria-hidden />
            Retour
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex min-h-[44px] items-center gap-2 border border-navy bg-navy px-7 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90"
          >
            Étape suivante
            <ArrowRight size={14} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex min-h-[44px] items-center gap-2 border border-gold bg-gold px-7 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-colors hover:bg-gold/90 disabled:opacity-50"
          >
            {submitting ? "Envoi en cours…" : "Envoyer ma demande"}
            <ArrowRight size={14} aria-hidden />
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-[10px] text-navy/30">
        Étape {step + 1} sur {STEPS.length}
      </p>
    </div>
  );
}
