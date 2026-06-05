# Mega-Prompt Cursor — Corrections critiques Conciergerie + Admin Kayvila

**Date** : 2026-06-06
**Projet** : Kayvila Diamant Noir
**Contexte** : Double audit (flow conciergerie + synchronisation Supabase admin). Les bugs sont réels, vérifiés dans le code et les migrations.

---

## ⚠️ RÈGLE MÉTIER — Kayvila est une conciergerie, PAS une marketplace

- Pas de contact direct proprio ↔ voyageur
- Le voyageur parle à Kayvila, Kayvila parle au proprio
- Design Kayvila (Playfair, gold/navy) intouchable
- VillaHostCard avec infos proprio = CONSERVÉ (décision Ken)

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

## 🔴 BUG P0 — Table `reviews` cassée : colonnes `status`, `photos`, `guest_id`, `updated_at` supprimées

**Problème** : La migration `20260522_create_reviews.sql` a fait `DROP TABLE reviews CASCADE` puis recréé une table SANS les colonnes `status`, `photos`, `guest_id`, `updated_at`. Résultat : la page Avis et le dashboard sont cassés.

### Fichier : `supabase/migrations/20260522_create_reviews.sql`

**Action** : Ajouter les colonnes manquantes :

```sql
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS photos TEXT[];
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES auth.users(id);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

### Fichiers impactés à vérifier après migration :

| Fichier | Ligne | Problème résolu |
|---------|-------|-----------------|
| `app/(admin)/admin/avis/page.tsx` | 20 | `.select("..., photos, status, guest_id")` fonctionnera |
| `app/(admin)/admin/avis/page.tsx` | 22 | `.eq("status", filter)` fonctionnera |
| `app/(admin)/admin/avis/page.tsx` | 35 | `.update({ status, updated_at })` fonctionnera |
| `app/(admin)/admin/avis/page.tsx` | 43 | `review.guest_id` ne sera plus undefined |
| `app/(admin)/admin/page.tsx` | 48 | `pendingReviews` compteur fonctionnera |
| `app/(admin)/admin/page.tsx` | 52 | Note moyenne fonctionnera |

---

## 🔴 BUG P0 — Page détail réservation ABSENTE (404)

**Problème** : `AdminReservationsDataGrid.tsx` ligne 143 fait un lien vers `/admin/reservations/${item.id}` mais le fichier `app/(admin)/admin/reservations/[bookingId]/page.tsx` n'existe pas.

### Fichier à créer : `app/(admin)/admin/reservations/[bookingId]/page.tsx`

```tsx
import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { BookingDetailCard } from "@/components/dashboard/admin/BookingDetailCard";

export default async function AdminBookingDetailPage({ params }: { params: { bookingId: string } }) {
  const { data: booking } = await supabaseAdmin()
    .from("bookings")
    .select("*, villas(name, location), profiles:guest_email(email)")
    .eq("id", params.bookingId)
    .single();

  if (!booking) return notFound();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <BookingDetailCard booking={booking} />
    </div>
  );
}
```

---

## 🟡 BUG P1 — Réservations vides : vérifier RLS `staff_admin_bookings_select`

**Problème** : La page réservations utilise `getSupabaseBrowser()` (anon key + JWT). Si la migration `20260606140000_audit_dashboard_fixes.sql` n'est pas appliquée ou si `profiles.role` n'est pas `'admin'`, les réservations sont vides.

### À vérifier dans Supabase Dashboard :

1. **La migration est-elle appliquée ?**
   ```sql
   SELECT * FROM pg_policies WHERE policyname = 'staff_admin_bookings_select';
   ```
   Si pas de résultat → appliquer la migration `20260606140000_audit_dashboard_fixes.sql`.

2. **Le profil admin a-t-il `role = 'admin'` ?**
   ```sql
   SELECT id, email, role FROM profiles WHERE email = 'ton-email-admin@kayvila.com';
   ```
   Si `role` n'est pas `'admin'` → `UPDATE profiles SET role = 'admin' WHERE email = '...'`.

### Alternative immédiate (quick fix) :
Remplacer `getSupabaseBrowser()` par `supabaseAdmin()` dans `app/(admin)/admin/reservations/page.tsx` pour bypasser RLS en attendant.

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
- [ ] **P0-2** : Migration `reviews` — colonnes `status`, `photos`, `guest_id`, `updated_at` + RLS admin
- [ ] **P0-3** : Page détail résa `/admin/reservations/[bookingId]` (vérifier si déjà présente)
- [ ] **P0-4** : RLS admin bookings — migration `20260606140000_audit_dashboard_fixes.sql` appliquée
- [ ] **P0-5** : Messagerie admin : noms clients au lieu d'UUIDs
- [ ] **P0-6** : Notifications : triggers pour demandes, réponses, messages
- [ ] **P0-7** : Tâches auto : création automatique après réservation
- [ ] **P1-8** : Conciergerie : charger depuis `conciergerie_settings`
- [ ] **P1-9** : Upload fichiers dans messagerie
- [ ] **P2-10** : Supprimer comparateur de villas
- [ ] **P2-11** : Saisons éditables dans paramètres
- [ ] VillaHostCard **conservé** (décision Ken — pas de masquage proprio)
- [ ] `npm run build` passe
- [ ] Playfair Display intacte
