"use client";

import { Plus, Trash2 } from "lucide-react";
import type { EmergencyContact } from "@/lib/validations/villa";

type Props = { contacts: EmergencyContact[]; onChange: (contacts: EmergencyContact[]) => void };

export function EmergencyContactsEditor({ contacts, onChange }: Props) {
  const add = () => onChange([...contacts, { name: "", phone: "" }]);
  const update = (i: number, field: keyof EmergencyContact, value: string) => {
    const next = [...contacts]; next[i] = { ...next[i], [field]: value }; onChange(next);
  };
  const remove = (i: number) => onChange(contacts.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Contacts urgence</label>
      {contacts.map((c, i) => (
        <div key={i} className="flex gap-3 items-center">
          <input placeholder="Nom" value={c.name} onChange={(e) => update(i, "name", e.target.value)} className="min-h-[44px] flex-1 rounded-lg border border-navy/10 px-3 py-2 text-base focus:border-gold focus:outline-none md:text-sm" />
          <input placeholder="+596 696 XX XX XX" value={c.phone} onChange={(e) => update(i, "phone", e.target.value)} className="min-h-[44px] flex-1 rounded-lg border border-navy/10 px-3 py-2 text-base focus:border-gold focus:outline-none md:text-sm" />
          <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
      ))}
      <button type="button" onClick={add} className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-gold hover:underline"><Plus size={16} /> Ajouter un contact</button>
    </div>
  );
}
