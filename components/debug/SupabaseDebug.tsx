"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

export const SupabaseDebug = () => {
  const [debug, setDebug] = useState<any>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    setDebug({
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      hasClient: !!supabase,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "Non configuré",
      key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "Non configuré",
    });

    // Test de connexion
    if (supabase) {
      supabase
        .from("villas")
        .select("count")
        .then(({ count, error }) => {
          setDebug((prev: any) => ({
            ...prev,
            connectionTest: error ? `Erreur: ${error.message}` : "✅ Connecté",
            villaCount: count || "N/A",
          }));
        });
    }
  }, []);

  if (!debug) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-2xl border border-navy/20 bg-white p-4 text-xs shadow-xl max-w-sm">
      <h4 className="font-bold mb-2 text-navy">🔍 Debug Supabase</h4>
      <div className="space-y-1 text-navy/70">
        <div>URL: {debug.hasUrl ? "✅" : "❌"} {debug.url}</div>
        <div>Key: {debug.hasKey ? "✅" : "❌"} {debug.key}</div>
        <div>Client: {debug.hasClient ? "✅ Créé" : "❌ Null"}</div>
        {debug.connectionTest && (
          <div className="mt-2 pt-2 border-t border-navy/10">
            <div>Test: {debug.connectionTest}</div>
            {debug.villaCount !== "N/A" && <div>Villas: {debug.villaCount}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
