// lib/cancellation-templates.ts
export type CancellationTemplate = 'flexible' | 'moderate' | 'strict';

export const CANCELLATION_TEMPLATES: Record<
  CancellationTemplate,
  { label: string; summary: string; full: string }
> = {
  flexible: {
    label: 'Flexible',
    summary: 'Annulation gratuite jusqu\'à J-7',
    full: 'Annulation gratuite jusqu\'à 7 jours avant l\'arrivée. 50 % remboursé entre J-7 et J-2. Aucun remboursement à moins de 48 h.',
  },
  moderate: {
    label: 'Modérée',
    summary: 'Annulation gratuite jusqu\'à J-14',
    full: 'Annulation gratuite jusqu\'à 14 jours avant l\'arrivée. 50 % remboursé entre J-14 et J-7. Aucun remboursement à moins de 7 jours.',
  },
  strict: {
    label: 'Stricte',
    summary: '50 % remboursé jusqu\'à J-30 seulement',
    full: '50 % remboursé jusqu\'à 30 jours avant l\'arrivée. Aucun remboursement à moins de 30 jours.',
  },
};
