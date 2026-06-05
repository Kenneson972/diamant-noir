interface PageTopbarProps {
  /** Fil d’Ariane optionnel (`Espace client`, …) ; sinon seul le titre est affiché. */
  section?: string;
  title: string;
  badge?: string; // ex: "J — 12"
}

export function PageTopbar({ section, title, badge }: PageTopbarProps) {
  return (
    <div className="flex h-[52px] bg-white border-b border-navy/[0.06] items-center px-5 md:px-8 shrink-0">
      {section ? (
        <>
          <span className="text-[11px] tracking-[0.15em] uppercase text-navy/30">{section}</span>
          <div className="w-[14px] h-px bg-navy/10 mx-3" />
        </>
      ) : null}
      <span className="font-display text-[15px] font-normal text-navy">{title}</span>
      {badge && (
        <>
          <div className="flex-1" />
          <span className="text-[11px] tracking-[0.12em] uppercase text-gold border border-gold/30 px-[11px] py-[4px] rounded-[1px]">
            {badge}
          </span>
        </>
      )}
    </div>
  );
}
