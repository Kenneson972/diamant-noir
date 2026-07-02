"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { EditorBloc, SectionStatus } from "@/lib/villa-editor-sections";

export type SummaryItem = {
  id: string;
  label: string;
  bloc: EditorBloc;
  status?: SectionStatus;
};

const BLOC_LABELS: Record<EditorBloc, string> = {
  identity: "",
  config: "Configuration",
  admin: "Administration",
};

const DOT_STYLES: Record<SectionStatus, string> = {
  empty: "bg-navy/15",
  partial: "bg-amber-400",
  complete: "bg-gold",
};

function scrollToSection(id: string) {
  document.getElementById(`ve-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function EditorSummary({
  items,
  villaName,
  imageUrl,
  isPublished,
}: {
  items: SummaryItem[];
  villaName: string;
  imageUrl?: string;
  isPublished: boolean;
}) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  // Scrollspy : la section la plus visible sous le header devient active
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const id = visible[0].target.id.replace(/^ve-/, "");
          setActiveId(id);
        }
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 }
    );
    for (const item of items) {
      const el = document.getElementById(`ve-${item.id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  const blocs: EditorBloc[] = ["identity", "config", "admin"];

  return (
    <>
      {/* Dropdown mobile "Aller à…" */}
      <div className="sticky top-16 z-20 -mx-1 bg-offwhite px-1 pb-3 lg:hidden">
        <label htmlFor="ve-goto" className="sr-only">Aller à une section</label>
        <select
          id="ve-goto"
          value={activeId}
          onChange={(e) => {
            setActiveId(e.target.value);
            scrollToSection(e.target.value);
          }}
          className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white px-4 text-sm font-medium text-navy focus:border-gold/50 focus:outline-none"
          data-testid="summary-goto"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>

      {/* Sommaire desktop */}
      <nav
        aria-label="Sommaire de l'éditeur"
        className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
        data-testid="editor-summary"
      >
        <div className="flex items-center gap-3 pb-4">
          {imageUrl ? (
            <Image src={imageUrl} alt="" width={40} height={40} className="size-10 rounded-lg object-cover" />
          ) : (
            <span className="size-10 rounded-lg bg-navy/8" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy">{villaName || "Nouvelle villa"}</p>
            <p className={cn("text-[10px] font-bold uppercase tracking-[0.15em]", isPublished ? "text-gold" : "text-navy/45")}>
              {isPublished ? "Publiée" : "Non publiée"}
            </p>
          </div>
        </div>

        {blocs.map((bloc) => {
          const blocItems = items.filter((item) => item.bloc === bloc);
          if (blocItems.length === 0) return null;
          return (
            <div key={bloc} className="pt-3">
              {BLOC_LABELS[bloc] && (
                <p className="pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{BLOC_LABELS[bloc]}</p>
              )}
              <ul>
                {blocItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      aria-current={activeId === item.id ? "true" : undefined}
                      className={cn(
                        "flex min-h-[36px] w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors",
                        activeId === item.id
                          ? "bg-navy/[0.04] font-semibold text-navy"
                          : "text-navy/55 hover:text-navy"
                      )}
                    >
                      {item.status && <span className={cn("size-1.5 shrink-0 rounded-full", DOT_STYLES[item.status])} aria-hidden />}
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </>
  );
}
