"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type EmergencyContact = { name: string; phone: string };

type Props = {
  contacts: EmergencyContact[];
  onChange: (contacts: EmergencyContact[]) => void;
};

export function EmergencyContactsEditor({ contacts, onChange }: Props) {
  const add = () => onChange([...contacts, { name: "", phone: "" }]);

  const update = (i: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...contacts];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  const remove = (i: number) => onChange(contacts.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
        Contacts urgence
      </label>

      {contacts.map((c, i) => (
        <div key={i} className="flex gap-3 items-center">
          <input
            placeholder="Nom"
            value={c.name}
            onChange={(e) => update(i, "name", e.target.value)}
            className="flex-1 rounded-xl border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
          <input
            placeholder="Téléphone"
            value={c.phone}
            onChange={(e) => update(i, "phone", e.target.value)}
            className="w-40 rounded-xl border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
          <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline"
      >
        <Plus size={14} /> Ajouter un contact
      </button>
    </div>
  );
}
