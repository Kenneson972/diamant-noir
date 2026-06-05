type TenantSectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

/** En-tête éditorial des sous-pages espace client (sans avatar). */
export function TenantSectionHeader({ eyebrow, title, description }: TenantSectionHeaderProps) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-gold">{eyebrow}</p>
      <h1 className="mt-2 font-display text-2xl font-normal leading-none text-navy">{title}</h1>
      <span className="mt-3 block h-px w-8 bg-gold/50" aria-hidden />
      {description ? (
        <p className="mt-3 font-display text-[15px] font-light italic text-navy/55">{description}</p>
      ) : null}
    </div>
  );
}
