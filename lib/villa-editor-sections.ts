export type SectionStatus = "empty" | "partial" | "complete";
export type EditorBloc = "identity" | "config" | "admin";

export type EditorSectionDef = {
  id: string;
  /** Libellé affiché dans le sommaire et l'en-tête de section */
  label: string;
  /** Nom d'icône DashboardNavIcon */
  icon: string;
  /** Phrase d'aide affichée sous le titre de section */
  help: string;
  bloc: EditorBloc;
  /** Clé dans sectionCompleteness(form) — null si pas de statut pertinent */
  statusKey: string | null;
};

export const EDITOR_SECTIONS: EditorSectionDef[] = [
  { id: "details", label: "Description & accès", icon: "LayoutDashboard", help: "Description, horaires d'arrivée et localisation précise.", bloc: "config", statusKey: "infos" },
  { id: "equipments", label: "Équipements", icon: "Star", help: "Ajoutez les équipements intérieurs et extérieurs pour rassurer les voyageurs.", bloc: "config", statusKey: "equipments" },
  { id: "rooms", label: "Pièces", icon: "Building2", help: "Détaillez les chambres et leurs couchages.", bloc: "config", statusKey: "rooms" },
  { id: "pricing", label: "Tarifs saisonniers", icon: "DollarSign", help: "Ajustez vos prix selon les saisons.", bloc: "config", statusKey: "pricing" },
  { id: "services", label: "Services", icon: "Sparkles", help: "Services inclus et prestations à la carte.", bloc: "config", statusKey: "services" },
  { id: "rules", label: "Règles & sécurité", icon: "Settings", help: "Règles de la maison et équipements de sécurité.", bloc: "config", statusKey: "rules" },
  { id: "contacts", label: "Contacts urgence", icon: "UserCircle", help: "Personnes à joindre en cas de besoin sur place.", bloc: "config", statusKey: "contacts" },
  { id: "ical", label: "Calendrier iCal", icon: "CalendarDays", help: "Synchronisez vos disponibilités avec les autres plateformes.", bloc: "config", statusKey: null },
  { id: "admin", label: "Commission & propriétaire", icon: "Zap", help: "Commission, frais de ménage, publication et propriétaire lié.", bloc: "admin", statusKey: null },
];

export function sectionsForRole(isAdmin: boolean): EditorSectionDef[] {
  return EDITOR_SECTIONS
    .filter((sec) => isAdmin || sec.bloc !== "admin")
    .map((sec) => (sec.id === "ical" && isAdmin ? { ...sec, bloc: "admin" as const } : sec));
}
