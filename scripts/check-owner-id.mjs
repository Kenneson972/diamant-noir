import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load .env.local manually
const envRaw = readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envRaw
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY // service_role pour bypass RLS
);

async function check() {
  // 1. Vérifier combien de villas ont un owner_id
  const { data: villas, error: e1 } = await supabase
    .from("villas")
    .select("id, name, owner_id")
    .limit(50);

  if (e1) {
    console.error("Erreur villas:", e1.message);
    return;
  }

  const total = villas.length;
  const withOwner = villas.filter((v) => v.owner_id).length;
  const withoutOwner = villas.filter((v) => !v.owner_id).length;

  console.log("=== VILLAS ===");
  console.log("Total:", total);
  console.log("Avec owner_id:", withOwner);
  console.log("Sans owner_id:", withoutOwner);
  console.log("");
  console.log("Détail:");
  villas.forEach((v) =>
    console.log("  -", v.name, "| owner_id:", v.owner_id || "(vide)")
  );

  // 2. Vérifier les profils
  const { data: profiles, error: e2 } = await supabase
    .from("profiles")
    .select("id, email, role")
    .limit(50);

  if (e2) {
    console.error("Erreur profiles:", e2.message);
  } else {
    console.log("");
    console.log("=== PROFILES ===");
    const owners = profiles.filter(
      (p) => p.role === "owner" || p.role === "proprio"
    );
    const tenants = profiles.filter((p) => p.role === "tenant");
    console.log("Total profiles:", profiles.length);
    console.log("Owners:", owners.length);
    console.log("Tenants:", tenants.length);
    owners.forEach((p) => console.log("  -", p.email, "| role:", p.role));
  }

  // 3. Lister les tables disponibles
  const { data: tables } = await supabase
    .from("information_schema.tables")
    .select("table_name, table_type")
    .eq("table_schema", "public")
    .in("table_type", ["BASE TABLE", "VIEW"]);

  if (tables) {
    console.log("");
    console.log("=== TABLES PUBLIQUES ===");
    tables.forEach((t) => console.log("  -", t.table_name, `(${t.table_type})`));
  }

  // 4. Chercher une table qui ressemble à profiles
  const possibleProfiles = tables?.filter(
    (t) =>
      t.table_name.includes("profile") ||
      t.table_name.includes("user") ||
      t.table_name.includes("proprio") ||
      t.table_name === "auth.users"
  );
  if (possibleProfiles?.length) {
    console.log("");
    console.log("=== TABLES PROFIL POTENTIELLES ===");
    for (const t of possibleProfiles) {
      const { data: cols } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type")
        .eq("table_name", t.table_name);
      if (cols) {
        console.log(`\n  ${t.table_name}:`);
        cols.forEach((c) => console.log("    -", c.column_name, ":", c.data_type));
      }
    }
  }
}

check().then(() => process.exit(0));
