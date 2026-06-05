export interface SeasonConfig {
  name: string;
  color: string;
  months: number[]; // 0 = Jan, 11 = Déc
}

export const DEFAULT_SEASONS: SeasonConfig[] = [
  {
    name: "Haute saison",
    color: "#22c55e",
    months: [11, 0, 1, 2, 3], // Déc, Jan, Fév, Mar, Avr
  },
  {
    name: "Moyenne saison",
    color: "#D4AF37",
    months: [4, 8, 9, 10], // Mai, Sep, Oct, Nov
  },
  {
    name: "Basse saison",
    color: "#9ca3af",
    months: [5, 6, 7], // Jun, Jul, Aoû
  },
];
