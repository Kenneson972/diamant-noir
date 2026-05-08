import type { Metadata } from "next";
import { AdminVillaForm } from "@/components/dashboard/admin/AdminVillaForm";

export const metadata: Metadata = {
  title: "Ajouter une villa — Administration Kayvila",
};

export default function AdminAddVillaPage() {
  return <AdminVillaForm />;
}
