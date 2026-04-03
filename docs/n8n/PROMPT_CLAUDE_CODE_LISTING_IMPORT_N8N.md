# n8n — Listing import enrich (Diamant Noir)

Webhook dédié (**pas** le chatbot) : le body attendu par Next est décrit dans `lib/listing-import-ai.ts` :

- `source`: `"listing_import_enrich"`
- `pageUrl`, `pageText`, `extractionInstructions`, `parsed`

Headers : `X-Webhook-Secret` si `LISTING_IMPORT_N8N_WEBHOOK_SECRET` est défini côté Next.

Réponse : JSON plat de champs villa, ou enveloppe `listing` / `data` / `body` / `output` / `text` (voir `unwrapN8nListingBody` dans le même fichier).

Garde-fous typiques dans n8n :

1. IF secret → 401 si invalide  
2. IF `source === listing_import_enrich` → sinon 400  
3. (Optionnel) Calcul `missingKeys` sur `parsed` pour guider le LLM  
4. LLM JSON → parse → 200 / erreur 500  

Workflow cloud de référence (session 2026-Q1) : id `c8TfAwgSVSsy7iH0`, chemin `POST …/webhook/diamant-noir-listing-import`.

Pour régénérer un prompt détaillé pour Claude Code / n8n MCP, coller ce contexte + la structure `ListingImportResult` dans `lib/listing-import-types.ts`.
