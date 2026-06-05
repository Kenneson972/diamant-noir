# Refonte Dashboard Admin — Design Spec

**Date :** 2026-05-11 | **Statut :** Validé

## Vision

Refonte complète du dashboard admin Kayvila pour connecter les 3 acteurs (client, concierge, propriétaire). Suppression des 3 re-exports du dashboard proprio, correction des incohérences et données orphelines, centralisation du code dupliqué.

**Admin = Concierge Kayvila** : gère le service, les clients, les demandes, valide les avis, supervise villas et réservations.

---

## 1. Architecture

3 espaces distincts avec `DashboardShell` unifié, pages natives sans re-exports.

```
ESPACE CLIENT          ADMIN (Concierge)       PROPRIÉTAIRE
─────────────          ─────────────────       ────────────
/espace-client/*       /admin/*                /dashboard/proprio/*
  DashboardShell         DashboardShell          DashboardShell
  role="tenant"          role="admin"            role="owner"
```

**Suppressions :**
- `/admin/hub-classique` → re-export proprio supprimé, page native créée
- `/admin/assistant` → re-export proprio supprimé (gardé pour IA copilot future)
- `/admin/submissions` → re-export proprio supprimé, fusionné dans admin natif

---

## 2. Menu Admin Refondu (10 entrées)

| # | Page | URL | Notes |
|---|------|-----|-------|
| 1 | Tableau de bord | `/admin` | KPIs réels, activité récente, alertes, villas les plus aimées |
| 2 | Hub Classique | `/admin/hub-classique` | Page native, grille villas, filtres, actions rapides |
| 3 | Réservations | `/admin/reservations` | Actionnable (confirmer, annuler), pagination |
| 4 | Clients | `/admin/clients` | Liste → clic → fiche client 360° |
| 5 | Demandes | `/admin/demandes` | Existant, OK — ajouter lien vers fiche client |
| 6 | Avis | `/admin/avis` | Existant — ajouter notif au client quand approuvé/refusé |
| 7 | Messagerie | `/admin/messagerie` | 🆕 Console admin pour répondre aux chats clients |
| 8 | Revenus | `/admin/revenus` | Graphiques dynamiques (plus de placeholder) |
| 9 | Paramètres | `/admin/parametres` | Éditable, inclut Sync OTA, saisons, conciergerie settings |
| — | Fiche client 360° | `/admin/clients/[id]` | 🆕 Tout voir sur un client |

**Parrainage désactivé partout** (pas voulu par le gérant).

---

## 3. Connexions Client ↔ Admin

Chaque action client a une contrepartie admin :

| Action client | Contrepartie admin |
|---------------|-------------------|
| Crée une demande | File d'attente demandes → Résoudre/Refuser + notif |
| Dépose un avis | File modération avis → Approuver/Refuser + notif au client |
| Envoie un message chat | Console messagerie → Répondre en temps réel |
| Remplit son profil | Fiche client 360° : préférences, allergies, occasion |
| Complète sa checklist | Suivi check-in : état des étapes |
| Annule une réservation | Réservations actionnables : confirmer, annuler, modifier |
| Ajoute des favoris | Dashboard : widget "Villas les plus aimées" |

---

## 4. Données Orphelines → Connectées

| Donnée (table.colonne) | Qui crée | Rendu visible dans |
|---|---|---|
| `profiles.*` (préférences) | Client | Fiche client 360° |
| `bookings.checklist_state` | Client | Réservation détail + fiche client |
| `wishlist` | Client | Dashboard (stats villas aimées) |
| `chat_messages` | Client | Console messagerie admin |
| ~~`referrals`~~ | ❌ DÉSACTIVÉ | ❌ Caché partout |

---

## 5. Fixes Transversaux

### 5.1 Code

| Fix | Détail |
|-----|--------|
| Hook `useActiveBooking` | Extraction depuis 6 pages → `hooks/useActiveBooking.ts` |
| Constantes centralisées | `TYPE_LABELS`, `STATUS_STYLES`, `TYPE_CONFIG` → `lib/constants.ts` |
| Utilitaires unifiés | `formatDate`, `timeAgo`, `generateICS` → `lib/utils.ts` |
| Types complets | `requests`, `reviews`, `wishlist`, `chat_messages`, `support_tickets` ajoutés à `types/supabase.ts` |
| Génération ICS unifiée | Supprimer la version dupliquée dans `checklist/page.tsx`, utiliser `lib/generate-ics.ts` |

### 5.2 Sécurité

| Table | Action |
|-------|--------|
| `requests` | **Ajouter RLS** : `guest_own` (SELECT/INSERT par guest_id), `admin_all` (via `profiles.role = 'admin'`) |
| `villa_submissions` | DROP `villa_submissions_auth`, garder policies fines de l'audit |

### 5.3 Conciergerie dynamique

Créer table `conciergerie_settings` :
```sql
create table public.conciergerie_settings (
  id smallint primary key default 1 check (id = 1),
  emergency_phone text,
  contact_phone text,
  contact_email text,
  opening_hours jsonb,
  services jsonb
);
```
Éditable dans `/admin/parametres`. Lu par `/espace-client/conciergerie`.

---

## 6. Fiche Client 360° (nouvelle page clé)

Route : `/admin/clients/[id]`

Sections / onglets :
1. **Infos** — nom, email, téléphone, rôle, date inscription, avatar
2. **Préférences séjour** — allergies, occasion spéciale, heure arrivée, équipement bébé
3. **Réservations** — liste des résas avec statut, lien vers détail
4. **Demandes** — toutes les demandes du client avec statut
5. **Avis** — avis laissés avec statut
6. **Checklists** — état pour chaque réservation active

---

## 7. Pages à modifier (récapitulatif)

| Page | Changement |
|------|-----------|
| `/admin` (dashboard) | KPIs réels, activité récente dynamique, widget villas aimées |
| `/admin/hub-classique` | Réécriture native |
| `/admin/reservations` | Actionnable + pagination |
| `/admin/clients` | OK, lien vers fiche 360° |
| `/admin/demandes` | Ajouter RLS, lien vers fiche client |
| `/admin/avis` | Ajouter notif client à l'approbation/rejet |
| `/admin/revenus` | Graphiques dynamiques (Recharts) |
| `/admin/parametres` | Éditable, conciergerie settings |
| 🆕 `/admin/messagerie` | Console chat |
| 🆕 `/admin/clients/[id]` | Fiche 360° |
| 🆕 `/espace-client/conciergerie` | Dynamique (lit `conciergerie_settings`) |

**Fichiers supprimés :**
- `app/(admin)/admin/hub-classique/page.tsx` (re-export)
- `app/(admin)/admin/assistant/page.tsx` (re-export)
- `app/(admin)/admin/submissions/page.tsx` (re-export)

---

## 8. Phase IA Copilot (future, hors scope)

Chatbot proactif + réactif unifié dans une interface "Assistant". Détecte les anomalies et propose des actions. Sera greffé plus tard.

---

## 9. Phases d'implémentation

### Phase A — Fondations (code propre)
- Hook `useActiveBooking`
- Constantes centralisées `lib/constants.ts`
- Utilitaires unifiés `lib/utils.ts`
- Types TypeScript complets
- RLS `requests` + `villa_submissions`
- Suppression des 3 re-exports
- Conciergerie dynamique (table + paramètres)

### Phase B — Pages admin améliorées
- Dashboard avec vrais KPIs + activité récente + villas aimées
- Hub Classique natif
- Réservations actionnables + pagination
- Revenus avec graphiques dynamiques
- Paramètres éditables
- Avis : ajout notif client

### Phase C — Nouvelles pages
- Console messagerie admin (`/admin/messagerie`)
- Fiche client 360° (`/admin/clients/[id]`)

---

## 10. Vérification

1. Build `npm run build` sans erreurs
2. RLS `requests` activée et testée
3. Plus aucun `@ts-ignore` lié aux types manquants
4. Plus de constantes dupliquées (vérification par grep)
5. Hook `useActiveBooking` utilisé dans les 6 pages
6. Conciergerie éditable depuis admin paramètres
7. Console messagerie admin fonctionnelle
