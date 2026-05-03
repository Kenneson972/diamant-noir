import { useState, useEffect, useCallback } from 'react';
import { Button, cn } from '@heroui/react';
import { Sheet } from '@heroui-pro/react';
import { Minus, Plus, Check } from 'lucide-react';
import { boosters, milkOptions, type MenuItem } from '../../data/menuData';
import { useCart } from '../../store/cartStore';
import { useIsOraPlus } from '../../hooks/useIsOraPlus';

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/25 focus-visible:ring-offset-2';

export function DrinkOptionsModal({ item, onClose }: Props) {
  const addLine = useCart((s) => s.addLine);
  const [selectedMilk, setSelectedMilk] = useState(milkOptions[0]?.id ?? 'avoine');
  const [selectedBoosters, setSelectedBoosters] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [justAdded, setJustAdded] = useState(false);
  const { isOraPlus, effectiveUnitPrice } = useIsOraPlus();

  useEffect(() => {
    if (item) {
      setSelectedMilk(milkOptions[0]?.id ?? 'avoine');
      setSelectedBoosters([]);
      setQuantity(1);
      setSelectedSize('medium');
      setJustAdded(false);
    }
  }, [item?.id]);

  const hasSizes =
    item?.price_small != null && item?.price_medium != null && item?.price_large != null;

  const basePrice = item
    ? hasSizes
      ? selectedSize === 'small'
        ? item.price_small!
        : selectedSize === 'large'
        ? item.price_large!
        : item.price_medium!
      : item.price
    : 0;

  const unitPrice = effectiveUnitPrice(basePrice) + selectedBoosters.length;
  const total = unitPrice * quantity;

  const toggleBooster = useCallback((id: string) => {
    setSelectedBoosters((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  }, []);

  const handleAdd = () => {
    if (!item) return;
    const sortedBoosters = [...selectedBoosters].sort();
    const optionsKey = [
      `milk:${selectedMilk}`,
      `boost:${sortedBoosters.join(',')}`,
      hasSizes ? `size:${selectedSize}` : '',
    ]
      .filter(Boolean)
      .join('|');

    const optionLabels = [
      `Lait : ${milkOptions.find((m) => m.id === selectedMilk)?.name ?? selectedMilk}`,
      ...sortedBoosters.map((id) => `+ ${boosters.find((b) => b.id === id)?.name ?? id}`),
      ...(hasSizes
        ? [`Taille : ${selectedSize === 'small' ? 'Petit' : selectedSize === 'medium' ? 'Moyen' : 'Grand'}`]
        : []),
    ];

    addLine({
      productId: item.id,
      name: item.name,
      unitPrice,
      quantity,
      category: item.category,
      optionsKey,
      optionLabels,
      image: item.icon,
      source: 'bar',
    });

    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 700);
  };

  const handleOpenChange = useCallback(
    (open: boolean) => { if (!open) onClose(); },
    [onClose],
  );

  return (
    <Sheet isOpen={!!item} onOpenChange={handleOpenChange} placement="bottom">
      <Sheet.Backdrop variant="opaque">
        <Sheet.Content className="mx-auto w-full max-w-lg rounded-t-2xl">
          <Sheet.Dialog className="flex max-h-[90dvh] flex-col bg-white">
            <Sheet.Header className="flex flex-row items-start justify-between border-b border-noir/[0.06] px-5 pb-4 pt-5">
              <div>
                <p className="mb-1 text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">
                  Personnaliser
                </p>
                <Sheet.Heading className="text-[15px] font-normal text-black">
                  {item?.name}
                </Sheet.Heading>
              </div>
              <Sheet.CloseTrigger
                aria-label="Fermer"
                className={cn(focusRing, 'mt-1 text-black/40 transition-colors hover:text-black')}
              />
            </Sheet.Header>

            <Sheet.Body className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {/* Taille */}
              {hasSizes && item && (
                <div>
                  <p className="mb-2.5 text-[9px] font-normal uppercase tracking-[0.18em] text-black/40">
                    Taille
                  </p>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map((s) => {
                      const sPrice =
                        s === 'small'
                          ? item.price_small!
                          : s === 'medium'
                          ? item.price_medium!
                          : item.price_large!;
                      const sLabel =
                        s === 'small' ? 'Petit' : s === 'medium' ? 'Moyen' : 'Grand';
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          aria-pressed={selectedSize === s}
                          className={cn(
                            focusRing,
                            'flex-1 rounded-[2px] border py-2.5 text-center text-[9px] font-normal uppercase leading-snug tracking-[0.1em] transition-colors',
                            selectedSize === s
                              ? 'border-noir bg-noir text-white'
                              : 'border-noir/15 text-black/50 hover:border-noir/30 hover:text-black',
                          )}
                        >
                          {sLabel}
                          <br />
                          {isOraPlus
                            ? <><span className="line-through text-white/50">{sPrice}€</span>{' '}{effectiveUnitPrice(sPrice).toFixed(2).replace('.', ',')}€</>
                            : <>{sPrice}€</>
                          }
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lait */}
              <div>
                <p className="mb-2.5 text-[9px] font-normal uppercase tracking-[0.18em] text-black/40">
                  Base lait
                </p>
                <div className="flex flex-wrap gap-2">
                  {milkOptions.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMilk(m.id)}
                      aria-pressed={selectedMilk === m.id}
                      className={cn(
                        focusRing,
                        'rounded-full border px-4 py-2 text-[10px] font-normal uppercase tracking-[0.1em] transition-colors',
                        selectedMilk === m.id
                          ? 'border-noir bg-noir text-white'
                          : 'border-noir/15 text-black/50 hover:border-noir/30 hover:text-black',
                      )}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Boosters */}
              <div>
                <p className="mb-2.5 text-[9px] font-normal uppercase tracking-[0.18em] text-black/40">
                  Boosters{' '}
                  <span className="normal-case tracking-normal text-black/30">+1€ / booster</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {boosters.map((b) => {
                    const active = selectedBoosters.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleBooster(b.id)}
                        aria-pressed={active}
                        className={cn(
                          focusRing,
                          'rounded-full border px-4 py-2 text-[10px] font-normal uppercase tracking-[0.1em] transition-colors',
                          active
                            ? 'border-noir bg-noir text-white'
                            : 'border-noir/15 text-black/50 hover:border-noir/30 hover:text-black',
                        )}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantité */}
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/40">
                  Quantité
                </p>
                <div className="inline-flex items-center rounded-full border border-noir/[0.1]">
                  <Button
                    type="button"
                    variant="ghost"
                    isIconOnly
                    size="sm"
                    aria-label="Diminuer"
                    className="h-10 w-10 min-w-10"
                    isDisabled={quantity <= 1}
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-3 w-3" strokeWidth={1.35} />
                  </Button>
                  <span className="w-8 text-center text-[13px] font-normal text-black">
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    isIconOnly
                    size="sm"
                    aria-label="Augmenter"
                    className="h-10 w-10 min-w-10"
                    onPress={() => setQuantity((q) => q + 1)}
                  >
                    <Plus className="h-3 w-3" strokeWidth={1.35} />
                  </Button>
                </div>
              </div>
            </Sheet.Body>

            <Sheet.Footer className="border-t border-noir/[0.06] px-5 py-4">
              <Button
                type="button"
                fullWidth
                onPress={handleAdd}
                className={cn(
                  focusRing,
                  'flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-full bg-noir text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite',
                )}
              >
                {justAdded ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> Ajouté
                  </>
                ) : (
                  `Ajouter · ${total.toFixed(2).replace('.', ',')} €`
                )}
              </Button>
            </Sheet.Footer>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
