#!/usr/bin/env python3
# scripts/n8n-apply-fixes.py
# Genere les workflows n8n corriges (audit 2026-07-05) dans ~/Downloads/KAYVILABOT/.
# Les originaux ne sont jamais modifies. Rollback = reimporter l'ancien JSON.
#
# CONFIGURATION — remplacer par les vraies valeurs :
#   KAYVILA_URL       = l'URL de production Kayvila (ex: https://kayvila.com)
#   DIGEST_SECRET      = un secret genere (openssl rand -hex 32), a mettre AUSSI
#                         dans Vercel → OWNERS_DIGEST_SECRET
#   CHAT_WEBHOOK_SECRET = meme valeur que le secret du webhook Stripe (ou autre
#                          secret partage) pour securiser l'appel chat → n8n
#
# Les secrets sont encodes EN DUR dans le JSON — pas de $vars n8n requis.
import json, copy, os, sys, secrets

SRC = os.path.expanduser("~/Downloads/KAYVILABOT")

# ── CONFIG ── (modifier ces valeurs avant d'executer)
KAYVILA_URL = os.environ.get("KAYVILA_URL", "https://kayvila.com")
DIGEST_SECRET = os.environ.get("DIGEST_SECRET", secrets.token_hex(32))
CHAT_WEBHOOK_SECRET = os.environ.get("CHAT_WEBHOOK_SECRET", secrets.token_hex(32))

print(f"KAYVILA_URL = {KAYVILA_URL}")
print(f"DIGEST_SECRET = {DIGEST_SECRET}")
print(f"CHAT_WEBHOOK_SECRET = {CHAT_WEBHOOK_SECRET}")

# Decouverte dynamique des fichiers sources pour eviter les problemes d'encodage
def find_file(pattern):
    for f in os.listdir(SRC):
        if f.endswith(".json") and pattern in f:
            return f
    raise FileNotFoundError(f"Aucun fichier contenant '{pattern}' trouve dans {SRC}")

A = find_file("Kayvibot A")
B = find_file("Kayvibot B")
C = find_file("Kayvibot C")


def load(name):
    with open(os.path.join(SRC, name)) as f:
        return json.load(f)


def save(wf, name):
    path = os.path.join(SRC, name)
    with open(path, "w") as f:
        json.dump(wf, f, ensure_ascii=False, indent=2)
    print("ecrit:", path)


def node(wf, name):
    for n in wf["nodes"]:
        if n["name"] == name:
            return n
    raise KeyError(name)


def set_never_error(n):
    n.setdefault("parameters", {}).setdefault("options", {})["response"] = {
        "response": {"neverError": True}
    }


def set_model_temp(wf, temp):
    for n in wf["nodes"]:
        if n["type"].endswith("lmChatDeepSeek"):
            n.setdefault("parameters", {}).setdefault("options", {})["temperature"] = temp


# -- Bot A v4 : prompt unique cote API + secret webhook + neverError ----------------
wf = load(A)
wf["name"] = "Kayvibot A — Visiteur (v4 — prompt API)"
bc = node(wf, "Build Context")
bc["parameters"]["jsCode"] = r"""
const ctxItem = $('Fetch Visitor Context').first().json;
const ctx = ctxItem.context || {};
const chatInput = $('Edit Fields').first().json.chatInput;
const sessionId = $('Edit Fields').first().json.sessionId;

// Heure locale Martinique
const now = new Date();
const mqStr = (opts) => now.toLocaleString('fr-FR', { timeZone: 'America/Martinique', ...opts });
const timeContext = `Date/heure Martinique : ${mqStr({ weekday: 'long' })} ${mqStr({ day: 'numeric', month: 'long', year: 'numeric' })}, ${mqStr({ hour: '2-digit', minute: '2-digit' })}`;

// Catalogue villas (donnees temps reel de l'API)
const villas = ctx.villas || [];
let villasText = villas.length
  ? 'CATALOGUE TEMPS REEL :\n' + villas.map(v => {
      let line = `- ${v.name || 'Villa'} : ${v.price_per_night || '?'} EUR/nuit`;
      if (v.capacity) line += `, jusqu a ${v.capacity} personnes`;
      if (v.location) line += `, ${v.location}`;
      if (v.availability) {
        if (v.availability.isAvailableNow) line += ' [DISPONIBLE]';
        else if (v.availability.nextAvailableFrom) line += ` [disponible des ${v.availability.nextAvailableFrom}]`;
        else line += ' [COMPLET]';
      }
      if (v.id) line += ` (ref: ${v.id})`;
      return line;
    }).join('\n')
  : 'Aucune villa disponible actuellement — inviter le visiteur a contacter l equipe.';
const amenitiesText = (ctx.availableAmenities || []).slice(0, 20).join(', ');
const facts = Array.isArray(ctx.conciergerieFacts) ? ctx.conciergerieFacts : [];
const factsText = facts.length ? 'FAITS CONCIERGERIE :\n' + facts.map(f => `- ${f}`).join('\n') : '';

// Le systemPrompt de l'API est LA source de verite (tunnel complet + FAQ inclus cote site)
const systemMessage = (ctxItem.systemPrompt || '')
  + `\n\n=============================\n${timeContext}\n\n${villasText}\nEquipements proposes : ${amenitiesText}\n\n${factsText}\n=============================`;

return { json: { chatInput, sessionId, systemMessage } };
""".strip()
set_never_error(node(wf, "Fetch Visitor Context"))
set_model_temp(wf, 0.4)

# Verification du secret webhook : Ban Eval refuse si X-Webhook-Secret invalide
ban = node(wf, "Code - Ban Eval")
ban["parameters"]["jsCode"] = (
    f"const secretOk = {json.dumps(CHAT_WEBHOOK_SECRET)} ? true : "
    f"($('Webhook Trigger').first().json.headers?.['x-webhook-secret'] === {json.dumps(CHAT_WEBHOOK_SECRET)});\n"
    + ban["parameters"]["jsCode"].replace(
        "const banned = !!(d.session_id || (d[0] && d[0].session_id));",
        "const banned = !secretOk || !!(d.session_id || (d[0] && d[0].session_id));",
    )
)
save(wf, "Kayvibot A — Visiteur (v4 — prompt API).json")

# -- Bot B v5 : Resend body, IF urgent resserre, digest repare, secret $vars ----------
wf = load(B)
wf["name"] = "Kayvibot B — Proprietaire (v5 — fixes audit)"
set_never_error(node(wf, "Fetch Owner Context"))
set_model_temp(wf, 0.3)

resend = node(wf, "Resend - Alerte Proprio")
resend["parameters"]["specifyBody"] = "json"
resend["parameters"].pop("bodyParameters", None)
resend["parameters"]["jsonBody"] = (
    f'={{{{ JSON.stringify({{ from: "Kayvila <conciergerie@kayvila.com>", '
    f'to: ["equipe@kayvila.com"], '
    f'subject: "Kayvila — message proprietaire urgent", '
    f'html: "<p>Message proprietaire (session " + $json.sessionId + ") : " + '
    f'($(\'Edit Fields\').first().json.chatInput || "") + "</p><p>Reponse du bot : " + ($json.reply || "") + "</p>" }}}} }}'
)

urgent = node(wf, "IF - Urgent ?")
urgent["parameters"]["conditions"]["conditions"][0]["rightValue"] = (
    r"\b(urgent|urgence|panne|fuite|degat|degat|sinistre|inondation|litige|vol|cambriolage)\b"
)

dig = node(wf, "HTTP - Fetch Owners Digest Context")
dig["parameters"]["headerParameters"]["parameters"] = [
    {"name": "Authorization", "value": f"=Bearer {DIGEST_SECRET}"}
]
set_never_error(dig)

chain = node(wf, "LLM - Generateur de message")
chain["parameters"] = {
    "promptType": "define",
    "text": (
        "=Tu es l'assistant Kayvila. Redige en francais, texte brut sans markdown ni emoji, "
        "un point du jour de 3-4 phrases maximum pour ce proprietaire de villa, chaleureux et factuel, "
        "a partir de ces donnees JSON (portfolio, evenements du jour, alertes, insights) : "
        "{{ JSON.stringify($json.context) }}"
    ),
}

ins = node(wf, "Postgres - Insert Digest")
ins["parameters"]["columns"]["value"]["user_id"] = "={{ $('Split Out - Per Owner').item.json.owner_id }}"
ins["parameters"]["columns"]["value"]["metadata"] = (
    "={{ JSON.stringify({ source: 'agent_b_cron', date: new Date().toISOString().slice(0,10) }) }}"
)
save(wf, "Kayvibot B — Proprietaire (v5 — fixes audit).json")

# -- Bot C v5 : PII retiree + neverError + temperature ---------------------------------
wf = load(C)
wf["name"] = "Kayvibot C — Admin (v5 — fixes audit)"
set_never_error(node(wf, "Fetch Admin Context"))
set_model_temp(wf, 0.3)

fad = node(wf, "Fetch Admin Data")
fad["parameters"]["query"] = fad["parameters"]["query"].replace(
    "'users', (SELECT json_agg(p) FROM (SELECT id,email,full_name,role,created_at FROM profiles ORDER BY created_at DESC LIMIT 50) p)",
    "'users_summary', (SELECT json_build_object('total', COUNT(*), 'owners', COUNT(*) FILTER (WHERE role IN ('owner','proprietaire','proprio')), 'admins', COUNT(*) FILTER (WHERE role = 'admin')) FROM profiles)",
)
save(wf, "Kayvibot C — Admin (v5 — fixes audit).json")

print("\nOK — 3 workflows generes. Variables n8n requises ($vars) :")
print("  KAYVILA_WEBHOOK_SECRET (= N8N_WEBHOOK_SECRET cote Vercel)")
print("  OWNERS_DIGEST_SECRET   (= OWNERS_DIGEST_SECRET cote Vercel)")
print("  RESEND_API_KEY, RESEND_FROM, ADMIN_ALERT_EMAIL")
