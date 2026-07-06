type VillaExtraInfoProps = {
  checkInTime: string;
  checkOutTime: string;
  houseRules?: string | null;
  cancellationPolicy?: string | null;
  safetyInfo?: string | null;
};

export function VillaAccordionInfo({
  houseRules,
  cancellationPolicy,
  safetyInfo,
}: VillaExtraInfoProps) {
  const hasHouseRules = houseRules && houseRules !== "";
  const hasCancellation = cancellationPolicy && cancellationPolicy !== "";
  const hasSafety = safetyInfo && safetyInfo !== "";

  if (!hasHouseRules && !hasCancellation && !hasSafety) return null;

  return (
    <section className="pt-10 border-t border-navy/10">
      <h2 className="font-display font-normal text-2xl text-navy mb-8">À savoir</h2>
      <div className="grid sm:grid-cols-3 gap-10">
        {hasCancellation && (
          <div>
            <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">
              Annulation
            </h4>
            <p className="text-navy/80 text-sm leading-relaxed whitespace-pre-line">
              {cancellationPolicy}
            </p>
          </div>
        )}
        {hasHouseRules && (
          <div>
            <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">
              Règlement
            </h4>
            <p className="text-navy/80 text-sm leading-relaxed whitespace-pre-line">
              {houseRules}
            </p>
          </div>
        )}
        {hasSafety && (
          <div>
            <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">
              Sécurité
            </h4>
            <p className="text-navy/80 text-sm leading-relaxed whitespace-pre-line">
              {safetyInfo}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
