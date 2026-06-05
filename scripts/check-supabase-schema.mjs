#!/usr/bin/env node
/**
 * Détecte les colonnes référencées dans .select() qui n'existent pas dans types/supabase.ts.
 * Usage: node scripts/check-supabase-schema.mjs
 * Exit 1 si drift détecté (CI / pre-build).
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TYPES_PATH = join(ROOT, "types/supabase.ts");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(p, acc);
    } else if (/\.(ts|tsx)$/.test(name)) {
      acc.push(p);
    }
  }
  return acc;
}

function parseTableColumns(typesSrc) {
  const tables = {};
  const tableRe = /(\w+):\s*\{\s*Row:\s*\{([^}]+)\}/g;
  let m;
  while ((m = tableRe.exec(typesSrc)) !== null) {
    const table = m[1];
    const body = m[2];
    tables[table] = new Set(
      [...body.matchAll(/(\w+):/g)].map((x) => x[1])
    );
  }
  return tables;
}

function extractSelects(src) {
  const hits = [];
  const re = /\.from\(\s*["'](\w+)["']\s*\)[\s\S]*?\.select\(\s*["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const table = m[1];
    const cols = m[2]
      .split(",")
      .map((c) => c.trim().split("(")[0].trim().replace(/\)+$/, ""))
      .filter((c) => c && c !== "*");
    hits.push({ table, cols });
  }
  return hits;
}

const typesSrc = readFileSync(TYPES_PATH, "utf8");
const tableCols = parseTableColumns(typesSrc);

const scanDirs = [
  join(ROOT, "app"),
  join(ROOT, "components"),
  join(ROOT, "lib"),
];

const errors = [];
for (const dir of scanDirs) {
  for (const file of walk(dir)) {
    const src = readFileSync(file, "utf8");
    for (const { table, cols } of extractSelects(src)) {
      const known = tableCols[table];
      if (!known) continue;
      for (const col of cols) {
        if (!col || col.includes("(") || tableCols[col]) continue;
        if (!known.has(col)) {
          errors.push(`${file}: ${table}.${col} absent de types/supabase.ts`);
        }
      }
    }
  }
}

if (errors.length) {
  console.error("Schema drift détecté:\n");
  for (const e of [...new Set(errors)].sort()) console.error("  -", e);
  process.exit(1);
}

console.log("OK — aucun drift colonne détecté dans les .select()");
