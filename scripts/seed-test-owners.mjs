// Script pour créer des propriétaires test et assigner les villas
// Utilisation : node scripts/seed-test-owners.mjs
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

async function createOwner(email, password, fullName) {
  // Créer l'utilisateur dans auth.users
  const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "owner" },
  });

  if (authErr) {
    console.error(`Erreur création ${email}:`, authErr.message);
    return null;
  }

  console.log(`✅ Utilisateur créé: ${email} (id: ${authUser.user.id})`);
  return authUser.user.id;
}

async function assignVillas(ownerId, villaNames) {
  for (const name of villaNames) {
    const { data: villas, error: searchErr } = await supabaseAdmin
      .from("villas")
      .select("id, name")
      .ilike("name", `%${name}%`);

    if (searchErr) {
      console.error(`Erreur recherche villa '${name}':`, searchErr.message);
      continue;
    }

    for (const villa of villas || []) {
      const { error: updateErr } = await supabaseAdmin
        .from("villas")
        .update({ owner_id: ownerId })
        .eq("id", villa.id);

      if (updateErr) {
        console.error(`Erreur assignation ${villa.name}:`, updateErr.message);
      } else {
        console.log(`  🏠 ${villa.name} → assignée au propriétaire`);
      }
    }
  }
}

async function main() {
  console.log("=== Création des propriétaires test ===\n");

  // 1. Créer les comptes propriétaires
  const owner1 = await createOwner("proprio1@test.com", "Test123456!", "Jean Martin");
  const owner2 = await createOwner("proprio2@test.com", "Test123456!", "Marie Dubois");

  if (!owner1 && !owner2) {
    console.log("\n❌ Aucun propriétaire créé. Vérifie les erreurs.");
    return;
  }

  // 2. Assigner les villas sans propriétaire
  console.log("\n=== Assignation des villas ===\n");

  if (owner1) {
    await assignVillas(owner1, ["Appartement", "Lamentin", "Studio"]);
  }
  if (owner2) {
    await assignVillas(owner2, ["Bungalow", "Fort-de-France"]);
  }

  // 3. Vérification finale
  console.log("\n=== Vérification finale ===\n");
  const { data: villas } = await supabaseAdmin
    .from("villas")
    .select("name, owner_id")
    .order("name");

  if (villas) {
    console.log("Villas en base :");
    villas.forEach((v) =>
      console.log(`  ${v.name} → ${v.owner_id ? "✅ assignée" : "❌ PAS de propriétaire"}`)
    );
  }

  console.log("\n=== Terminé ===");
  console.log("\nComptes créés :");
  console.log("  proprio1@test.com / Test123456! — Jean Martin");
  console.log("  proprio2@test.com / Test123456! — Marie Dubois");
}

main().then(() => process.exit(0));
