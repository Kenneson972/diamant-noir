"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Save } from "lucide-react";

export function ConciergerieSettingsForm() {
  const supabase = getSupabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("conciergerie_settings").select("*").single();
      if (data) {
        setEmergencyPhone(data.emergency_phone ?? "");
        setContactPhone(data.contact_phone ?? "");
        setContactEmail(data.contact_email ?? "");
      }
      setLoading(false);
    })();
  }, [supabase]);

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    await supabase.from("conciergerie_settings").upsert({
      id: 1,
      emergency_phone: emergencyPhone,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <p className="text-xs text-gray-400">Chargement...</p>;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-600 mb-1">Téléphone urgences 24h/24</label>
        <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gold/50" />
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-600 mb-1">Téléphone contact</label>
        <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gold/50" />
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-600 mb-1">Email contact</label>
        <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gold/50" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-navy/90 disabled:opacity-40 transition-colors rounded-md">
          <Save size={12} />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
        {saved && <span className="text-[11px] text-emerald-600 font-medium">✓ Sauvegardé</span>}
      </div>
    </div>
  );
}
