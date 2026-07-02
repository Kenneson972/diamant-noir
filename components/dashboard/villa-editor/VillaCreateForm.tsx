"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { villaFormSchema } from "@/lib/validations/villa";
import { Input } from "@/components/ui/input";

const createVillaSchema = villaFormSchema.pick({
  name: true,
  location: true,
  price_per_night: true,
  capacity: true,
});

const FIELD_ORDER = ["name", "location", "price_per_night", "capacity"] as const;

export function VillaCreateForm({ redirectBase }: { redirectBase: string }) {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", location: "", price_per_night: "", capacity: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setValue = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  // Validation au blur : on ne montre l'erreur d'un champ qu'une fois quitté
  const validateField = (key: keyof typeof values) => () => {
    const candidate = {
      name: values.name.trim(),
      location: values.location.trim(),
      price_per_night: Number(values.price_per_night),
      capacity: Number(values.capacity || 0),
    };
    const parsed = createVillaSchema.safeParse(candidate);
    if (parsed.success) return;
    const issue = parsed.error.issues.find((i) => i.path[0] === key);
    if (issue) setErrors((prev) => ({ ...prev, [key]: issue.message }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = createVillaSchema.safeParse({
      name: values.name.trim(),
      location: values.location.trim(),
      price_per_night: Number(values.price_per_night),
      capacity: Number(values.capacity || 0),
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      // NaN sur le prix (champ vide) → message clair
      if (Number.isNaN(Number(values.price_per_night))) fieldErrors.price_per_night = "Indiquez un prix par nuit en euros";
      setErrors(fieldErrors);
      const firstInvalid = FIELD_ORDER.find((f) => fieldErrors[f]);
      if (firstInvalid) fieldRefs.current[firstInvalid]?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/create-villa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("Create failed");
      // L'API répond { success, data: { id } } — tolérer aussi un id à la racine
      const json = (await res.json()) as { id?: string; data?: { id?: string } };
      const id = json.data?.id ?? json.id;
      if (!id) throw new Error("Missing id");
      router.push(`${redirectBase}/${id}`);
    } catch {
      setErrors({ _form: "Erreur lors de la création. Vérifiez votre connexion et réessayez." });
      setSubmitting(false);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl" data-testid="villa-create-form" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="vc-name" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Nom de la villa *</label>
          <Input id="vc-name" ref={(el: HTMLInputElement | null) => { fieldRefs.current.name = el; }} value={values.name} placeholder="Ex: Villa Océane" className="text-sm" onChange={setValue("name")} onBlur={validateField("name")} aria-invalid={!!errors.name} />
          {fieldError("name")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="vc-location" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Localisation</label>
          <Input id="vc-location" ref={(el: HTMLInputElement | null) => { fieldRefs.current.location = el; }} value={values.location} placeholder="Ex: Trois-Îlets, Martinique" className="text-sm" onChange={setValue("location")} aria-invalid={!!errors.location} />
          {fieldError("location")}
        </div>
        <div>
          <label htmlFor="vc-price" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Prix / nuit (€) *</label>
          <Input id="vc-price" ref={(el: HTMLInputElement | null) => { fieldRefs.current.price_per_night = el; }} type="number" inputMode="numeric" min="1" value={values.price_per_night} placeholder="250" className="text-sm" onChange={setValue("price_per_night")} onBlur={validateField("price_per_night")} aria-invalid={!!errors.price_per_night} />
          {fieldError("price_per_night")}
        </div>
        <div>
          <label htmlFor="vc-capacity" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Capacité (personnes)</label>
          <Input id="vc-capacity" ref={(el: HTMLInputElement | null) => { fieldRefs.current.capacity = el; }} type="number" inputMode="numeric" min="1" value={values.capacity} placeholder="6" className="text-sm" onChange={setValue("capacity")} aria-invalid={!!errors.capacity} />
          {fieldError("capacity")}
        </div>
      </div>
      {errors._form && <p className="mt-4 text-sm text-red-600">{errors._form}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gold px-8 text-sm font-bold text-white transition-colors hover:bg-gold/90 active:scale-[0.98] disabled:opacity-50"
      >
        {submitting ? "Création en cours…" : "Créer le brouillon"}
      </button>
      <p className="mt-2 text-xs text-muted">La villa est créée non publiée. Photos, équipements et tarifs se remplissent ensuite dans l&apos;éditeur.</p>
    </form>
  );
}
