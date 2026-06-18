"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, X } from "lucide-react";

type Owner = { id: string; name: string };

const TAGS = [
  { value: "facture", label: "Facture" },
  { value: "reporting", label: "Reporting" },
  { value: "contrat", label: "Contrat" },
  { value: "autre", label: "Autre" },
];

export function UploadDocumentForm({
  owners,
}: {
  owners: Owner[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [ownerId, setOwnerId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleUpload = async () => {
    if (!file || !ownerId) {
      setError("Sélectionnez un fichier et un propriétaire");
      return;
    }
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("owner_id", ownerId);
    formData.append("tags", JSON.stringify(tags));

    const res = await fetch("/api/admin/documents", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erreur lors de l'upload");
      setUploading(false);
      return;
    }

    setFile(null);
    setOwnerId("");
    setTags([]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5">
      <h2 className="mb-4 text-[12px] font-bold uppercase tracking-[0.2em] text-navy">
        Ajouter un document
      </h2>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {/* File input */}
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/50">
            Fichier PDF
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy file:mr-3 file:rounded file:border-0 file:bg-navy file:px-3 file:py-1 file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.1em] file:text-white"
          />
        </div>

        {/* Owner select */}
        <div className="w-full sm:w-56">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/50">
            Propriétaire
          </label>
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
          >
            <option value="">Sélectionner…</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/50">
          Tags :
        </span>
        {TAGS.map((tag) => (
          <button
            key={tag.value}
            type="button"
            onClick={() => toggleTag(tag.value)}
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
              tags.includes(tag.value)
                ? "border-gold/40 bg-gold/10 text-navy"
                : "border-navy/10 text-navy/50 hover:border-navy/20"
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Upload button */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file || !ownerId}
          className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? "Upload…" : "Uploader"}
        </button>
        {file && (
          <span className="text-[11px] text-navy/60">
            {file.name}{" "}
            <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="ml-1 text-navy/40 hover:text-navy">
              <X size={12} className="inline" />
            </button>
          </span>
        )}
        {error && <span className="text-[11px] text-red-500">{error}</span>}
      </div>
    </div>
  );
}
