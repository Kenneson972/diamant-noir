"use client";

import { FileText } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

type Doc = {
  id: string;
  name: string;
  file_url: string;
  tags: string[];
  file_size: number | null;
  created_at: string;
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DocumentsList({ documents }: { documents: Doc[] }) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-navy/60">
        <FileText size={40} strokeWidth={1} />
        <p className="text-[12px] font-semibold uppercase tracking-[0.15em]">
          Aucun document partag&eacute;
        </p>
        <p className="text-[11px]">
          Les documents que l&apos;administrateur Kayvila partage avec vous
          appara&icirc;tront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-navy/10">
      <table className="w-full text-left text-[11px]">
        <thead className="border-b border-navy/10 bg-navy/[0.02]">
          <tr>
            <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/80">
              Nom
            </th>
            <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/80">
              Tags
            </th>
            <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/80">
              Taille
            </th>
            <th className="px-4 py-3 font-semibold uppercase tracking-[0.1em] text-navy/80">
              Date
            </th>
            <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.1em] text-navy/80">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr
              key={d.id}
              className="border-b border-navy/5 hover:bg-navy/[0.02]"
            >
              <td className="px-4 py-3 font-medium text-navy">{d.name}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {d.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-navy/10 bg-navy/[0.03] px-2 py-0.5 text-[10px] text-navy/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-navy/50">
                {formatSize(d.file_size)}
              </td>
              <td className="px-4 py-3 text-navy/50">
                {new Date(d.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3 text-right">
                <a
                  href={d.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-navy/50 hover:bg-navy/[0.06] hover:text-navy"
                  title="T&eacute;l&eacute;charger"
                >
                  <KayvilaPngIcon name="download" size={18} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
