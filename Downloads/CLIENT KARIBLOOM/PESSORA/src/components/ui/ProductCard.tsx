// src/components/ui/ProductCard.tsx
import { Card, CardContent, CardFooter, Button, Chip } from '@heroui/react';

interface ProductCardProps {
  tag: string;
  name: string;
  description: string;
  macros?: string;
  price: string;
  bgClass?: string;
  onAdd?: () => void;
}

export const ProductCard = ({
  tag,
  name,
  description,
  macros,
  price,
  bgClass = 'bg-gradient-to-b from-[#2c4e2d] to-[#1a3a1b]',
  onAdd,
}: ProductCardProps) => (
  <Card
    className="bg-white rounded-[14px] border border-black/[0.06] shadow-none hover:shadow-md transition-shadow"
  >
    <CardContent className="p-[18px] pb-0 gap-0">
      <Chip
        size="sm"
        className="bg-[#3d6b3e] text-white text-[8px] tracking-[0.2em] uppercase rounded-[3px] h-auto py-[3px] px-2 mb-[14px]"
      >
        {tag}
      </Chip>
      <div className="h-[110px] flex items-center justify-center mb-[14px]">
        <div className={`w-[60px] h-[88px] rounded-[30px] ${bgClass}`} />
      </div>
      <p className="text-[13px] font-normal text-black mb-[2px]">{name}</p>
      <p className="text-[11px] text-black/38 leading-[1.5] mb-[12px] min-h-[32px]">{description}</p>
      {macros && <p className="text-[9px] text-black/30 tracking-[0.05em] mb-[12px]">{macros}</p>}
    </CardContent>
    <CardFooter className="px-[18px] pb-[16px] pt-0 flex items-center justify-between">
      <span className="text-[14px] font-normal text-black">{price}</span>
      <Button
        isIconOnly
        className="w-8 h-8 min-w-0 rounded-full bg-black text-white text-xl font-light"
        onPress={onAdd}
        aria-label={`Ajouter ${name}`}
      >
        +
      </Button>
    </CardFooter>
  </Card>
);
