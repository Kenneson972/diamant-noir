"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardData = {
  villa_name: string;
  villa_location: string;
  villa_type: string;
  surface: string;
  surface_terrain: string;
  chambres: string;
  salles_de_bains: string;
  etages: string;
  parking_places: string;
  parking_securise: boolean;
  equipements: string[];
  already_listed: string;
  airbnb_url: string;
  message: string;
  gardien_existant: string;
  delai_souhaite: string;
  name: string;
  email: string;
  phone: string;
  adresse_postale: string;
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
  surface_terrain: "",
  chambres: "",
  salles_de_bains: "",
  etages: "",
  parking_places: "",
  parking_securise: false,
  equipements: [],
  already_listed: "",
  airbnb_url: "",
  message: "",
  gardien_existant: "",
  delai_souhaite: "",
  name: "",
  email: "",
  phone: "",
  adresse_postale: "",
  no_photos: false,
};

const STEPS = [
  { label: "Votre bien", icon: Building2, sub: "Type, localisation, équipements" },
  { label: "Situation", icon: TrendingUp, sub: "Location actuelle" },
  { label: "Attentes", icon: MessageSquare, sub: "Gestion souhaitée & contraintes" },
  { label: "Contact", icon: User, sub: "Coordonnées & photos" },
];

const MAX_PHOTOS = 15;
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// ── Input component ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group/field">
      <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.22em] text-navy/45 transition-colors group-focus-within/field:text-gold">
        {label}
        {required && <span className="text-gold/70">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-navy/35">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full border border-navy/15 bg-white px-4 py-3.5 text-sm text-navy placeholder-navy/25 transition-[border-color,box-shadow] duration-200 focus:border-gold focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)] focus:outline-none";

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div id="stepper" className="mb-10">
      <div className="flex items-start">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex flex-1 items-start">
              <div className="flex flex-col items-center gap-2">
                {/* Circle */}
                <div
                  className={`relative flex h-10 w-10 items-center justify-center border-2 transition-all duration-500 ${
                    done
                      ? "border-gold bg-gold text-navy"
                      : active
                      ? "border-navy bg-navy text-white shadow-[0_0_0_4px_rgba(10,10,10,0.06)]"
                      : "border-navy/15 bg-white text-navy/25"
                  }`}
                >
                  {done ? (
                    <Check size={15} strokeWidth={2.5} aria-hidden />
                  ) : (
                    <Icon size={15} strokeWidth={1.5} aria-hidden />
                  )}
                  {/* Active pulse ring */}
                  {active && (
                    <span className="absolute inset-0 animate-ping border border-navy/20 opacity-60" />
                  )}
                </div>
                {/* Label */}
                <div className="hidden flex-col items-center sm:flex">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-[0.25em] transition-colors duration-300 ${
                      active ? "text-navy" : done ? "text-gold" : "text-navy/25"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className="relative mx-1 mt-5 h-px flex-1 bg-navy/10">
                  <div
                    className="absolute inset-y-0 left-0 bg-gold transition-all duration-700 ease-out"
                    style={{ width: done ? "100%" : "0%" }}
                  />
                </div>
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
  "WiFi",
  "Barbecue",
  "Salle de sport",
  "Borne EV",
];

const VILLA_TYPES = ["Villa", "Appartement", "Bungalow", "Maison", "Autre"];

function Step1({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  const toggle = (eq: string) =>
    onChange({
      equipements: data.equipements.includes(eq)
        ? data.equipements.filter((e) => e !== eq)
        : [...data.equipements, eq],
    });

  return (
    <div className="space-y-8">
      {/* Type de bien */}
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40">
          Type de bien
        </p>
        <div className="flex flex-wrap gap-2">
          {VILLA_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ villa_type: t })}
              className={`border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-200 active:scale-95 ${
                data.villa_type === t
                  ? "border-gold bg-gold text-navy shadow-[0_2px_8px_rgba(212,175,55,0.3)]"
                  : "border-navy/15 bg-white text-navy/50 hover:border-navy/40 hover:bg-navy/[0.02]"
              }`}
            >
              {data.villa_type === t && <Check size={9} className="mr-1.5 inline" aria-hidden />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Nom */}
      <Field label="Nom de la villa">
        <input
          type="text"
          value={data.villa_name}
          onChange={(e) => onChange({ villa_name: e.target.value })}
          placeholder="Villa Bois Jolan, Casa del Mar…"
          className={inputCls}
        />
      </Field>

      {/* Localisation */}
      <div className="flex items-start gap-3">
        <MapPin size={15} className="mt-[3.25rem] shrink-0 text-gold" aria-hidden />
        <div className="flex-1">
          <Field label="Localisation" required>
            <input
              type="text"
              required
              value={data.villa_location}
              onChange={(e) => onChange({ villa_location: e.target.value })}
              placeholder="Sainte-Anne, Le Diamant, Les Trois-Îlets…"
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {/* Surface habitable + terrain */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Surface habitable (m²)">
          <input
            type="number"
            min="1"
            value={data.surface}
            onChange={(e) => onChange({ surface: e.target.value })}
            placeholder="120"
            className={inputCls}
          />
        </Field>
        <Field label="Surface terrain (m²)">
          <input
            type="number"
            min="1"
            value={data.surface_terrain}
            onChange={(e) => onChange({ surface_terrain: e.target.value })}
            placeholder="500"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Chambres + SdB */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Chambres">
          <input
            type="number"
            min="1"
            value={data.chambres}
            onChange={(e) => onChange({ chambres: e.target.value })}
            placeholder="3"
            className={inputCls}
          />
        </Field>
        <Field label="Salles de bains">
          <input
            type="number"
            min="1"
            value={data.salles_de_bains}
            onChange={(e) => onChange({ salles_de_bains: e.target.value })}
            placeholder="2"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Étages + Parking */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Étages" hint="0 = plain-pied">
          <input
            type="number"
            min="0"
            value={data.etages}
            onChange={(e) => onChange({ etages: e.target.value })}
            placeholder="1"
            className={inputCls}
          />
        </Field>
        <Field label="Places de parking">
          <input
            type="number"
            min="0"
            value={data.parking_places}
            onChange={(e) => onChange({ parking_places: e.target.value })}
            placeholder="2"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Parking sécurisé */}
      <label className="flex cursor-pointer items-center gap-3">
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all duration-200 ${
            data.parking_securise ? "border-gold bg-gold" : "border-navy/20 bg-white hover:border-navy/40"
          }`}
        >
          {data.parking_securise && <Check size={11} strokeWidth={2.5} className="text-navy" aria-hidden />}
        </div>
        <input
          type="checkbox"
          checked={data.parking_securise}
          onChange={(e) => onChange({ parking_securise: e.target.checked })}
          className="sr-only"
        />
        <span className="text-[13px] text-navy/60">Parking privé / sécurisé</span>
      </label>

      {/* Équipements */}
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
              className={`border px-3 py-1.5 text-[11px] transition-all duration-150 active:scale-95 ${
                data.equipements.includes(eq)
                  ? "border-gold/60 bg-gold/10 font-semibold text-navy"
                  : "border-navy/12 bg-white text-navy/50 hover:border-navy/30"
              }`}
            >
              {data.equipements.includes(eq) && (
                <Check size={9} className="mr-1 inline text-gold" aria-hidden />
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
              className={`flex cursor-pointer items-center gap-4 border p-4 transition-all duration-200 hover:shadow-[0_1px_8px_rgba(0,0,0,0.05)] ${
                data.already_listed === opt.value
                  ? "border-gold/50 bg-gold/[0.04] shadow-[0_1px_8px_rgba(212,175,55,0.12)]"
                  : "border-navy/10 bg-white hover:border-navy/25"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all duration-200 ${
                  data.already_listed === opt.value
                    ? "border-gold bg-gold"
                    : "border-navy/20 bg-white"
                }`}
              >
                {data.already_listed === opt.value && (
                  <Check size={11} strokeWidth={2.5} className="text-navy" aria-hidden />
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
              <span className="text-[13px] text-navy/75">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {data.already_listed === "oui" && (
        <div className="animate-fade-up">
          <Field
            label="Lien Airbnb / Booking"
            hint="Nous récupérons automatiquement vos données et vos photos."
          >
            <input
              type="url"
              value={data.airbnb_url}
              onChange={(e) => onChange({ airbnb_url: e.target.value })}
              placeholder="https://www.airbnb.fr/rooms/…"
              className={inputCls}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

// ── Step 3 — Vos attentes ─────────────────────────────────────────────────────

function Step3({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-8">
      <Field label="Vos attentes & contraintes particulières">
        <textarea
          rows={5}
          value={data.message}
          onChange={(e) => onChange({ message: e.target.value })}
          placeholder="Périodes bloquées, exigences particulières, questions sur la conciergerie…"
          className={`${inputCls} resize-none`}
        />
      </Field>

      {/* Gardien existant */}
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40">
          Un gardien ou concierge est-il déjà en place ?
        </p>
        <div className="flex gap-3">
          {[
            { value: "oui", label: "Oui" },
            { value: "non", label: "Non" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ gardien_existant: opt.value })}
              className={`border px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-200 active:scale-95 ${
                data.gardien_existant === opt.value
                  ? "border-gold bg-gold text-navy shadow-[0_2px_8px_rgba(212,175,55,0.3)]"
                  : "border-navy/15 bg-white text-navy/50 hover:border-navy/40 hover:bg-navy/[0.02]"
              }`}
            >
              {data.gardien_existant === opt.value && <Check size={9} className="mr-1.5 inline" aria-hidden />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Délai souhaité */}
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40">
          Délai souhaité pour démarrer
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Dès que possible",
            "Moins d'un mois",
            "Moins de 3 mois",
            "Pas pressé",
          ].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ delai_souhaite: r })}
              className={`border px-4 py-2.5 text-[11px] transition-all duration-200 active:scale-[0.97] ${
                data.delai_souhaite === r
                  ? "border-gold bg-gold font-bold text-navy shadow-[0_2px_8px_rgba(212,175,55,0.3)]"
                  : "border-navy/15 bg-white text-navy/55 hover:border-navy/35"
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
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" required>
          <input
            type="text"
            required
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Jean Dupont"
            className={inputCls}
          />
        </Field>
        <Field label="Email" required>
          <input
            type="email"
            required
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="jean@example.com"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Téléphone">
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="+596 696 00 00 00"
          className={inputCls}
        />
      </Field>

      <Field label="Adresse postale" hint="Pour l'établissement du contrat de conciergerie">
        <input
          type="text"
          value={data.adresse_postale}
          onChange={(e) => onChange({ adresse_postale: e.target.value })}
          placeholder="123 rue des Flamboyants, 97200 Fort-de-France"
          className={inputCls}
        />
      </Field>

      {/* Drop zone */}
      {!data.no_photos && (
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-navy/40">
            <ImageIcon size={13} className="text-gold" aria-hidden />
            Photos de la villa
            <span className="font-normal normal-case tracking-normal text-navy/30">
              (recommandé — max{MAX_PHOTOS}, 10 Mo)
            </span>
          </p>

          <div
            role="button"
            tabIndex={0}
            aria-label="Déposer des photos ici ou cliquer pour sélectionner"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            className={`flex min-h-[130px] cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-6 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
              isDragging
                ? "border-gold bg-gold/5 shadow-[0_0_0_4px_rgba(212,175,55,0.1)]"
                : "border-navy/15 bg-white hover:border-gold/40 hover:bg-gold/[0.015]"
            }`}
          >
            <Upload
              size={26}
              className={`transition-transform duration-200 ${isDragging ? "scale-110 text-gold" : "text-navy/20"}`}
              aria-hidden
            />
            <p className="text-sm text-navy/40">
              Glissez vos photos ici ou{" "}
              <span className="font-semibold text-navy/60 underline underline-offset-2">
                cliquez pour sélectionner
              </span>
            </p>
            <p className="text-xs text-navy/25">JPG, PNG, WEBP — max 10 Mo</p>
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
              {photos.map((p, idx) => (
                <div
                  key={p.id}
                  className="group relative aspect-square overflow-hidden bg-navy/5"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.preview}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-navy/70 text-white opacity-0 backdrop-blur-sm transition-all duration-150 group-hover:opacity-100 focus:opacity-100"
                  >
                    <X size={11} aria-hidden />
                  </button>
                  {/* Uploaded indicator */}
                  {p.uploadedUrl && (
                    <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold">
                      <Check size={10} strokeWidth={2.5} className="text-navy" aria-hidden />
                    </div>
                  )}
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square items-center justify-center border-2 border-dashed border-navy/12 bg-white text-navy/20 transition-all duration-150 hover:border-gold/40 hover:text-gold/50"
                  aria-label="Ajouter des photos"
                >
                  <Upload size={18} aria-hidden />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* No photos toggle */}
      <label className="flex cursor-pointer items-center gap-3">
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all duration-200 ${
            data.no_photos ? "border-gold bg-gold" : "border-navy/20 bg-white hover:border-navy/40"
          }`}
        >
          {data.no_photos && <Check size={11} strokeWidth={2.5} className="text-navy" aria-hidden />}
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
        <span className="flex items-center gap-2 text-[13px] text-navy/60">
          <ImageOff size={13} aria-hidden />
          Pas de photos — Kayvila s&apos;en charge (état des lieux + photos professionnelles)
        </span>
      </label>
    </div>
  );
}

// ── Confirmation ──────────────────────────────────────────────────────────────

function Confirmation({ name }: { name: string }) {
  return (
    <div className="mx-auto max-w-lg py-4 text-center">
      {/* Animated check */}
      <div className="mx-auto mb-8 animate-scale-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center border-2 border-gold bg-gold/8">
          <Check size={36} className="text-gold" strokeWidth={1.5} aria-hidden />
        </div>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
        <h2 className="font-display text-3xl font-normal text-navy">
          Merci, {name || "cher propriétaire"}.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-navy/55">
          Votre dossier a bien été reçu. Notre équipe l&apos;étudiera avec
          attention et vous recontactera sous 48 h ouvrées.
        </p>
        <p className="mt-2 text-sm text-navy/35">
          Un email de confirmation vous a été envoyé.
        </p>
      </div>

      {/* Signals */}
      <div
        className="mt-8 flex animate-fade-up flex-wrap justify-center gap-6 border-y border-navy/8 py-5"
        style={{ animationDelay: "160ms" }}
      >
        {["Réponse sous 48 h", "Étude personnalisée", "Sans engagement"].map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-[11px] text-navy/40">
            <Check size={11} className="text-gold" aria-hidden />
            {s}
          </span>
        ))}
      </div>

      <div
        className="mt-8 animate-fade-up"
        style={{ animationDelay: "240ms" }}
      >
        <Link
          href="/prestations"
          className="inline-flex items-center gap-2 border border-navy bg-navy px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90"
        >
          Découvrir la conciergerie
          <ChevronRight size={14} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep(step: number, data: WizardData): string | null {
  if (step === 0 && !data.villa_location.trim())
    return "Veuillez indiquer la localisation de votre villa.";
  if (step === 3 && !data.name.trim()) return "Veuillez indiquer votre nom.";
  if (step === 3 && !data.email.trim()) return "Veuillez indiquer votre email.";
  if (step === 3 && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return "Veuillez saisir un email valide.";
  return null;
}

// ── Error block ───────────────────────────────────────────────────────────────

function ErrorBlock({ message }: { message: string }) {
  const [key, setKey] = useState(0);

  // Re-trigger shake when message changes
  useEffect(() => { setKey((k) => k + 1); }, [message]);

  return (
    <div
      key={key}
      role="alert"
      className="mt-4 animate-shake flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      <X size={14} strokeWidth={2} className="shrink-0" aria-hidden />
      {message}
    </div>
  );
}

// ── Step titles ───────────────────────────────────────────────────────────────

const STEP_TITLES = [
  { title: "Votre bien", sub: "Type de bien, localisation & équipements" },
  { title: "Situation actuelle", sub: "Location en cours" },
  { title: "Vos attentes", sub: "Attentes et contraintes particulières" },
  { title: "Contact & photos", sub: "Vos coordonnées et visuels de la villa" },
];

// ── Main wizard ───────────────────────────────────────────────────────────────

export function VillaWizard() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const change = (patch: Partial<WizardData>) =>
    setData((prev) => ({ ...prev, ...patch }));

  const goNext = () => {
    const err = validateStep(step, data);
    if (err) { setError(err); return; }
    setError(null);
    setDirection("forward");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    document.querySelector('#stepper')?.scrollIntoView({ behavior: 'smooth' });
  };

  const goBack = () => {
    setError(null);
    setDirection("back");
    setStep((s) => Math.max(s - 1, 0));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const photo of photos) {
      if (photo.uploadedUrl) { urls.push(photo.uploadedUrl); continue; }
      const fd = new FormData();
      fd.append("file", photo.file);
      const res = await fetch("/api/villa-photo-upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        urls.push(url);
        setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, uploadedUrl: url } : p));
      } else {
        setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, error: "Échec upload" } : p));
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    const err = validateStep(3, data);
    if (err) { setError(err); return; }
    setError(null);
    setSubmitting(true);
    try {
      const photo_urls = photos.length > 0 && !data.no_photos ? await uploadPhotos() : [];

      const res = await fetch("/api/villa-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          villa_name: data.villa_name || undefined,
          villa_location: data.villa_location || undefined,
          villa_type: data.villa_type || undefined,
          surface: data.surface || undefined,
          surface_terrain: data.surface_terrain || undefined,
          chambres: data.chambres || undefined,
          salles_de_bains: data.salles_de_bains || undefined,
          etages: data.etages || undefined,
          parking_places: data.parking_places || undefined,
          parking_securise: data.parking_securise,
          equipements: data.equipements.length > 0 ? data.equipements : undefined,
          already_listed: data.already_listed || undefined,
          airbnb_url: data.airbnb_url || undefined,
          message: data.message || undefined,
          gardien_existant: data.gardien_existant || undefined,
          delai_souhaite: data.delai_souhaite || undefined,
          adresse_postale: data.adresse_postale || undefined,
          no_photos: data.no_photos,
          photo_urls: photo_urls.length > 0 ? photo_urls : undefined,
        }),
      });

      if (res.ok) {
        photos.forEach((p) => URL.revokeObjectURL(p.preview));
        setDone(true);
      } else {
        setError("L'envoi a échoué. Réessayez ou contactez-nous directement.");
      }
    } catch {
      setError("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <Confirmation name={data.name} />;

  const slideClass =
    direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";

  return (
    <div className="mx-auto max-w-2xl">
      {/* Card wrapper */}
      <div className="border border-navy/8 bg-white shadow-[0_4px_40px_rgba(0,0,0,0.06)]">

        {/* Top gold accent */}
        <div className="h-0.5 w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0" />

        <div className="px-6 py-8 md:px-10 md:py-10">
          {/* Progress */}
          <ProgressBar step={step} />

          {/* Step header */}
          <div key={`header-${step}`} className="mb-8 animate-fade-up">
            <h2 className="font-display text-2xl font-normal text-navy md:text-3xl">
              {STEP_TITLES[step].title}
            </h2>
            <p className="mt-1 text-[12px] text-navy/40">{STEP_TITLES[step].sub}</p>
            {/* Animated gold underline */}
            <div className="mt-3 h-px w-12 animate-line-draw origin-left bg-gold" />
          </div>

          {/* Step content with slide animation */}
          <div key={step} className={`min-h-[280px] ${slideClass}`}>
            {step === 0 && <Step1 data={data} onChange={change} />}
            {step === 1 && <Step2 data={data} onChange={change} />}
            {step === 2 && <Step3 data={data} onChange={change} />}
            {step === 3 && (
              <Step4 data={data} onChange={change} photos={photos} setPhotos={setPhotos} />
            )}
          </div>

          {/* Error */}
          {error && <ErrorBlock message={error} />}

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between border-t border-navy/8 pt-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="group flex min-h-[44px] items-center gap-2 border border-navy/20 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/50 transition-all duration-200 hover:border-navy hover:text-navy active:scale-[0.97]"
              >
                <ArrowLeft
                  size={13}
                  className="transition-transform duration-200 group-hover:-translate-x-0.5"
                  aria-hidden
                />
                Retour
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="group flex min-h-[44px] items-center gap-2.5 border border-navy bg-navy px-7 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-all duration-200 hover:bg-navy/85 active:scale-[0.97]"
              >
                Étape suivante
                <ArrowRight
                  size={13}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="group flex min-h-[44px] items-center gap-2.5 border border-gold bg-gold px-7 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-all duration-200 hover:bg-gold/85 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" aria-hidden />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    Envoyer ma demande
                    <ArrowRight
                      size={13}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <p className="mt-5 text-center text-[10px] text-navy/25">
        Étape{" "}
        <span className="font-semibold text-navy/40">{step + 1}</span>
        {" "}sur{" "}
        <span className="font-semibold text-navy/40">{STEPS.length}</span>
        {" "}— Sans engagement
      </p>
    </div>
  );
}
