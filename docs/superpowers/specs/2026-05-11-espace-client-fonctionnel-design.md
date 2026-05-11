# Espace Client Super Fonctionnel — Design Spec

**Date** : 2026-05-11 | **Statut** : Validé

## Vision

L'espace client passe de consultatif à actionnable. Chaque action du voyageur crée une tâche ou notification côté admin Kayvila. L'admin répond, le voyageur voit le statut en temps réel. Inspiré d'Airbnb, adapté au contexte luxe Kayvila.

**Périmètre** : 3 phases. On commence par la Phase 1 (essentiel), les phases 2 et 3 sont documentées pour référence future.

---

## Architecture globale

```
ESPACE VOYAGEUR                          ESPACE ADMIN (Concierge Kayvila)
─────────────────                        ─────────────────────────────────
Pages existantes (8) ── enrichies       Dashboard → assistant + tâches
Nouvelles pages (2-4) ── créées         Notifications → temps réel
System Request ──────── interconnecté ── Workflows Approbation
Paiement (Stripe) ───── préparé         Gestion avis + parrainage
```

## Système de demandes (Request System) — socle commun

Toutes les interactions voyageur→admin passent par ce système :

```
[Voyageur] → Crée une demande → [Tâche admin]
   ↓                                ↓
[Statut: En attente]          [pending]
   ↓                                ↓
[Admin répond] ←────────────→ [in_progress]
   ↓                                ↓
[Statut: Résolu]              [resolved]
```

**Statuts** : `pending → in_progress → resolved` (ou `rejected`)

**Types de demandes** :
- `date_change` — Modification de dates
- `early_checkin` — Early check-in
- `late_checkout` — Late check-out
- `issue` — Signalement problème
- `service` — Service ponctuel (ménage, linge)
- `cancellation` — Demande d'annulation
- `other` — Autre

**Notification automatique** : email au voyageur à chaque changement de statut.

---

## Phase 1 — Essentiel (6 fonctionnalités)

### 1. Check-in autonome
**Emplacement** : Nouvelle section dans `espace-client/livret`

- Code digicode affiché 24h avant arrivée (condition : `start_date - now < 24h`)
- Photos étape par étape : entrée → digicode → chemin → porte (stockées dans `villa.checkin_images`)
- Plan Google Maps intégré avec itinéraire depuis l'aéroport
- Contact urgence en 1 clic (tel: lien)
- Statut dynamique : "Check-in dans X jours" → "Check-in aujourd'hui" → "Séjour en cours"

**Côté admin** : log automatique "voyageur a consulté le check-in le [date]"

**Composants** :
- `components/espace-client/CheckinGuide.tsx`
- Section dans `app/espace-client/livret/page.tsx`

### 2. Profil voyageur enrichi
**Emplacement** : `espace-client/profil` (existant, enrichi)

- Formulaire : nom complet, téléphone, date de naissance, nationalité
- Upload pièce d'identité (passeport/CNI) → stockage Supabase Storage
- Allergies & régimes alimentaires (checkboxes)
- Occasions spéciales (anniversaire, anniversaire de mariage) + date
- Heure d'arrivée estimée (select : 14h-22h)
- Demande lit bébé / chaise haute (oui/non)

**Table Supabase** : `profiles` (existant) → ajouter colonnes : `allergies`, `special_occasion`, `special_occasion_date`, `estimated_arrival`, `needs_baby_bed`, `needs_high_chair`, `id_document_url`

**Côté admin** : Vue fiche voyageur complète dans `admin/clients/[id]`

### 3. Règles de la maison & manuel villa
**Emplacement** : `espace-client/livret` (existant, enrichi)

- Règles claires : silence (22h-7h), piscine, climatisation, fumer, animaux
- WiFi : SSID + mot de passe
- Manuel équipements : jacuzzi, volets électriques, barbecue, TV
- Poubelles : jours de collecte, emplacement
- Photos d'illustration pour chaque équipement

**Côté admin** : Gestion des règles par villa dans `admin/villas/[id]` (champ JSON `house_manual`)

**Table Supabase** : `villas` → ajouter colonne `house_manual` (JSONB)

### 4. Check-out instructions
**Emplacement** : Nouvelle section dans `espace-client/livret`

- Affichée à J-1 (condition : `end_date - now < 24h`)
- Checklist : sortir poubelles, laver vaisselle, fermer volets, rassembler clés
- Photos pour éviter les ambiguïtés
- Rappel heure de check-out (10h)
- Bouton "Demander un late check-out" → crée une demande `late_checkout`

**Composant** : `components/espace-client/CheckoutInstructions.tsx`

### 5. Facture PDF
**Emplacement** : `espace-client/documents` (existant, enrichi)

- Génération PDF automatique après check-out (via `@react-pdf/renderer` ou API route)
- Logo Kayvila, détails : dates, villa, montant, services, commission
- Bouton "Télécharger la facture"
- Stockage Supabase Storage dans le bucket `invoices`

**Côté admin** : Historique des factures générées consultable

### 6. Système de demandes (Request System)
**Nouvelle page** : `espace-client/demandes`

- Interface unifiée : type de demande (select) → message (textarea) → envoyer
- Chaque demande crée un enregistrement dans la table `requests`
- Statut visible en temps réel avec code couleur
- Historique de toutes les demandes passées
- Badge dans la sidebar si demandes en cours

**Table Supabase** : `requests`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
booking_id UUID REFERENCES bookings(id)
guest_id UUID REFERENCES auth.users(id)
type VARCHAR(50) NOT NULL  -- date_change, early_checkin, late_checkout, issue, service, cancellation, other
status VARCHAR(20) DEFAULT 'pending'  -- pending, in_progress, resolved, rejected
message TEXT
admin_response TEXT
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

**Côté admin** : Vue `admin/assistant` enrichie avec :
- Liste des demandes par statut (filtres)
- Boutons Accepter/Refuser/Commenter
- Réponse admin enregistrée → notification voyageur

**Composants** :
- `components/espace-client/RequestForm.tsx`
- `components/espace-client/RequestList.tsx`
- Page : `app/espace-client/demandes/page.tsx`

---

## Phase 2 — Confort (5 fonctionnalités)

### 7. Partager le séjour
- Lien de partage généré avec token unique (valide jusqu'au check-out)
- Page publique `/share/[token]` : infos essentielles, pas de compte requis
- Infos affichées : adresse, WiFi, check-in, contacts urgence

### 8. Calendrier
- Bouton "Ajouter à mon calendrier" → export .ics
- Contient : dates, adresse, heures check-in/out, nom villa

### 9. Guide des alentours
- Liste de recommandations Kayvila (managed in admin)
- Filtres : restaurants, plages, activités, marchés
- Chaque lieu : nom, distance, note Kayvila, lien Maps

**Table Supabase** : `local_recommendations`

### 10. Services ponctuels
- Ménage supplémentaire, changement linge, remplissage gaz
- En 1 clic → prix affiché → demande créée → admin facture manuellement
- Stripe intégré plus tard

### 11. Politique d'annulation visible
- Affichage de la politique de la villa
- Simulateur : "Si vous annulez aujourd'hui, remboursement estimé : X €"
- Bouton "Demander une annulation" → tâche admin

---

## Phase 3 — Engagement & Fidélisation (5 fonctionnalités)

### 12. Notifications center
- Bell avec badge (header existant, à connecter)
- Notifs non lues → compteur, historique complet
- Préférences : email + push + SMS

**Table Supabase** : `notifications`

### 13. Avis post-séjour
- Formulaire note 1-5 + commentaire + photos
- Soumis → validation admin → publié sur fiche villa publique
- Modification possible 48h

**Table Supabase** : `reviews`

### 14. Re-réserver & villas similaires
- Page Séjour (post check-out) : bouton re-réserver
- Suggestions : 3 villas similaires

### 15. Parrainage
- Formulaire email ami → lien tracké
- Dashboard : nombre de filleuls, statuts

### 16. Favoris
- Bouton cœur sur fiches villa
- Page `espace-client/favoris`

---

## Récapitulatif

| | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| **Nouvelles pages** | 1 (demandes) + 2 sections livret | 1 (partage) + 1 section livret | 3 (avis, favoris, notifs) |
| **Pages enrichies** | 3 (livret, profil, documents) | 2 (conciergerie, séjour) | 1 (séjour) |
| **Tables Supabase** | 1 nouvelle (requests) + 2 enrichies | 1 nouvelle (recommendations) | 3 nouvelles (notifications, reviews, referrals) |
| **Côté admin** | Dashboard assistant + tâches | Tâches enrichies | Avis + parrainage |
| **Dépendances** | Aucune | Phase 1 (Request System) | Phase 1+2 |
