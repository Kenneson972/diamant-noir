export type RoomPreset = {
  label: string;
  rooms: Array<{ name: string; bed: "King size" | "Queen size" | "Double" | "Simple" | "Canapé-lit"; ensuite: boolean }>;
};

export const ROOM_PRESETS: RoomPreset[] = [
  {
    label: "Chambre parentale",
    rooms: [{ name: "Chambre parentale", bed: "King size", ensuite: true }],
  },
  {
    label: "Chambre standard",
    rooms: [{ name: "Chambre standard", bed: "Queen size", ensuite: false }],
  },
  {
    label: "Chambre enfant",
    rooms: [
      { name: "Chambre enfant 1", bed: "Simple", ensuite: false },
      { name: "Chambre enfant 2", bed: "Simple", ensuite: false },
    ],
  },
];

export function getBedCapacity(bed: string): number {
  switch (bed) {
    case "King size": case "Queen size": case "Double": return 2;
    case "Simple": case "Canapé-lit": return 1;
    default: return 1;
  }
}

export function totalRoomCapacity(rooms: Array<{ bed: string }>): number {
  return rooms.reduce((sum, r) => sum + getBedCapacity(r.bed), 0);
}
