"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Plus, Sparkles, BarChart3, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { getSupabaseBrowser } from "@/lib/supabase";

/** 
 * Barre de navigation globale de l'espace propriétaire 
 */
export function ProprioChrome() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowser();

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push("/");
  };

  const isAssistant = pathname === "/dashboard/proprio/assistant";

  // Dans l'assistant, on peut vouloir un chrome plus sombre si on reste sur l'approche terminal/salon privé.
  // Sauf qu'on a décidé de le retoucher pour l'aligner. On garde un fond unifié.
  return (
    <header className="safe-top sticky top-0 z-40 w-full border-b border-navy/10 bg-white/95 md:bg-white/80 md:backdrop-blur-md">
      <div className="page-px mx-auto flex min-h-16 lg:min-h-20 max-w-7xl items-center justify-between gap-4 py-3 sm:py-0">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/dashboard/proprio" className="tap-target block shrink-0" aria-label="Accueil Espace Propriétaire">
            <BrandLogo variant="onLight" size="sm" showIcon={false} />
          </Link>
          <div className="hidden h-5 w-px bg-navy/10 md:block" aria-hidden="true" />
          <span className="hidden text-[10px] font-bold uppercase tracking-widest text-gold md:block">
            Espace Propriétaire
          </span>
        </div>

        <div className="flex w-full items-center justify-end gap-1.5 overflow-x-auto no-scrollbar sm:w-auto sm:gap-2">
          {pathname !== "/dashboard/proprio" && !pathname.includes("/new") && (
            <Button
              variant="ghost"
              size="sm"
              className="tap-target hidden h-11 items-center justify-center gap-2 rounded-full px-4 text-navy/70 hover:text-navy sm:flex"
              onClick={() => router.push("/dashboard/proprio")}
            >
              <ArrowLeft size={16} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Portfolio</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="tap-target flex h-11 w-11 shrink-0 items-center justify-center gap-0 rounded-full border-gold/20 bg-gold/5 px-0 text-gold transition-all hover:bg-gold hover:text-navy sm:h-11 sm:w-auto sm:gap-2 sm:px-4"
            onClick={() => router.push("/dashboard/proprio/assistant")}
            aria-label="Assistant IA"
          >
            <Sparkles size={16} />
            <span className="hidden text-[10px] font-bold uppercase tracking-widest sm:inline">IA</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="tap-target flex h-11 w-11 shrink-0 items-center justify-center gap-0 rounded-full border-navy/10 px-0 sm:h-11 sm:w-auto sm:gap-2 sm:px-4"
            onClick={() => router.push("/dashboard/proprio/analytics")}
            aria-label="Analytics"
          >
            <BarChart3 size={16} />
            <span className="hidden text-[11px] font-bold uppercase tracking-widest sm:inline">Stats</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="tap-target flex h-11 w-11 shrink-0 items-center justify-center gap-0 rounded-full border-navy/10 px-0 sm:h-11 sm:w-auto sm:gap-2 sm:px-4"
            onClick={() => router.push("/dashboard/proprio/submissions")}
            aria-label="Soumissions"
          >
            <FileText size={16} />
            <span className="hidden text-[11px] font-bold uppercase tracking-widest sm:inline">Leads</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            className="tap-target flex h-11 w-11 shrink-0 items-center justify-center gap-0 rounded-full bg-navy text-white px-0 hover:bg-navy/90 sm:h-11 sm:w-auto sm:gap-2 sm:px-5"
            onClick={() => router.push("/dashboard/proprio/new")}
            aria-label="Nouvelle villa"
          >
            <Plus size={16} />
            <span className="hidden text-[11px] font-bold uppercase tracking-widest sm:inline">Ajouter</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut} 
            className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-navy/50 hover:bg-navy/5 hover:text-navy"
            aria-label="Déconnexion"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Bandeau d'introduction de page (Portfolio, Analytics, etc.)
 */
export function ProprioPageIntro({
  eyebrow,
  title,
  subtitle,
  variant = "navy",
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  variant?: "navy" | "white";
  actions?: React.ReactNode;
}) {
  const isNavy = variant === "navy";
  const bg = isNavy ? "bg-navy text-white" : "bg-white text-navy border-b border-navy/10";
  const eyebrowColor = isNavy ? "text-gold" : "text-gold";
  const subtitleColor = isNavy ? "text-white/65" : "text-navy/65";

  return (
    <section className={`relative page-px ${bg} section-y-compact`}>
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-3xl">
          <p className={`mb-3 text-[11px] font-bold uppercase tracking-[0.36em] ${eyebrowColor}`}>{eyebrow}</p>
          <h1 className="font-display text-[1.8rem] sm:text-4xl md:text-4xl lg:text-5xl">{title}</h1>
          {subtitle && <p className={`mt-4 max-w-2xl text-base ${subtitleColor}`}>{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-4">{actions}</div>}
      </div>
    </section>
  );
}

/**
 * Tuile de statistique style éditorial
 */
export function ProprioStatTile({
  value,
  label,
  icon,
}: {
  value: React.ReactNode;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col border-t border-navy/10 pt-6">
      <div className="flex items-center gap-2 mb-4">
        {icon && <div className="text-gold">{icon}</div>}
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy/40 leading-snug">
          {label}
        </span>
      </div>
      <div className="font-display text-4xl text-navy">{value}</div>
    </div>
  );
}

/**
 * Titre de section interne (ex: dans la vue détail villa)
 */
export function ProprioSectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-2xl text-navy md:text-3xl">{title}</h2>
      <span className="mt-4 block h-px w-12 bg-gold" aria-hidden="true" />
    </div>
  );
}
