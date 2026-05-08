// Audit du schéma Supabase — exécuté avec le service_role
// Usage: node scripts/schema-audit.mjs
// Nécessite SUPABASE_SERVICE_ROLE_KEY dans .env.local

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
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function audit() {
  console.log("=== AUDIT SCHÉMA SUPABASE ===\n");

  // 1. Lister toutes les tables publiques
  console.log("--- TABLES PUBLIQUES ---");
  const { data: tables } = await supabase.rpc("get_public_tables").maybeSingle();
  // Fallback: requête directe information_schema
  const { data: tables2 } = await supabase
    .from("information_schema.tables")
    .select("table_name, table_type")
    .eq("table_schema", "public")
    .in("table_type", ["BASE TABLE", "VIEW"])
    .order("table_name");

  if (tables2) {
    for (const t of tables2) {
      // Détail des colonnes pour chaque table
      const { data: cols } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable, column_default")
        .eq("table_name", t.table_name)
        .eq("table_schema", "public")
        .order("ordinal_position");

      const { data: pk } = await supabase
        .from("information_schema.table_constraints")
        .select("constraint_name")
        .eq("table_name", t.table_name)
        .eq("constraint_type", "PRIMARY KEY");

      console.log(`\n${t.table_type}: ${t.table_name}`);
      if (pk?.length) console.log(`  PK: ${pk.map(p => p.constraint_name).join(", ")}`);
      if (cols) {
        for (const c of cols) {
          const nullable = c.is_nullable === "YES" ? "NULL" : "NOT NULL";
          const def = c.column_default ? ` DEFAULT ${c.column_default}` : "";
          console.log(`  ${c.column_name} ${c.data_type} ${nullable}${def}`);
        }
      }

      // RLS policies
      const { data: policies } = await supabase
        .from("information_schema.table_privileges")
        .select("*")
        .eq("table_name", t.table_name)
        .eq("grantee", "anon")
        .in("privilege_type", ["SELECT", "INSERT", "UPDATE", "DELETE"]);

      const { data: policies2 } = await supabase
        .from("information_schema.table_privileges")
        .select("*")
        .eq("table_name", t.table_name)
        .eq("grantee", "public")
        .in("privilege_type", ["SELECT", "INSERT", "UPDATE", "DELETE"]);

      const anonPrivs = policies?.map(p => p.privilege_type).join(",") || "";
      const publicPrivs = policies2?.map(p => p.privilege_type).join(",") || "";
      console.log(`  RLS anon: ${anonPrivs || "aucun accès"}`);
      console.log(`  RLS public: ${publicPrivs || "aucun accès"}`);

      // Contraintes foreign key
      const { data: fks } = await supabase
        .from("information_schema.table_constraints")
        .select("constraint_name")
        .eq("table_name", t.table_name)
        .eq("constraint_type", "FOREIGN KEY");
      if (fks?.length) {
        for (const fk of fks) {
          const { data: refs } = await supabase
            .from("information_schema.referential_constraints")
            .select("unique_constraint_name, update_rule, delete_rule")
            .eq("constraint_name", fk.constraint_name);
          console.log(`  FK: ${fk.constraint_name} (${refs?.[0]?.delete_rule || "?"})`);
        }
      }
    }
  }

  // 2. Lister les politiques RLS via pg_policies
  console.log("\n\n--- POLITIQUES RLS ---");
  const { data: policies } = await supabase.rpc("get_policies").maybeSingle();
  
  // Fallback: requête SQL directe
  const { data: policies2 } = await supabase
    .from("pg_policies")
    .select("schemaname, tablename, policyname, permissive, cmd, roles, qual, with_check");

  if (policies2) {
    for (const p of policies2) {
      console.log(`\n${p.tablename}: ${p.policyname}`);
      console.log(`  CMD: ${p.cmd}, AS: ${p.permissive}`);
      console.log(`  ROLES: ${p.roles?.join(", ") || "public"}`);
      console.log(`  USING: ${p.qual || "(aucune)"}`);
      if (p.with_check) console.log(`  CHECK: ${p.with_check}`);
    }
  }

  // 3. Échantillon de données
  console.log("\n\n--- ÉCHANTILLON DONNÉES ---");

  // Profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .limit(5);
  console.log(`\nProfiles (${profiles?.length || 0}):`);
  if (profiles) profiles.forEach(p => console.log(`  ${p.email} | role: ${p.role} | ${p.created_at}`));

  // Villas
  const { data: villas } = await supabase
    .from("villas")
    .select("id, name, owner_id, price_per_night, is_published")
    .limit(5);
  console.log(`\nVillas (${villas?.length || 0}):`);
  if (villas) villas.forEach(v => console.log(`  ${v.name} | owner: ${v.owner_id?.slice(0,8) || "null"} | ${v.price_per_night}€/nuit | pub: ${v.is_published}`));

  // Villas sans owner
  const { data: noOwner } = await supabase
    .from("villas")
    .select("id, name", { count: "exact" })
    .is("owner_id", null);
  console.log(`\n🔥 Villas SANS propriétaire: ${noOwner?.length || 0}`);
  if (noOwner?.length) noOwner.forEach(v => console.log(`  ${v.name}`));

  // Bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, villa_id, guest_email, price, total_price_cents, status, payment_status, created_at")
    .limit(5);
  
  if (bookings?.length) {
    console.log(`\nBookings (${bookings.length}):`);
    for (const b of bookings) {
      console.log(`  ${b.id?.slice(0,8)} | price: ${b.price} | total_price_cents: ${b.total_price_cents} | status: ${b.status} | payment: ${b.payment_status}`);
      if (b.price !== undefined && b.total_price_cents !== undefined && b.price * 100 !== b.total_price_cents) {
        console.log(`    ⚠️  INCOHÉRENCE: price=${b.price} × 100 = ${b.price*100} ≠ total_price_cents=${b.total_price_cents}`);
      }
    }
  }

  // Bookings totals
  const { data: bookingStats } = await supabase
    .from("bookings")
    .select("status", { count: "exact" });
  console.log(`\n🔥 Réservations totales: ${bookingStats?.length || 0}`);

  // Stats par statut
  for (const status of ["pending", "confirmed", "paid", "cancelled"]) {
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", status);
    if (count) console.log(`  ${status}: ${count}`);
  }

  // Bookings sans guest_email
  const { data: noGuest } = await supabase
    .from("bookings")
    .select("id", { count: "exact" })
    .is("guest_email", null);
  console.log(`\n🔥 Réservations SANS email guest: ${noGuest?.length || 0}`);

  // Mode de la colonne price vs total_price_cents
  const { data: priceCol } = await supabase
    .from("information_schema.columns")
    .select("column_name, data_type")
    .eq("table_name", "bookings")
    .eq("table_schema", "public")
    .in("column_name", ["price", "total_price_cents", "price_cents"]);
  console.log(`\nColonnes prix dans bookings:`);
  if (priceCol) priceCol.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));

  console.log("\n\n=== AUDIT TERMINÉ ===");
}

audit().then(() => process.exit(0)).catch(e => {
  console.error("Erreur:", e.message);
  process.exit(1);
});
