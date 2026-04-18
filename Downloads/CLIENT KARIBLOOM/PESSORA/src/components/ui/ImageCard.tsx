// src/components/ui/ImageCard.tsx
import { ArrowBtn } from './ArrowBtn';

interface ImageCardProps {
  eyebrow: string;
  title: string;
  titleEm?: string;
  bgClass?: string;
  bgImage?: string;
  aspectRatio?: string;
  onPress?: () => void;
}

export const ImageCard = ({
  eyebrow,
  title,
  titleEm,
  bgClass = 'bg-[#1e3a1e]',
  bgImage,
  aspectRatio = 'aspect-[3/4]',
  onPress,
}: ImageCardProps) => (
  <div
    role="button"
    tabIndex={0}
    className={`relative rounded-[16px] overflow-hidden ${aspectRatio} cursor-pointer group`}
    onClick={onPress}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPress?.(); }}
  >
    <div
      className={`absolute inset-0 ${bgClass} bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]`}
      style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-transparent" />
    <div className="absolute inset-0 p-[22px] flex flex-col justify-between">
      <p className="text-[9px] font-normal tracking-[0.3em] uppercase text-white/65">{eyebrow}</p>
      <div>
        <h3
          className="font-display font-light text-[28px] leading-[1.05] text-white mb-3.5"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
          {titleEm && <><br /><em className="italic">{titleEm}</em></>}
        </h3>
        <ArrowBtn onDark size="sm" />
      </div>
    </div>
  </div>
);
