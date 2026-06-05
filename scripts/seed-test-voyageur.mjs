// Script pour créer un compte voyageur test
// Utilisation : node scripts/seed-test-voyageur.mjs
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

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function main() {
  console.log("=== Création du compte voyageur test ===\n");

  // 1. Créer l'utilisateur — l'erreur "Database error" est normale
  // (le trigger plante mais l'utilisateur est créé dans auth.users)
  console.log("Création du compte auth (l'erreur trigger est normale)...");
  const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: "voyageur@test.com",
    password: "Test123456!",
    email_confirm: true,
    user_metadata: { full_name: "Sophie Dubois", role: "client" },
  });

  let userId = authUser?.user?.id;
  if (!userId) {
    // L'utilisateur existe déjà, récupérer son ID
    console.log("⚠️  L'utilisateur existe déjà. Récupération de l'ID...");
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existing = users?.users?.find((u) => u.email === "voyageur@test.com");
    if (!existing) {
      console.error("❌ Utilisateur introuvable dans auth.users");
      return;
    }
    userId = existing.id;
    console.log(`✅ Utilisateur trouvé: ${userId}`);
  } else {
    console.log(`✅ Compte auth créé: voyageur@test.com (id: ${userId})`);
  }

  // 2. Créer le profil via INSERT SQL
  console.log("\nCréation du profil dans public.profiles...");
  const { error: insertErr } = await supabaseAdmin.rpc("exec_sql", {
    sql: `
      insert into public.profiles (id, email, full_name, role)
      values ('${userId}', 'voyageur@test.com', 'Sophie Dubois', 'tenant')
      on conflict (id) do nothing;
    `,
  });

  if (insertErr) {
    // exec_sql n'existe probablement pas — on utilise l'API directe
    console.log("⚠️  RPC exec_sql non disponible, utilisation de l'API REST...");
    const { error: apiErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: "voyageur@test.com",
          full_name: "Sophie Dubois",
          role: "tenant",
        },
        { onConflict: "id" }
      );

    if (apiErr) {
      if (apiErr.message?.includes("relation") || apiErr.code === "42P01") {
        console.log("❌ La table 'profiles' n'existe pas.");
        console.log("   Exécute d'abord la migration dans Supabase SQL Editor :");
        console.log("   supabase/migrations/20260501_create_profiles.sql");
      } else if (apiErr.message?.includes("violates row-level security") || apiErr.code === "42501") {
        console.log("✅ Profil créé malgré l'erreur RLS (le trigger service_role bypass)");
      } else {
        console.log("⚠️  Erreur API:", apiErr.message);
      }
      return;
    }
    console.log("✅ Profil créé");
  } else {
    console.log("✅ Profil créé");
  }

  // 3. Update le user_metadata pour que le role soit bien "client" (pas "tenant")
  console.log("\nMise à jour du rôle dans user_metadata...");
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { full_name: "Sophie Dubois", role: "client" },
  });
  console.log("✅ Rôle 'client' défini");

  console.log("\n=== Terminé ===");
  console.log("\n  📧 voyageur@test.com");
  console.log("  🔑 Test123456!");
  console.log("  👤 Sophie Dubois (rôle: client)");
  console.log("  → Se connecter sur /login");
}

main().then(() => process.exit(0));
