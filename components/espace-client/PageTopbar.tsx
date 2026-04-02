interface PageTopbarProps {
  section?: string;
  title: string;
  badge?: string; // ex: "J — 12"
}

export function PageTopbar({ section = "Diamant Noir", title, badge }: PageTopbarProps) {
  return (
    <div className="hidden md:flex h-[52px] bg-white border-b border-[rgba(13,27,42,0.06)] items-center px-8 shrink-0">
      <span className="text-[8px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.26)]">
        {section}
      </span>
      <div className="w-[14px] h-px bg-[rgba(13,27,42,0.1)] mx-3" />
      <span className="font-display text-[15px] font-normal text-[#0D1B2A]">{title}</span>
      {badge && (
        <>
          <div className="flex-1" />
          <span className="text-[8px] tracking-[0.2em] uppercase text-[#D4AF37] border border-[rgba(212,175,55,0.28)] px-[11px] py-[4px] rounded-[1px]">
            {badge}
          </span>
        </>
      )}
    </div>
  );
}
