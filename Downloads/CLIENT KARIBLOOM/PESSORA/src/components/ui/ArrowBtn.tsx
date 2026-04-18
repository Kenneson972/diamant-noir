// src/components/ui/ArrowBtn.tsx
import { Button } from '@heroui/react';
import { ArrowRight } from 'lucide-react';

interface ArrowBtnProps {
  onDark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  className?: string;
  ariaLabel?: string;
}

const sizes = { sm: 'w-9 h-9', md: 'w-11 h-11', lg: 'w-14 h-14' };
const iconSizes = { sm: 14, md: 16, lg: 20 };

export const ArrowBtn = ({ onDark = false, size = 'md', onPress, className = '', ariaLabel }: ArrowBtnProps) => (
  <Button
    isIconOnly
    onPress={onPress}
    className={`${sizes[size]} min-w-0 rounded-full ${
      onDark
        ? 'bg-white text-black hover:bg-white/90'
        : 'bg-black text-white hover:bg-black/85'
    } ${className}`}
    aria-label={ariaLabel ?? 'Voir plus'}
  >
    <ArrowRight size={iconSizes[size]} strokeWidth={1.5} />
  </Button>
);
