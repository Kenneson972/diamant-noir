"use client";

import { useState } from "react";
import { Download, Trash2, FileText, Search } from "lucide-react";

export type Doc = {
  id: string;
  name: string;
  file_url: string;
  tags: string[];
  file_size: number | null;
  created_at: string;
  owner: { name: string } | null;
};

const ALL_TAGS = ["facture", "reporting", "contrat", "autre"];

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DocumentsTable({ documents }: { documents: Doc[] }) {
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [docs, setDocs] = useState(documents);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = docs.filter((d) => {
    const matchSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.owner?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchTags =
      activeTags.length === 0 || activeTags.some((t) => d.tags.includes(t));
    return matchSearch && matchTags;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    const res = await fetch("/api/admin/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erreur lors de la suppression");
      return;
    }
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-navy/40">
        <FileText size={40} strokeWidth={1} />
        <p className="text-[12px] font-semibold uppercase tracking-[0.15em]">Aucun document</p>
        <p className="text-[11px]">Uploadez un premier document via le formulaire ci-dessus.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                activeTags.includes(tag)
                  ? "border-gold/40 bg-gold/10 text-navy"
                  : "border-navy/10 text-navy/50 hover:border-navy/20"
              }`}
            >
              {tag}
            </button>
          ))}
          {activeTags.length > 0 && (
            <button
              onClick={() => setActiveTags([])}
              className="text-[10px] text-navy/40 hover:text-navy"
            >
              Effacer
            </button>
          )}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-navy/15 py-2 pl-9 pr-3 text-[11px] text-navy placeholder:text-navy/30 sm:w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-navy/10">
        <table className="w-full text-left text-[11px]">
          <thead className="border-b border-navy/10 bg-navy/[0.02]">
            <tr>
              <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Nom</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Propriétaire</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Tags</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Taille</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/60">Date</th>
              <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.1em] text-navy/60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-navy/5 hover:bg-navy/[0.02]">
                <td className="px-4 py-3 font-medium text-navy">{d.name}</td>
                <td className="px-4 py-3 text-navy/70">{d.owner?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {d.tags.map((t) => (
                      <span key={t} className="rounded-full border border-navy/10 bg-navy/[0.03] px-2 py-0.5 text-[10px] text-navy/60">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-navy/50">{formatSize(d.file_size)}</td>
                <td className="px-4 py-3 text-navy/50">
                  {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={d.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-navy/50 hover:bg-navy/[0.06] hover:text-navy"
                      title="Télécharger"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-navy/30 hover:bg-red-50 hover:text-red-500"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
