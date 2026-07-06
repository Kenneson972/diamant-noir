const RECOMMENDATIONS = [
  {
    category: "Restaurants",
    items: [
      { name: "Le Petit Diamant", description: "Cuisine créole raffinée", distance: "5 min", price: "€€€" },
      { name: "Chez Carole", description: "Poisson grillé pieds dans l'eau", distance: "10 min", price: "€€" },
    ],
  },
  {
    category: "Plages",
    items: [
      { name: "Plage du Diamant", description: "Sable blanc, eau turquoise", distance: "3 min" },
      { name: "Anse Noire", description: "Sable volcanique, snorkeling", distance: "20 min" },
    ],
  },
  {
    category: "Activités",
    items: [
      { name: "Rocher du Diamant", description: "Randonnée et panorama", distance: "8 min" },
      { name: "Plongée Anses d'Arlet", description: "Réserve marine", distance: "15 min" },
    ],
  },
] as const;

export function LocalGuide() {
  return (
    <section className="space-y-6">
      <h2 className="font-display text-2xl font-normal text-navy">Les recommandations Kayvila</h2>
      {RECOMMENDATIONS.map((cat) => (
        <div key={cat.category}>
          <h3 className="font-sora text-sm font-semibold uppercase tracking-wider text-navy mb-3">
            {cat.category}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cat.items.map((item) => (
              <div key={item.name} className="border border-navy/10 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-sora text-sm text-navy">{item.name}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-navy/45">{item.distance}</span>
                </div>
                <p className="mt-1 text-sm text-navy/80">{item.description}</p>
                {"price" in item && item.price ? (
                  <span className="mt-2 inline-block text-xs text-gold">{item.price}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
