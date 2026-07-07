# Facturation — Reçus locataire & relevés propriétaire (par réservation)

Date : 2026-07-07
Statut : validé, prêt pour plan d'implémentation

## Contexte

Aucun système de facturation n'existait avant cette feature :
- Le bloc "Factures" de `app/espace-client/documents/page.tsx` est un placeholder (`printInvoice()`) qui ouvre une fenêtre et appelle `window.print()` sur du HTML codé en dur — **sans aucun montant affiché**.
- Deux routes ad-hoc génèrent déjà un PDF de relevé mensuel propriétaire à la volée (`app/api/proprio/releve/route.ts` et `app/api/proprio/revenus/export-pdf/route.ts`, quasi doublons), sans numérotation ni persistance.

Les CGV Propriétaires (`lib/legal.ts`, art. 4.2/4.6) imposent, pour les réservations **OTA** (Airbnb/Booking, où le propriétaire encaisse directement), une **facture mensuelle récapitulative** de la commission due par le propriétaire à Kayvila, avec un minimum de facturation de 50 €/mois lorsque la commission due sur le mois est inférieure à cette somme (notamment en l'absence de réservation). **Cette facture OTA mensuelle est explicitement hors périmètre de la présente feature** — elle sera traitée séparément plus tard.

Pour les réservations **directes** (Stripe Connect), l'art. 4.3 des CGV précise que la répartition (commission Kayvila / net propriétaire) est automatique à la source et qu'aucun reversement mensuel n'est nécessaire — un document informatif par réservation suffit.

## Périmètre

Deux documents, tous deux en PDF, persistés et numérotés :

| Type | Public | Déclencheur | Granularité | Valeur | Portée |
|---|---|---|---|---|---|
| **Relevé propriétaire** (`owner_statement`) | Propriétaire | Webhook Stripe `checkout.session.completed` | 1 par réservation | Informatif — la répartition est déjà effectuée par Stripe Connect | Réservations directes/Stripe uniquement (les réservations OTA n'ont pas de paiement Stripe checkout sur la plateforme — elles arrivent par import iCal/sync, hors scope naturellement) |
| **Reçu locataire** (`tenant_receipt`) | Locataire | Webhook Stripe `checkout.session.completed` | 1 par réservation | Reçu de paiement — ne remplace pas une facture avec TVA déductible | Toutes réservations payées via le checkout Kayvila |

Hors périmètre : facture de commission OTA mensuelle (Type A, cf. CGV art. 4.2/4.6) — à traiter dans une feature séparée ultérieure.

## Modèle de données

Nouvelle table `booking_documents` (migration Supabase) :

```sql
create table booking_documents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  document_type text not null check (document_type in ('owner_statement', 'tenant_receipt')),
  document_number text not null unique,
  recipient_id uuid references profiles(id),
  pdf_storage_path text not null,
  amount_cents integer not null,
  generated_at timestamptz not null default now(),
  emailed_at timestamptz
);
```

- **Numérotation** : deux séquences Postgres dédiées (`owner_statement_seq`, `tenant_receipt_seq`), format `KAY-RELV-2026-000045` / `KAY-RECU-2026-000112` — atomique via `nextval()`, aucun risque de doublon en cas d'appels concurrents du webhook. Remise à zéro implicite chaque année via le préfixe (l'année fait partie du numéro, le compteur continue de progresser — pas de reset physique de séquence nécessaire tant que le format inclut l'année).
- **Stockage** : bucket Supabase Storage privé dédié `booking-documents`. RLS : le propriétaire lit ses `owner_statement`, le locataire lit ses `tenant_receipt`, l'admin lit tout — même pattern que le bucket `owner-documents` existant (`supabase/migrations/20260617_documents.sql`).
- **Immutabilité** : aucune mise à jour ni suppression après génération (valeur de justificatif).

## Génération PDF

- Réutilisation de `@react-pdf/renderer` (déjà une dépendance, déjà utilisé dans `components/dashboard/proprio/RelevePDF.tsx`) :
  - `components/pdf/OwnerStatementPDF.tsx`
  - `components/pdf/TenantReceiptPDF.tsx`
- **Calculs** : réutilisation stricte de `lib/revenue/booking-revenue.ts` (`ownerNetCents`, `grossCentsFromBooking`, `getCommissionRate`) — aucune duplication de logique métier.
- **Générateur central** : `lib/invoicing/generate-booking-document.ts` — signature `generateBookingDocument(bookingId, type)` : calcule les montants, rend le PDF via react-pdf, uploade dans le bucket, insère la ligne `booking_documents`, retourne `{ buffer, storagePath, documentNumber }`.

### Contenu du reçu locataire (`TenantReceiptPDF`)

Style repris de `RelevePDF.tsx` (Helvetica, bandeau or `#D4AF37`, navy `#0a1929`) :
- En-tête : Kayvila Conciergerie, SARLU, SIRET 106 394 489 00012, TVA FR32106394489, Quartier Palmène 97270 Saint-Esprit (source unique : `lib/legal.ts`)
- Numéro de reçu, date d'émission
- Voyageur (nom, email), villa, dates de séjour, nombre de nuits
- Détail : montant nuitées / frais de ménage / frais de service / total payé
- Mention : « Reçu de paiement — ne constitue pas une facture avec TVA déductible. Le contrat de location se forme directement entre le Voyageur et le Propriétaire, Kayvila agissant en qualité d'intermédiaire technique (cf. CGV Voyageurs). »
- Footer : contact@kayvila.com — document généré automatiquement

### Contenu du relevé propriétaire (`OwnerStatementPDF`)

- Même en-tête Kayvila
- Numéro de relevé, propriétaire (nom, email), villa, réservation (dates, voyageur)
- Détail : brut encaissé / commission Kayvila (taux appliqué selon la source) / frais ménage-service (100 % Kayvila) / net reversé au propriétaire
- Mention : « Document informatif — répartition déjà effectuée automatiquement via Stripe Connect lors du paiement. »
- Footer identique

## Déclenchement & intégration email

Dans `app/api/webhooks/stripe/route.ts`, sur `checkout.session.completed`, après la mise à jour du booking et dans les mêmes blocs try/catch non-bloquants que le reste du webhook :
- Génère le **reçu locataire** → pièce jointe ajoutée à l'email `booking-confirmation.tsx` (déjà envoyé via `/api/send-booking-confirmation`)
- Génère le **relevé propriétaire** → pièce jointe ajoutée à l'email `owner-new-booking.tsx` (déjà envoyé dans ce même webhook)

Pas de nouveaux emails créés. Un échec de génération PDF ne bloque jamais la confirmation de réservation ni l'envoi des emails existants (log + continue).

## Accès dans les dashboards

- **Espace client** (`app/espace-client/documents/page.tsx`) : le bloc *Factures* existant est conservé visuellement, mais `printInvoice()` (fenêtre + `window.print()` sur du HTML sans montant) est remplacé par un vrai lien de téléchargement vers le PDF stocké via `GET /api/documents/[id]/download` (vérification RLS : le locataire ne peut télécharger que ses propres reçus).
- **Dashboard proprio** (`app/(proprio)/dashboard/revenus/page.tsx`) : ajout d'une liste des relevés générés (par réservation, avec lien de téléchargement), remplaçant les 2 anciennes routes d'export PDF ad-hoc qui sont supprimées (`app/api/proprio/releve/route.ts`, `app/api/proprio/revenus/export-pdf/route.ts`, et `components/dashboard/proprio/RelevePDF.tsx`).

## Tests

- Unit : `lib/invoicing/generate-booking-document.ts` — calcul des montants (via `booking-revenue.ts`), numérotation séquentielle unique, pas de doublon sous appels concurrents
- Unit : composants PDF — rendu sans erreur, présence des champs clés (numéro, montants, mentions légales)
- Intégration webhook : `checkout.session.completed` déclenche la génération des deux documents + l'attachement email, sans bloquer la confirmation si la génération échoue
- E2E Playwright : téléchargement du reçu depuis `espace-client/documents`, téléchargement du relevé depuis `dashboard/revenus`

## Hors périmètre (rappel)

- Facture de commission OTA mensuelle (Type A) — CGV art. 4.2/4.6, minimum 50 €/mois si commission due < 50 € sur le mois (notamment absence de réservation). À concevoir séparément.
