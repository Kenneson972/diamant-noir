# Agent A « Concierge » Kayvila — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le chatbot visiteur Kayvila en concierge de luxe qui guide vers la pré-réservation, et faire réagir le frontend (carte de pré-réservation + escalade humaine).

**Architecture:** n8n décide (persona + 9 stages + émission `preBooking`/`shouldEscalateToHuman`), l'API persiste/notifie (réutilise `/api/chat/pre-book` + nouvelle notif `human_handoff`), le frontend `Chatbot.tsx` réagit (PreBookingCard via `/api/chat/pre-book`, bandeau handoff). Aucune logique DB dans n8n.

**Tech Stack:** Next.js 15 (App Router, route handlers Node runtime), React 19 client component, Supabase (service-role via `supabaseAdmin`), n8n Cloud (DeepSeek), Playwright (tests), vitest (lib).

## Global Constraints

- **Fichier n8n à éditer :** `~/Downloads/Kayvibot A — Visiteur (Fusion v3 — Dalcielo_Elise).json` (PAS la copie repo `docs/n8n/kayvibot-agent-a-visiteur-fusion.json`). Édition JSON uniquement — déploiement live fait par Élise/Kenneson.
- **Ne PAS modifier :** `app/book/page.tsx`, `app/api/chat/pre-book/route.ts`, le pipeline sécurité n8n (anti-ban, anti-toxicité).
- **Zéro emoji** partout (règle design Kayvila ; or en signal uniquement). Texte brut côté chatbot.
- **Nom du flag d'escalade :** `shouldEscalateToHuman` (l'API le lit déjà ; le LLM peut émettre `shouldEscalate`, on normalise).
- **Forme runtime de `preBooking` (contrat fil n8n→API→front) :** `{ villaId, email, startDate, endDate, guests, firstName } | null`. Mappe 1:1 vers `validatePreBook` (`firstName`→`name`).
- **`bookingUrl` = valeur retournée par `/api/chat/pre-book`**, jamais reconstruite côté client.
- **Tests Playwright :** pas de `webServer` dans `playwright.config.ts` → un dev server doit tourner sur `:3000` (`npx next dev -p 3000`, SANS `--turbo`). Le chatbot visiteur s'affiche sur `/` (caché sur /dashboard,/login,/admin,/espace-client) → tester sur `/`, aucun login requis. Lancer 2× en workers par défaut pour vérifier la non-flakiness.
- **Contrainte CHECK PostgreSQL :** jamais d'ALTER d'une contrainte CHECK en place → DROP CONSTRAINT + ADD CONSTRAINT.

---

### Task 1: Migration — autoriser le type de notif `human_handoff`

**Files:**
- Create: `supabase/migrations/20260621_notifications_human_handoff.sql`

**Interfaces:**
- Produces: la valeur `'human_handoff'` devient acceptée par `notifications_type_check` (consommée par Task 2).

Contrainte actuelle (vérifiée live) — types autorisés : `villa_submission, booking_new, booking_confirmed, ical_error, availability_alert, system, request_update, checkin_reminder, checkout_reminder, new_message, pre_booking, hot_lead, owner_lead, admin_alert, owner_daily_digest`.

- [ ] **Step 1: Écrire la migration**

Create `supabase/migrations/20260621_notifications_human_handoff.sql` :

```sql
-- Agent A escalade : autoriser le type de notif human_handoff
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'villa_submission','booking_new','booking_confirmed','ical_error',
    'availability_alert','system','request_update','checkin_reminder',
    'checkout_reminder','new_message','pre_booking','hot_lead','owner_lead',
    'admin_alert','owner_daily_digest','human_handoff'
  ]::text[])
);
```

- [ ] **Step 2: Appliquer la migration (Supabase MCP `apply_migration`)**

Projet `wsdawdxucyuyopkpgjij`, name `notifications_human_handoff`, query = contenu du fichier ci-dessus.

- [ ] **Step 3: Vérifier que le type est accepté**

Exécuter (SQL) :
```sql
INSERT INTO notifications (user_id, type, title, body)
VALUES (NULL, 'human_handoff', 'test', 'test') RETURNING id;
```
Expected: 1 ligne retournée (pas d'erreur `violates check constraint`). Puis nettoyer :
```sql
DELETE FROM notifications WHERE type='human_handoff' AND title='test';
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260621_notifications_human_handoff.sql
git commit -m "feat(db): autoriser le type de notif human_handoff (escalade Agent A)"
```

---

### Task 2: API — notif `human_handoff` sur escalade

**Files:**
- Modify: `app/api/chat/route.ts` (ajouter `notifyHandoffOnce` près de `notifyHotLeadOnce` ~lignes 96-111 ; appeler dans le bloc POST après le calcul de `parsed`, près de la gestion `ownerLead` ~ligne 289)

**Interfaces:**
- Consumes: `parsed.shouldEscalateToHuman` (déjà extrait par `parseN8nResponse`), `supabaseAdmin()`, type `human_handoff` (Task 1).
- Produces: aucune nouvelle export (effet de bord notif).

Pattern existant à copier (`notifyHotLeadOnce`, lignes 95-111) :
```ts
const _hotLeadNotified = new Set<string>();
async function notifyHotLeadOnce(sessionId: string, summary: string) {
  if (_hotLeadNotified.has(sessionId)) return;
  _hotLeadNotified.add(sessionId);
  try {
    await supabaseAdmin().from("notifications").insert({
      user_id: null, type: "hot_lead", title: "Lead chaud détecté", body: summary.slice(0, 280),
    });
  } catch (e) { console.warn("[api/chat] hot_lead notif", e); }
}
```

- [ ] **Step 1: Ajouter le helper `notifyHandoffOnce`**

Juste après la fonction `notifyHotLeadOnce` (après sa ligne `}` de fermeture, ~ligne 111) :

```ts
// Throttle mémoire : 1 notif escalade humaine par session
const _handoffNotified = new Set<string>();

async function notifyHandoffOnce(sessionId: string, reason: string | undefined) {
  if (_handoffNotified.has(sessionId)) return;
  _handoffNotified.add(sessionId);
  try {
    // Cap anti-spam : 50 notifs human_handoff / heure
    const { count } = await supabaseAdmin()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", "human_handoff")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());
    if ((count ?? 0) >= 50) return;
    await supabaseAdmin().from("notifications").insert({
      user_id: null,
      type: "human_handoff",
      title: "Demande de contact humain",
      body: `Session ${sessionId}${reason ? ` — ${reason}` : ""}`.slice(0, 280),
    });
  } catch (e) {
    console.warn("[api/chat] human_handoff notif", e);
  }
}
```

- [ ] **Step 2: Appeler le helper sur escalade**

Dans `POST`, juste après le bloc `if (parsed.ownerLead) { await handleOwnerLeadOnce(...); }` (~ligne 291) et AVANT `return NextResponse.json(clientResponse);` :

```ts
    if (parsed.shouldEscalateToHuman) {
      await notifyHandoffOnce(sessionId, parsed.humanHandoffReason);
    }
```

- [ ] **Step 3: Vérifier le type-check**

Run: `npx tsc --noEmit 2>&1 | grep -v "a11y.spec"`
Expected: aucune erreur concernant `app/api/chat/route.ts` (les erreurs pré-existantes `tests/a11y.spec.ts` sont hors-scope).

- [ ] **Step 4: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat(api/chat): notif human_handoff sur escalade (throttle + cap, pattern hot_lead)"
```

---

### Task 3: Frontend — PreBookingCard + appel pre-book + bandeau handoff

**Files:**
- Modify: `components/chatbot/Chatbot.tsx` (type message ~ligne 43 ; `sendMessage` ~lignes 201-220 ; rendu des messages ~lignes 351-373 ; imports lucide ~ligne 6)
- Test: `tests/chatbot-prebooking.spec.ts` (create)

**Interfaces:**
- Consumes: réponse `/api/chat` (champ runtime `data.preBooking = { villaId, email, startDate, endDate, guests, firstName }`, `data.shouldEscalateToHuman`), endpoint `POST /api/chat/pre-book` (retourne `{ success: true, bookingUrl }` ou `{ success: false, error }`).
- Produces: rendu visuel (carte + bandeau) ; pas d'export.

- [ ] **Step 1: Écrire le test Playwright (échouera)**

Create `tests/chatbot-prebooking.spec.ts` :

```ts
import { test, expect, type Page } from "@playwright/test";

const PREBOOK = {
  villaId: "11111111-1111-1111-1111-111111111111",
  email: "visiteur@test.com",
  startDate: "2026-08-01",
  endDate: "2026-08-05",
  guests: 4,
  firstName: "Jean",
};

async function openChatbot(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir le chat" }).click();
  await expect(page.getByPlaceholder("Tapez votre message...")).toBeVisible();
}

test.describe("Chatbot visiteur — pré-réservation & escalade", () => {
  test("preBooking → appelle pre-book et affiche la carte avec le bon lien", async ({ page }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "Parfait, je vous prépare cette réservation.",
          stage: "prebook",
          preBooking: PREBOOK,
          suggestedQuickReplies: [],
        }),
      })
    );
    const bookingUrl =
      "/book?villaId=" + PREBOOK.villaId + "&checkin=2026-08-01&checkout=2026-08-05&guests=4";
    let preBookBody: Record<string, unknown> | null = null;
    await page.route("**/api/chat/pre-book", async (route) => {
      preBookBody = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, bookingUrl }),
      });
    });

    await openChatbot(page);
    await page.getByPlaceholder("Tapez votre message...").fill("Je confirme ma réservation");
    await page.getByPlaceholder("Tapez votre message...").press("Enter");

    const cta = page.getByRole("link", { name: "Réserver cette villa" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", bookingUrl);
    // Le front a bien transmis les champs attendus par validatePreBook
    expect(preBookBody).toMatchObject({
      villaId: PREBOOK.villaId,
      email: PREBOOK.email,
      startDate: PREBOOK.startDate,
      endDate: PREBOOK.endDate,
      guests: PREBOOK.guests,
      name: PREBOOK.firstName,
    });
  });

  test("pre-book en échec → pas de carte mais le message reste", async ({ page }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ reply: "Je note votre demande.", stage: "prebook", preBooking: PREBOOK }),
      })
    );
    await page.route("**/api/chat/pre-book", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Villa introuvable." }),
      })
    );
    await openChatbot(page);
    await page.getByPlaceholder("Tapez votre message...").fill("Je confirme");
    await page.getByPlaceholder("Tapez votre message...").press("Enter");
    await expect(page.getByText("Je note votre demande.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Réserver cette villa" })).toHaveCount(0);
  });

  test("shouldEscalateToHuman → bandeau handoff", async ({ page }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "Je transmets votre demande à notre équipe.",
          stage: "handoff",
          shouldEscalateToHuman: true,
        }),
      })
    );
    await openChatbot(page);
    await page.getByPlaceholder("Tapez votre message...").fill("Je veux parler à un humain");
    await page.getByPlaceholder("Tapez votre message...").press("Enter");
    await expect(page.getByText("Notre équipe vous contactera personnellement")).toBeVisible();
  });
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

D'abord démarrer le dev server : `npx next dev -p 3000` (SANS `--turbo`, en arrière-plan).
Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/chatbot-prebooking.spec.ts --reporter=list`
Expected: FAIL — pas de lien « Réserver cette villa » ni de bandeau (rien n'est encore implémenté).

- [ ] **Step 3: Étendre les imports lucide**

Ligne 6, ajouter `CalendarDays, Users` à l'import existant :
```tsx
import { MessageCircle, X, Send, Smile, Maximize2, Minimize2, Sparkles, Headphones, RotateCcw, CalendarDays, Users } from "lucide-react";
```

- [ ] **Step 4: Étendre le type message + l'état**

Remplacer la déclaration `messages` (ligne ~43) :
```tsx
  type PreBookingCardData = { startDate: string; endDate: string; guests: number; bookingUrl: string };
  type ChatMessage = { role: "user" | "assistant"; content: string; preBookingCard?: PreBookingCardData; escalated?: boolean };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
```
(Adapter les `setMessages((prev) => [...prev, { role: ..., content: ... }])` existants n'est pas nécessaire — le type élargi reste compatible car `preBookingCard`/`escalated` sont optionnels.)

- [ ] **Step 5: Gérer preBooking + escalade dans `sendMessage`**

Dans `sendMessage`, remplacer le bloc actuel qui pousse la réponse assistant (lignes ~202-206) :
```tsx
      const data = await response.json();
      const chatResponse = data.reply || data.response || "Je rencontre une difficulté technique passagère. Veuillez réessayer dans quelques instants.";

      setMessages((prev) => [...prev, { role: "assistant", content: chatResponse }]);

      if (data.stage) setCurrentStage(data.stage);
```
par :
```tsx
      const data = await response.json();
      const chatResponse = data.reply || data.response || "Je rencontre une difficulté technique passagère. Veuillez réessayer dans quelques instants.";

      // Pré-réservation : persister via /api/chat/pre-book (source de vérité du bookingUrl)
      let preBookingCard: PreBookingCardData | undefined;
      const pb = data.preBooking;
      if (pb && pb.villaId && pb.email && pb.startDate && pb.endDate) {
        try {
          const pbRes = await fetch("/api/chat/pre-book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              villaId: pb.villaId,
              email: pb.email,
              startDate: pb.startDate,
              endDate: pb.endDate,
              guests: pb.guests,
              name: pb.firstName,
              sessionId: getOrCreateSessionId(),
            }),
          });
          const pbData = await pbRes.json();
          if (pbRes.ok && pbData.success && pbData.bookingUrl) {
            preBookingCard = {
              startDate: pb.startDate,
              endDate: pb.endDate,
              guests: pb.guests,
              bookingUrl: pbData.bookingUrl,
            };
          }
        } catch (e) {
          console.warn("pre-book error", e);
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: chatResponse, preBookingCard, escalated: data.shouldEscalateToHuman === true },
      ]);

      if (data.stage) setCurrentStage(data.stage);
```

- [ ] **Step 6: Rendre la carte + le bandeau dans la bulle assistant**

Dans le rendu des messages, à l'intérieur de la bulle (juste après la `<div>` qui contient `renderMessageContent(message.content)`, soit après la ligne ~370 `</div>` qui ferme `text-sm leading-relaxed font-medium`), insérer :
```tsx
                  {message.preBookingCard && (
                    <div className="mt-3 rounded-xl border border-gold/30 bg-gold/[0.06] p-4">
                      <p className="text-sm font-semibold text-navy">Réservation proposée</p>
                      <div className="mt-2 space-y-1.5 text-sm text-navy/70">
                        <p className="flex items-center gap-2">
                          <CalendarDays size={15} className="text-gold" />
                          {message.preBookingCard.startDate} → {message.preBookingCard.endDate}
                        </p>
                        <p className="flex items-center gap-2">
                          <Users size={15} className="text-gold" />
                          {message.preBookingCard.guests} voyageur{message.preBookingCard.guests > 1 ? "s" : ""}
                        </p>
                      </div>
                      <a
                        href={message.preBookingCard.bookingUrl}
                        className="mt-3 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold/90"
                      >
                        Réserver cette villa
                      </a>
                    </div>
                  )}
                  {message.escalated && (
                    <p className="mt-3 rounded-lg border border-navy/15 bg-navy/[0.04] px-3 py-2 text-xs text-navy/70">
                      Notre équipe vous contactera personnellement dans les plus brefs délais.
                    </p>
                  )}
```

- [ ] **Step 7: Lancer les tests pour vérifier qu'ils passent**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/chatbot-prebooking.spec.ts --reporter=list`
Expected: 3 passed. Relancer une 2ᵉ fois (workers par défaut) → 3 passed (non-flaky).

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep -v "a11y.spec"`
Expected: aucune erreur sur `components/chatbot/Chatbot.tsx`.

- [ ] **Step 9: Commit**

```bash
git add components/chatbot/Chatbot.tsx tests/chatbot-prebooking.spec.ts
git commit -m "feat(chatbot): PreBookingCard via /api/chat/pre-book + bandeau escalade humaine"
```

---

### Task 4: n8n — persona/stages (Build Context) + escalade (Parse Response) + mémoire 20

**Files:**
- Modify: `~/Downloads/Kayvibot A — Visiteur (Fusion v3 — Dalcielo_Elise).json` (nœuds `Build Context`, `Parse Response`, `Postgres Chat Memory`)

**Interfaces:**
- Produces (contrat fil) : la réponse n8n contient `reply, stage, suggestedQuickReplies, preBooking {villaId,email,startDate,endDate,guests,firstName}|null, ownerLead|null, shouldEscalateToHuman:boolean, intent, leadTemperature`. Consommé par `app/api/chat/route.ts` (`parseN8nResponse`) et le front (Task 3).

> Édition fiable du JSON via un script Python (les nœuds n8n stockent du code dans des chaînes — éviter l'édition manuelle). Toutes les modifs en une passe, puis validation `json.load`.

- [ ] **Step 1: Écrire le script de patch**

Create (fichier temporaire) `scripts/patch-agent-a.py` :

```python
import json, sys

PATH = "/Users/kennesonbasel-somnier/Downloads/Kayvibot A — Visiteur (Fusion v3 — Dalcielo_Elise).json"
d = json.load(open(PATH, encoding="utf-8"))

CONCIERGE = r"""Tu es le Concierge IA de Kayvila, plateforme de location de villas de luxe en Martinique.

TON :
- Vouvoiement systematique
- Phrases courtes, 1-2 lignes par paragraphe
- Chaleureux et fier de la Martinique, jamais arrogant
- Aucun emoji
- Pas de formules vides (Bien sur, Avec plaisir)

REGLES ABSOLUES :
1. Ne JAMAIS confirmer une disponibilite sans verification explicite dans les donnees fournies
2. Ne JAMAIS inventer un prix absent des donnees villa
3. Ne JAMAIS inventer un equipement ou service non liste
4. Si une info est inconnue, repondre : Nous verifions et vous confirmons cela dans la journee
5. Si le visiteur demande a parler a un humain, passer immediatement en stage handoff

STAGES DE CONVERSATION (dans l ordre) :
- greet : Accueillir chaleureusement, 1 seul echange. Passer a discover.
- discover : Questions ouvertes (dates, budget, nombre, ambiance). 1-3 echanges.
- clarify : 1 seule question par echange. Max 2 echanges.
- recommend : Presenter 1-2 villas MAXIMUM avec leurs atouts. 1-2 echanges.
- qualify : Collecter les infos manquantes. Max 2 questions par echange. 2-3 echanges.
- verify : Recapituler TOUS les slots collectes. Demander confirmation. 1 echange.
- prebook : Confirmer et proposer le lien de reservation. 1 echange.
- handoff : Notre equipe vous contactera personnellement dans les plus brefs delais.
- fallback : Reorienter poliment vers Kayvila.

LEAD TEMPERATURE :
- cold : aucune date, aucune villa, aucun budget -> ton exploratoire
- warm : >=1 critere -> qualifier activement
- hot : dates + villa + budget + contact -> pre-booker directement

SLOTS OBLIGATOIRES POUR PRE-BOOKING :
- checkIn (date future, YYYY-MM-DD)
- checkOut (apres checkIn, min 2 nuits)
- totalGuests (1 a capacite villa)
- email (format valide)

ORDRE DE COLLECTE :
1. firstName (des que possible, naturellement)
2. totalGuests
3. checkIn + checkOut (ensemble, 1 echange)
4. email (jamais avant interet manifeste)
5. phone (optionnel)

ESCALADE HUMAINE - passer a handoff ET mettre shouldEscalateToHuman=true si :
- Demande explicite de parler a un humain
- Suivi d une reservation existante
- Frustration detectee
- 3 echanges sans progression dans le stage

FORMAT DE REPONSE - UNIQUEMENT ce JSON, rien avant/apres :
{"reply":"...","stage":"greet|discover|clarify|recommend|qualify|verify|prebook|handoff|fallback","intent":"booking_inquiry|general_info|availability|pricing|unsupported|booking_followup","leadTemperature":"cold|warm|hot","suggestedQuickReplies":["..."],"preBooking":null,"ownerLead":null,"shouldEscalateToHuman":false}

PRE-BOOKING - quand le visiteur confirme en stage verify, remplir preBooking :
{"villaId":"valeur (ref: ...) du catalogue, jamais inventee","email":"...","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","guests":4,"firstName":"..."}
"""

def patch_node(name, fn):
    for n in d["nodes"]:
        if n["name"] == name:
            fn(n); return
    sys.exit("node not found: " + name)

# --- Build Context : injecter la persona AVANT basePrompt ---
def build_ctx(n):
    code = n["parameters"]["jsCode"]
    anchor = "const basePrompt = ctxItem.systemPrompt || '';"
    assert anchor in code, "anchor basePrompt introuvable"
    code = code.replace(anchor, anchor + "\nconst CONCIERGE = " + json.dumps(CONCIERGE, ensure_ascii=False) + ";")
    code = code.replace("const systemMessage = basePrompt", "const systemMessage = CONCIERGE + '\\n\\n' + basePrompt")
    n["parameters"]["jsCode"] = code
patch_node("Build Context", build_ctx)

# --- Parse Response : extraire shouldEscalateToHuman + intent + leadTemperature ---
def parse_resp(n):
    code = n["parameters"]["jsCode"]
    old_decl = "let reply = ai, stage = 'reply', quick = [], preBooking = null, ownerLead = null;"
    new_decl = "let reply = ai, stage = 'reply', quick = [], preBooking = null, ownerLead = null, shouldEscalateToHuman = false, intent = null, leadTemperature = null;"
    assert old_decl in code, "decl introuvable"
    code = code.replace(old_decl, new_decl)
    old_assign = "    ownerLead = p.ownerLead || null;"
    new_assign = ("    ownerLead = p.ownerLead || null;\n"
                  "    shouldEscalateToHuman = (p.shouldEscalateToHuman ?? p.shouldEscalate) === true;\n"
                  "    intent = p.intent || null;\n"
                  "    leadTemperature = p.leadTemperature || null;")
    assert old_assign in code, "assign ownerLead introuvable"
    code = code.replace(old_assign, new_assign)
    old_ret = "return { json: { reply, stage, suggestedQuickReplies: quick, preBooking, ownerLead, sessionId: $('Edit Fields').first().json.sessionId } };"
    new_ret = "return { json: { reply, stage, suggestedQuickReplies: quick, preBooking, ownerLead, shouldEscalateToHuman, intent, leadTemperature, sessionId: $('Edit Fields').first().json.sessionId } };"
    assert old_ret in code, "return introuvable"
    code = code.replace(old_ret, new_ret)
    n["parameters"]["jsCode"] = code
patch_node("Parse Response", parse_resp)

# --- Postgres Chat Memory : contextWindowLength 10 -> 20 ---
def mem(n):
    n["parameters"]["contextWindowLength"] = 20
patch_node("Postgres Chat Memory", mem)

json.dump(d, open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("OK patched")
```

- [ ] **Step 2: Exécuter le patch**

Run: `python3 scripts/patch-agent-a.py`
Expected: `OK patched` (aucune AssertionError — si une ancre manque, le script s'arrête, signe que le JSON a divergé → relire le nœud avant de continuer).

- [ ] **Step 3: Valider le JSON + les modifs**

Run:
```bash
python3 -c "
import json
d=json.load(open('/Users/kennesonbasel-somnier/Downloads/Kayvibot A — Visiteur (Fusion v3 — Dalcielo_Elise).json',encoding='utf-8'))
bc=[n for n in d['nodes'] if n['name']=='Build Context'][0]['parameters']['jsCode']
pr=[n for n in d['nodes'] if n['name']=='Parse Response'][0]['parameters']['jsCode']
mem=[n for n in d['nodes'] if n['name']=='Postgres Chat Memory'][0]['parameters']['contextWindowLength']
assert 'Concierge IA de Kayvila' in bc, 'persona absente'
assert 'CONCIERGE +' in bc, 'persona non chainee'
assert 'shouldEscalateToHuman' in pr, 'escalade absente'
assert mem==20, 'memoire != 20'
print('VALIDATION OK — nodes:', len(d['nodes']))
"
```
Expected: `VALIDATION OK — nodes: 21`.

- [ ] **Step 4: Supprimer le script temporaire et committer le JSON patché**

> Le JSON est dans `~/Downloads` (hors repo) — il ne sera pas committé dans le repo. Copier la version patchée dans le repo pour archivage + supprimer le script.

```bash
cp "/Users/kennesonbasel-somnier/Downloads/Kayvibot A — Visiteur (Fusion v3 — Dalcielo_Elise).json" docs/n8n/kayvibot-agent-a-visiteur-fusion-v3-concierge.json
rm scripts/patch-agent-a.py
git add docs/n8n/kayvibot-agent-a-visiteur-fusion-v3-concierge.json
git commit -m "feat(n8n/agent-a): persona concierge + 9 stages + escalade shouldEscalateToHuman + mémoire 20"
```

- [ ] **Step 5: Note de livraison pour Élise/Kenneson**

Le fichier `~/Downloads/Kayvibot A — Visiteur (Fusion v3 — Dalcielo_Elise).json` est patché et prêt à être (ré)importé sur n8n Cloud. Vérifier après import : le credential DeepSeek reste lié, le webhook `kayvibot-visitor` est actif, et un message de test renvoie un JSON avec `stage` + `shouldEscalateToHuman`.

---

## Self-Review

**Spec coverage :**
- Unité 1 (persona/stages) → Task 4 Step 1-2 ✓
- Unité 2 (Parse Response escalade) → Task 4 ✓
- Unité 3 (mémoire 20) → Task 4 ✓
- Unité 4 (frontend card + appel pre-book + bandeau) → Task 3 ✓
- Unité 5 (notif handoff API) → Task 2 ✓ ; pré-requis migration → Task 1 ✓
- Section 3 prompt (abandonnée), Section 4 (différée) → hors périmètre, conforme spec ✓

**Placeholder scan :** aucun TBD/TODO ; tout le code est fourni (tests, helper API, patch n8n, migration). ✓

**Type consistency :** contrat `preBooking {villaId,email,startDate,endDate,guests,firstName}` cohérent entre Task 3 (lecture + mapping `name:firstName`) et Task 4 (émission n8n) ; `shouldEscalateToHuman` cohérent entre Task 2 (API lit), Task 3 (front lit), Task 4 (n8n émet) ; `PreBookingCardData` défini en Task 3 Step 4 et utilisé Step 5-6. ✓

**Dépendances :** Task 2 dépend de Task 1 (contrainte). Task 3 et Task 4 indépendantes. Ordre conseillé : 1 → 2, puis 3 et 4 en parallèle.
