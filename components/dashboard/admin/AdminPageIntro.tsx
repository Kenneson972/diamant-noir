import { cn } from "@/lib/utils";

type AdminPageIntroProps = {
  title: string;
  description?: string;
  /** Séparateur sous le titre (désactiver si le parent trace déjà la ligne) */
  showDivider?: boolean;
};

/** En-tête de page cohérent pour l’espace admin */
export function AdminPageIntro({
  title,
  description,
  showDivider = true,
}: AdminPageIntroProps) {
  return (
    <header
      className={cn(
        "space-y-2",
        showDivider && "border-b border-navy/[0.06] pb-6"
      )}
    >
      <h1 className="font-display-dashboard text-2xl font-semibold tracking-tight text-navy md:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-navy/55">
          {description}
        </p>
      ) : null}
    </header>
  );
}
