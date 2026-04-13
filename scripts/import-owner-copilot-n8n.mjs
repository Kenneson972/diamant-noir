#!/usr/bin/env node
/**
 * Importe docs/n8n/owner-copilot-workflow-v2.json dans une instance n8n via l’API REST.
 *
 * Prérequis :
 *   - n8n ≥ 1.x avec API activée (Settings → API)
 *   - Clé API : Settings → n8n API → Create API Key
 *
 * Usage :
 *   N8N_BASE_URL=https://votre-n8n.com N8N_API_KEY=n8n_api_xxx node scripts/import-owner-copilot-n8n.mjs
 *
 * Depuis la racine diamant-noir :
 *   node scripts/import-owner-copilot-n8n.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WORKFLOW_FILE = path.join(ROOT, "docs/n8n/owner-copilot-workflow-v2.json");

const base = (process.env.N8N_BASE_URL || "").replace(/\/$/, "");
const apiKey = process.env.N8N_API_KEY || "";

if (!base || !apiKey) {
  console.error(`
Import API n8n : variables manquantes.

Définissez :
  N8N_BASE_URL   URL de base (ex. https://n8n.votredomaine.com)
  N8N_API_KEY    Clé API (Settings → API dans n8n)

Exemple :
  N8N_BASE_URL=https://n8n.example.com N8N_API_KEY=n8n_api_xxx node scripts/import-owner-copilot-n8n.mjs

Import manuel (sans API) :
  1. Ouvrir n8n → Workflows → menu ⋮ → Import from File
  2. Choisir : docs/n8n/owner-copilot-workflow-v2.json
  3. Après import : lier la credential « Anthropic API Key » sur le nœud HTTP Anthropic
  4. Définir la variable d’environnement n8n N8N_OWNER_WEBHOOK_SECRET si vous utilisez le secret côté Next.js
  5. Activer le workflow et copier l’URL Production du webhook → N8N_OWNER_WEBHOOK_URL dans Vercel
`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(WORKFLOW_FILE, "utf8"));

/** Payload attendu par POST /api/v1/workflows (création). */
const payload = {
  name: raw.name,
  nodes: raw.nodes,
  connections: raw.connections || {},
  settings: raw.settings || {},
  staticData: undefined,
  meta: raw.meta || {},
};

if (Array.isArray(raw.tags) && raw.tags.length > 0) {
  payload.tags = raw.tags;
}

const url = `${base}/api/v1/workflows`;

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": apiKey,
  },
  body: JSON.stringify(payload),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = { raw: text };
}

if (!res.ok) {
  console.error(`Erreur HTTP ${res.status} :`, json.raw || json);
  process.exit(1);
}

console.log("Workflow importé avec succès.");
console.log("id:", json.id);
console.log("name:", json.name);
if (json.webhookUrl) {
  console.log("webhookUrl:", json.webhookUrl);
} else {
  console.log(
    "Ouvrez le workflow dans n8n, activez-le, puis copiez l’URL « Production URL » du nœud Webhook pour N8N_OWNER_WEBHOOK_URL."
  );
}
