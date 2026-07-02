import type { Metadata } from "next";
import { VillaEditor } from "@/components/dashboard/villa-editor/VillaEditor";

export const metadata: Metadata = {
  title: "Ajouter une villa — Administration Kayvila",
};

export default function AdminAddVillaPage() {
  return <VillaEditor isAdmin />;
}
