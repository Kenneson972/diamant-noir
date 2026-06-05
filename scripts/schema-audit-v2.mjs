// Audit du schéma Supabase V2 — utilise des RPC définies ou supabaseAdmin
// Usage: node scripts/schema-audit-v2.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

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
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function audit() {
  console.log("=== AUDIT SCHÉMA SUPABASE V2 ===\n");

  // 1. Lister les tables avec une requête directe (service_role bypass RLS)
  console.log("--- LISTE DES TABLES ---");
  // Requête directe sur la base
  const { data: tableNames } = await supabase
    .from("villas")
    .select("name")
    .limit(1);

  // Pour lister les tables on doit utiliser une fonction RPC ou pg_catalog
  // Tentative: lire les colonnes d'une table spécifique via le client
  const criticalTables = [
    "profiles",
    "villas",
    "bookings",
    "tasks",
    "notifications",
    "villa_submissions",
    "support_tickets",
    "wishlist",
    "villa_events",
    "contact_requests",
    "availability_alerts",
    "owner_alerts",
    "ai_action_logs",
    "admin_chat_logs",
    "ota_sync_logs",
    "order_status_history",
    "stripe_events_processed",
    "villa_ical_feeds",
    "owner_chat_messages",
    "checklist_items",
    "chat_messages",
  ];

  for (const table of criticalTables) {
    // Lire les colonnes via une requête LIMIT 0
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(0);

    if (error) {
      if (error.message?.includes("does not exist") || error.code === "PGRST116" || error.code === "42P01") {
        continue; // table n'existe pas
      }
      console.log(`  ${table}: ❌ ${error.message.slice(0, 80)}`);
    } else {
      // Les colonnes sont dans les headers de la réponse
      // On ne peut pas les obtenir directement de supabase-js
      console.log(`  ${table}: ✅ existante`);
    }
  }

  // 2. Décrire les colonnes des tables existantes via une RPC si disponible
  console.log("\n--- STRUCTURE DES COLONNES ---");
  // On va essayer d'inspecter la structure en batchant des selects
  const tablesToInspect = ["villas", "bookings", "profiles"];

  for (const table of tablesToInspect) {
    // Compter les enregistrements
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(`\n${table}: ❌ ${error.message.slice(0, 80)}`);
      continue;
    }

    // Échantillon
    const { data: sample } = await supabase
      .from(table)
      .select("*")
      .limit(3);

    // Obtenir les clés du premier résultat pour inférer le schéma
    const fields = sample?.[0] ? Object.keys(sample[0]) : [];
    
    // Essayer de typer les champs
    const typeInfo = [];
    if (sample?.[0]) {
      for (const key of fields) {
        const val = sample[0][key];
        let jsType = typeof val;
        if (val === null) jsType = "null";
        else if (Array.isArray(val)) jsType = "array";
        typeInfo.push(`${key}: ${jsType}`);
      }
    }

    console.log(`\n${table} (${count} enregistrements) :`);
    typeInfo.forEach(t => console.log(`  ${t}`));

    // Log spécifique pour bookings
    if (table === "bookings" && sample?.length) {
      console.log("\n🔥 VÉRIFICATION PRICE:");
      for (const b of sample) {
        const price = b.price;
        const totalCents = b.total_price_cents;
        const priceCents = b.price_cents;
        console.log(`  Booking ${b.id?.slice(0,8)} | price=${price} (${typeof price}) | total_price_cents=${totalCents} (${typeof totalCents}) | price_cents=${priceCents} (${typeof priceCents})`);
        if (price !== undefined && totalCents !== undefined) {
          const expectedCents = typeof price === "number" ? Math.round(price * 100) : null;
          if (expectedCents !== null && totalCents !== expectedCents) {
            console.log(`    ⚠️ INCOHÉRENCE: price=${price} → attendu ${expectedCents} cents, trouvé ${totalCents}`);
          }
        }
      }
    }

    // Colonnes spécifiques pour villas
    if (table === "villas" && sample?.length) {
      console.log("\nDétail villas:");
      for (const v of sample) {
        console.log(`  ${v.name} | owner_id: ${v.owner_id || "null"} | is_published: ${v.is_published}`);
      }
    }
  }

  // 3. Compter les réservations par statut
  console.log("\n\n--- STATISTIQUES BOOKINGS ---");
  const statuses = ["pending", "confirmed", "paid", "cancelled", "refunded"];
  for (const status of statuses) {
    const { count, error } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", status);
    if (!error) {
      console.log(`  ${status}: ${count ?? 0}`);
    }
  }

  // 4. Bookings sans guest_email
  const { data: noGuest } = await supabase
    .from("bookings")
    .select("id, start_date, end_date", { count: "exact" })
    .is("guest_email", null)
    .limit(5);
  console.log(`\n🔥 Réservations SANS guest_email: ${noGuest?.length !== undefined ? `au moins ${noGuest.length}` : "0"}`);

  // 5. Villas sans owner_id
  const { data: noOwner } = await supabase
    .from("villas")
    .select("id, name", { count: "exact" })
    .is("owner_id", null)
    .limit(10);
  console.log(`\n🔥 Villas SANS propriétaire: ${noOwner?.length !== undefined ? noOwner.length : "0"}`);

  // 6. Profiles par role
  console.log("\n\n--- PROFILES PAR ROLE ---");
  const roles = ["admin", "owner", "proprio", "tenant", "client"];
  for (const role of roles) {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", role);
    if (!error) {
      console.log(`  ${role}: ${count ?? 0}`);
    }
  }

  console.log("\n\n=== AUDIT TERMINÉ ===");
}

audit().then(() => process.exit(0)).catch(e => {
  console.error("ERREUR FATALE:", e.message);
  process.exit(1);
});
