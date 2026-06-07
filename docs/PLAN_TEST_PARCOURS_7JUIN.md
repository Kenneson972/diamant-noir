# Plan de Test — Parcours Complet Kayvila
## 7 Juin 2026 · J-8 avant livraison

---

## 🔵 VISITEUR (non connecté)

### 1. Landing Page
- [ ] Hero chargé (vidéo ou fallback)
- [ ] Navigation : villas, prestations, tarifs, contact
- [ ] Responsive mobile : burger menu, touch targets ≥ 44px
- [ ] Liens footer : mentions légales, cookies, confidentialité, FAQ

### 2. Recherche & Liste Villas (`/villas`)
- [ ] Liste des villas avec photos
- [ ] Filtres : capacité, prix, équipements
- [ ] Tri par prix/nom
- [ ] Carte Leaflet interactive
- [ ] Responsive : grille adaptée mobile

### 3. Fiche Villa (`/villas/[id]`)
- [ ] Galerie photos
- [ ] Infos : capacité, chambres, sdb, équipements
- [ ] Prestations affichées
- [ ] Calendrier des disponibilités
- [ ] Bouton "Réserver" visible
- [ ] SEO : titre, meta description, OG image

### 4. Réservation (`/book`)
- [ ] Formulaire : dates, voyageurs
- [ ] Prix calculé (saisonnier si applicable)
- [ ] Détail : séjour + ménage + service
- [ ] CSRF token présent
- [ ] Validation dates (min_nights, chevauchement)
- [ ] Bouton "Payer" → redirection Stripe Checkout

### 5. Paiement Stripe
- [ ] Page Stripe Checkout chargée
- [ ] Montant correct (séjour + frais)
- [ ] Paiement test réussi (carte `4242 4242 4242 4242`)
- [ ] Redirection vers `/success`
- [ ] Page succès : récap réservation

### 6. Pages Statiques
- [ ] `/prestations` — formules et services
- [ ] `/tarifs` — grille tarifaire
- [ ] `/contact` — formulaire
- [ ] `/qui-sommes-nous`
- [ ] `/faq`
- [ ] `/experience`
- [ ] `/soumettre-ma-villa` — formulaire soumission

---

## 🟢 CLIENT (connecté, espace client)

### 7. Connexion / Inscription
- [ ] `/login` — formulaire login
- [ ] `/register` — inscription
- [ ] `/auth/callback` — callback OAuth
- [ ] `/update-password` — reset mot de passe
- [ ] Redirection après login vers `/espace-client`

### 8. Espace Client (`/espace-client`)
- [ ] Dashboard : résas à venir, messages
- [ ] `/espace-client/reservations/[id]` — détail résa
- [ ] `/espace-client/messagerie` — chat avec conciergerie
- [ ] `/espace-client/profil` — édition profil
- [ ] `/espace-client/favoris` — wishlist
- [ ] `/espace-client/demandes` — demandes spéciales
- [ ] `/espace-client/documents` — documents séjour
- [ ] `/espace-client/livret` — livret d'accueil
- [ ] `/espace-client/livret/print` — version imprimable
- [ ] `/espace-client/checklist` — checklist séjour
- [ ] `/espace-client/conciergerie` — services conciergerie
- [ ] `/espace-client/notifications`
- [ ] `/espace-client/parrainage`

---

## 🟡 PROPRIÉTAIRE (dashboard proprio)

### 9. Dashboard Proprio (`/proprio`)
- [ ] `/proprio/dashboard` — KPIs
- [ ] `/proprio/dashboard/villas` — liste villas
- [ ] `/proprio/dashboard/villas/[villaId]` — détail villa
- [ ] `/proprio/dashboard/villas/[villaId]/photos` — gestion photos
- [ ] `/proprio/dashboard/reservations` — liste résas
- [ ] `/proprio/dashboard/reservations/[villaId]/[bookingId]` — détail résa
- [ ] `/proprio/dashboard/revenus` — ventilation + PDF relevé
- [ ] `/proprio/dashboard/statistiques` — stats occupation
- [ ] `/proprio/dashboard/taches` — tâches
- [ ] `/proprio/dashboard/taches/[taskId]` — détail tâche
- [ ] `/proprio/dashboard/messages` — messagerie proprio

### 10. Stripe Connect Proprio
- [ ] Onboarding Stripe Connect (`/api/stripe/connect-onboarding`)
- [ ] Vérification statut (`/api/stripe/connect-verify`)
- [ ] Blocage si pas onboardé (le checkout passe mais sans split)

---

## 🔴 ADMIN (`/admin`)

### 11. Dashboard Admin
- [ ] `/admin` — KPIs globaux
- [ ] `/admin/villas` — CRUD villas
- [ ] `/admin/villas/ajouter` — création villa
- [ ] `/admin/villas/[id]` — édition villa
- [ ] `/admin/reservations` — liste + création manuelle
- [ ] `/admin/reservations/[bookingId]` — détail résa
- [ ] `/admin/clients` — recherche clients
- [ ] `/admin/clients/[id]` — fiche client
- [ ] `/admin/proprietaires` — liste proprios
- [ ] `/admin/proprietaires/[id]` — fiche proprio
- [ ] `/admin/revenus` — ventilation + OTA/direct
- [ ] `/admin/demandes` — gestion demandes
- [ ] `/admin/avis` — modération avis
- [ ] `/admin/messagerie` — chat admin
- [ ] `/admin/tarification` — tarifs saisonniers
- [ ] `/admin/sync-ota` — statut synchro OTA
- [ ] `/admin/parametres` — configuration
- [ ] `/admin/membres/[id]` — gestion équipe
- [ ] `/admin/hub-classique` — interface legacy

### 12. Admin Stripe
- [ ] Remboursement (`POST /api/stripe/admin-refund`)
- [ ] Vérif statut PaymentIntent avant refund
- [ ] Remboursement bloqué si pas `succeeded`

---

## 📧 EMAILS (Resend)

### 13. Emails Transactionnels
- [ ] Confirmation réservation → locataire
- [ ] Nouvelle résa → proprio
- [ ] Rappel check-in J-3
- [ ] Demande d'avis J+3
- [ ] Alerte litige → admin
- [ ] Connect onboardé → proprio

---

## 🔒 SÉCURITÉ

### 14. Points critiques
- [ ] CSRF sur `POST /api/booking`
- [ ] Rate limiting
- [ ] RLS Supabase (admin ≠ proprio ≠ client)
- [ ] JWT : `user_metadata.role` pas `auth.jwt().role`
- [ ] Webhook Stripe : signature vérifiée
- [ ] Webhook Stripe : rollback `stripe_events_processed` sur erreur

---

**Check final livraison :** Tous les checkboxes cochés → Kayvila prêt pour Richard.
