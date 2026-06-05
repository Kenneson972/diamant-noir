# Mega-Prompt Cursor — Corrections critiques Conciergerie Kayvila

**Date** : 2026-06-06
**Projet** : Kayvila Diamant Noir
**Contexte** : Double audit (état des lieux complet + flow conciergerie). Score scaling actuel : 2/10. Ces corrections sont les vrais problèmes, pas des fantasmes Airbnb.

---

## ⚠️ RÈGLE MÉTIER — Kayvila est une conciergerie, PAS une marketplace

- Pas de contact direct proprio ↔ voyageur
- Le voyageur parle à Kayvila, Kayvila parle au proprio
- Le client ne doit JAMAIS voir le nom/l'avatar/l'email du propriétaire
- L'hôte affiché = "Kayvila Conciergerie"
- Design Kayvila (Playfair, gold/navy) intouchable

---

## 🔴 BUG P0 — Page livret 404

**Problème** : La page la plus importante pour le client (WiFi, check-in, contacts urgence) est linkée partout mais n'existe pas.

### Fichier à vérifier/créer : `app/espace-client/livret/page.tsx`

Vérifier que `app/espace-client/livret/` existe bien. Si le dossier existe mais la page est vide, la remplir avec le composant existant. Le livret est crucial — liens depuis : menu TenantMenuItems, checklist, dashboard, documents.

```bash
# Commande de vérification
ls -la app/espace-client/livret/
```

Si absent, le restaurer depuis le git log :
```bash
git log --all --oneline -- app/espace-client/livret/ | head -5
git checkout <commit> -- app/espace-client/livret/page.tsx
```

---

## 🔴 BUG P0 — VillaHostCard : remplacer le proprio par Kayvila

**Problème** : Le `VillaHostCard` expose le propriétaire (full_name, avatar_url, email, role) au client. C'est un pattern Airbnb, pas conciergerie.

### Fichier : `components/villas/VillaHostCard.tsx`

**Remplacer TOUT le contenu par** :

```tsx
"use client";

import { ShieldCheck, Phone, Mail } from "lucide-react";

export function VillaHostCard() {
  return (
    <section className="py-12 border-t border-navy-800">
      <h2 className="font-playfair text-2xl text-navy mb-6">Votre concierge</h2>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-navy" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-sora text-lg text-navy">Kayvila Conciergerie</span>
            <span className="inline-flex items-center gap-1 text-xs text-navy bg-gold/10 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Concierge vérifié
            </span>
          </div>
          <p className="text-sm text-navy-800 mt-1">
            Équipe locale basée au Diamant, disponible 24/7 pour votre séjour.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <a href="tel:+596XXX" className="flex items-center gap-1 text-sm text-navy hover:text-gold">
              <Phone className="w-3 h-3" />
              Appeler
            </a>
            <a href="mailto:conciergerie@kayvila.com" className="flex items-center gap-1 text-sm text-navy hover:text-gold">
              <Mail className="w-3 h-3" />
              Écrire
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### Fichier : `app/villas/[id]/page.tsx`

- Retirer la query join vers `owner:owner_id(...)` (on n'a plus besoin des infos proprio)
- Retirer `host` du type `VillaDetails`
- Le `VillaHostCard` ne prend plus de props → `<VillaHostCard />`

---

## 🔴 BUG P0 — Messagerie admin : remplacer les UUIDs par des vrais noms

**Problème** : La sidebar de messagerie admin affiche des `session_id` bruts au lieu du nom du client. L'admin ne sait pas qui parle.

### Fichier : `app/(admin)/admin/messagerie/page.tsx`

**Spécification** :
- Pour chaque session de chat, joindre la table `chat_sessions` avec `bookings` et `profiles`
- Afficher : nom du client, nom de la villa, date du séjour, dernier message
- Ajouter un champ recherche par nom/email
- Badge "Non lu" avec compteur

```typescript
// Dans la query des sessions :
.select("id, guest_name, guest_email, villa:bookings(villas(name)), start_date, end_date, last_message_at, unread_count")
```

---

## 🔴 BUG P0 — Notifications : zéro notif pour les événements critiques

**Problème** : Seulement 2 événements génèrent des notifications. Une demande client ne notifie pas l'admin. Une réponse admin ne notifie pas le client.

### Fichiers à créer/modifier

**1. `lib/notifications/triggers.ts`** — Module central de déclenchement :

```typescript
export async function notifyRequestCreated(requestId: string) {
  // Notifier tous les admins
  const admins = await supabase.from("profiles").select("id").eq("role", "admin");
  for (const admin of admins.data ?? []) {
    await createNotification({
      userId: admin.id,
      type: "new_request",
      title: "Nouvelle demande",
      message: `Un voyageur a fait une demande`,
      actionUrl: `/admin/demandes?requestId=${requestId}`,
    });
  }
}

export async function notifyRequestResolved(requestId: string, guestId: string) {
  await createNotification({
    userId: guestId,
    type: "request_resolved",
    title: "Demande traitée",
    message: "L'équipe Kayvila a répondu à votre demande",
    actionUrl: `/espace-client/demandes`,
  });
}

export async function notifyNewMessage(sessionId: string, sender: "admin" | "guest") {
  // Notifier l'autre partie qu'un nouveau message est arrivé
}
```

**2. Modifier les endpoints existants** pour déclencher les notifications :
- `app/api/contact/route.ts` → après création demande : `notifyRequestCreated()`
- `app/(admin)/admin/demandes/page.tsx` → après réponse : `notifyRequestResolved()`
- `app/api/chat/` → après message : `notifyNewMessage()`

---

## 🔴 BUG P0 — Automatisation des tâches

**Problème** : Une réservation confirmée ne crée aucune tâche. L'équipe doit tout faire manuellement.

### Nouveau fichier : `lib/tasks/auto-create.ts`

```typescript
export async function createTasksForBooking(bookingId: string) {
  const booking = await getBooking(bookingId);
  const tasks = [
    {
      title: `Préparer check-in — ${booking.villa_name}`,
      dueDate: dayjs(booking.start_date).subtract(1, "day").toISOString(),
      priority: "high",
      assignable: true,
    },
    {
      title: `Accueil physique — ${booking.villa_name}`,
      dueDate: booking.start_date,
      priority: "high",
    },
    {
      title: `Ménage départ — ${booking.villa_name}`,
      dueDate: booking.end_date,
      priority: "medium",
    },
    {
      title: `Vérifier état villa — ${booking.villa_name}`,
      dueDate: booking.end_date,
      priority: "medium",
    },
  ];

  for (const task of tasks) {
    await supabase.from("tasks").insert({
      ...task,
      villa_id: booking.villa_id,
      booking_id: bookingId,
      status: "pending",
    });
  }
}
```

### Fichier à modifier : `app/api/webhooks/stripe/route.ts`

Après `checkout.session.completed` → appeler `createTasksForBooking(bookingId)`.

### Fichier à modifier : `app/api/booking/route.ts`

Après création booking (même sans Stripe) → appeler `createTasksForBooking(booking.id)`.

---

## 🟠 BUG P1 — Conciergerie : remplacer les données en dur par la DB

**Problème** : Téléphone, email, services codés en dur dans la page conciergerie.

### Fichier : `app/espace-client/conciergerie/page.tsx`

```typescript
// Charger depuis la DB :
const { data: settings } = await supabase
  .from("conciergerie_settings")
  .select("*")
  .single();

// Remplacer :
// - Téléphone codé en dur → {settings?.phone_24h}
// - Email codé en dur → {settings?.email}
// - Services codés en dur → {settings?.services} (JSONB)
```

La table `conciergerie_settings` existe déjà (migration `20260511_conciergerie_settings.sql`).

---

## 🟠 BUG P1 — Upload de fichiers dans la messagerie

**Problème** : Le client ne peut pas envoyer de photo d'un problème. En conciergerie luxe, c'est rédhibitoire.

### Fichier à créer : `app/api/chat/upload/route.ts`

```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const sessionId = formData.get("sessionId") as string;

  // Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .upload(`${sessionId}/${file.name}`, file);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Créer le message avec l'URL du fichier
  const publicUrl = supabase.storage.from("chat-attachments").getPublicUrl(data.path);

  await supabase.from("chat_messages").insert({
    session_id: sessionId,
    sender: "guest",
    content: `[Image] ${file.name}`,
    attachment_url: publicUrl,
  });

  return NextResponse.json({ url: publicUrl });
}
```

### Composant : Ajouter un bouton 📎 dans la messagerie client ET admin.

---

## 🟡 BUG P2 — Supprimer le comparateur de villas

**Problème** : Pattern OTA/Booking, inutile pour une conciergerie de luxe.

### Fichiers à supprimer :
- `app/villas/comparer/page.tsx` (ou redirect vers `/villas`)

### Fichiers à modifier :
- Retirer `CompareBar`, `CompareButton`, `CompareProvider` des layouts

---

## 🟡 BUG P2 — Paramètres saisons éditables

**Problème** : Message "Pour modifier, utiliser SQL Supabase" dans paramètres.

### Fichier : `app/(admin)/admin/parametres/page.tsx`

Remplacer le message par un formulaire d'édition des saisons :
- Charger `seasonal_rates` depuis la DB
- Afficher un tableau éditable (date début, date fin, label, prix)
- Bouton "Ajouter une saison"
- Sauvegarde via `supabase.from("seasonal_rates").upsert(...)`

---

## Checklist — Ordre d'exécution

- [ ] **P0-1** : Page livret restaurée (vérifier si le dossier existe, sinon git checkout)
- [ ] **P0-2** : VillaHostCard → Kayvila Conciergerie (pas de proprio)
- [ ] **P0-3** : Messagerie admin : noms clients au lieu d'UUIDs
- [ ] **P0-4** : Notifications : triggers pour demandes, réponses, messages
- [ ] **P0-5** : Tâches auto : création automatique après réservation
- [ ] **P1-6** : Conciergerie : charger depuis `conciergerie_settings`
- [ ] **P1-7** : Upload fichiers dans messagerie
- [ ] **P2-8** : Supprimer comparateur de villas
- [ ] **P2-9** : Saisons éditables dans paramètres
- [ ] `npm run build` passe
- [ ] `grep -rn "owner_id\|owner:owner_id\|VillaHost" app/villas/` → vérifier qu'aucune info proprio ne leak
- [ ] Playfair Display intacte
