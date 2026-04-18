// src/components/ui/SectionTitle.tsx
import { Link } from 'react-router-dom';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  linkLabel?: string;
  linkTo?: string;
}

export const SectionTitle = ({ title, subtitle, linkLabel, linkTo }: SectionTitleProps) => (
  <div className="flex items-end justify-between mb-7">
    <div>
      <h2
        className="font-display font-light text-[42px] leading-none text-black"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-[11px] text-black/38 tracking-[0.03em] mt-1">{subtitle}</p>
      )}
    </div>
    {linkLabel && linkTo && (
      <Link
        to={linkTo}
        className="text-[10px] font-normal tracking-[0.18em] uppercase text-black border-b border-black pb-px leading-none flex-shrink-0 mb-1 hover:opacity-60 transition-opacity"
      >
        {linkLabel}
      </Link>
    )}
  </div>
);
