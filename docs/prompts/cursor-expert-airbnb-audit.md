# Mega-Prompt Cursor — Expert Airbnb/Booking/Luxe : Audit Tenant & Proprio Kayvila

**Date** : 2026-06-06
**Projet** : Kayvila Diamant Noir
**Rôle** : Tu es un ancien Product Manager d'Airbnb Luxe et Booking.com. Tu as 10 ans d'expérience en plateformes de location premium.
**Mission** : Auditer Kayvila comme si tu évaluais son rachat par Airbnb.

---

## Sources utilisées (déjà analysées par nos sous-agents)

### Airbnb (2026 Summer Release)
- Superhost : 10+ séjours, 4.8★, <1% annulation, 90% réponse
- Avis double aveugle : notation après check-out, 6 critères, recherche par mot-clé
- Smart Pricing : ajustement automatique selon demande, saison, événements locaux
- AirCover : $3M dégâts, $1M RC, ligne 24/7
- Verified ID : pièce d'identité obligatoire
- Co-Host Network : gestion déléguée
- AI Review Highlights : résumé IA des avis
- Shared Itinerary : itinéraire partagé avec co-voyageurs
- Support IA 11 langues

### Booking.com
- Genius Program : 3 niveaux de fidélité, réductions croissantes
- Messagerie intégrée : chat anonymisé, templates, traduction auto, Pulse App
- Avis vérifiés : seuls les séjournants notent, 6 critères, réponse publique, photos
- Payments by Booking : VCC, virement, BNPL, 20+ méthodes
- Opportunity Center : suggestions proactives d'amélioration revenus
- Extranet partenaire complet

### Plateformes Luxe (Plum Guide, Le Collectionist, Airbnb Luxe)
- Curation stricte : 150 critères (Plum Guide), <3% acceptation
- Concierge humain dédié 24/7
- Inspection physique des villas
- Carnet de voyage numérique personnalisé
- Services premium : chef privé, transfert aéroport, livraison courses

---

## Phase 1 — Audit Espace Propriétaire

✅ Ce que Kayvila fait déjà :
- Dashboard revenus nets après commission 25%
- Calendrier des réservations
- Éditeur de villa avec photos (DropZone HeroUI)
- Import annonce OTA magique via LLM
- Statistiques par villa (occupation, revenus)

🔴 Ce qui MANQUE (ordre de priorité) :

### 1. Vérification d'identité propriétaire
**Pourquoi** : Airbnb, Booking, TOUS le font. Sans ça, zéro confiance.
**Spécification** :
- Upload pièce d'identité (CNI, passeport)
- Selfie vérification (liveness check)
- Badge "Propriétaire vérifié" sur les fiches villa
- API : `POST /api/identity/verify` → statut `pending → verified → rejected`
- Table : `identity_verifications(id, user_id, document_url, selfie_url, status, reviewed_by, reviewed_at)`

### 2. Smart Pricing (tarification dynamique)
**Pourquoi** : Le plus gros manque. Un proprio qui fixe son prix manuellement perd de l'argent.
**Spécification** :
- Algorithme simple : prix de base × coefficient saison × coefficient demande × coefficient événements
- UI : slider "Prix minimum / Prix recommandé / Prix maximum"
- Suggestions automatiques basées sur : saison, vacances scolaires, événements locaux, taux d'occupation, prix concurrents
- Table : `smart_pricing(villa_id, base_price, min_price, max_price, seasonal_multipliers, event_multipliers)`
- Option : "Activer le Smart Pricing" toggle dans l'éditeur villa

### 3. Programme de qualité propriétaire (Superhost Kayvila)
**Pourquoi** : Airbnb prouve que la gamification marche. Les Superhosts gagnent +20%.
**Spécification** :
- Badge "Collection" (déjà existant ?) → étendre en 3 niveaux :
  - **Silver** : 5+ séjours, 4.5★, <5% annulation
  - **Gold** : 15+ séjours, 4.7★, <3% annulation, 90% réponse <24h
  - **Platinum** : 30+ séjours, 4.9★, <1% annulation, 95% réponse <4h
- Avantages : commission réduite (22% au lieu de 25%), mise en avant prioritaire, support prioritaire
- Dashboard : "Progression Superhost" avec barres de progression

### 4. Assurance/garantie dommages
**Pourquoi** : Toutes les plateformes premium l'ont. Sans ça, les proprios hésitent.
**Spécification** :
- Partenariat avec assurance (ex: Assurly, Cover Genius)
- Intégré au flux de réservation : "Protection Kayvila incluse"
- Couverture : dégâts jusqu'à 50 000€, RC incluse
- Gestion sinistre : formulaire → photos → expertise → indemnisation
- Page : `/dashboard/assurance` avec historique des sinistres

### 5. Messagerie avancée proprio
**Pourquoi** : Le chatbot actuel est basique. Booking a Pulse App.
**Spécification** :
- Chat en temps réel (Supabase Realtime)
- Templates de messages rapides ("Code WiFi : [auto]", "Check-in : [date]")
- Traduction automatique (DeepL API)
- Historique par voyageur, pas juste une liste plate
- Notifications : badge non lu, email si inactif >4h

### 6. Co-Host / gestion déléguée
**Pourquoi** : Airbnb Co-Host Network. Les proprios absents veulent déléguer.
**Spécification** :
- Inviter un co-host par email
- Permissions granulaires : calendrier, tarifs, messagerie, check-in
- Table : `co_hosts(villa_id, user_id, permissions, status)`

### 7. Rapports exportables
**Pourquoi** : Les proprios veulent des PDF/CSV pour leur comptable.
**Spécification** :
- Export CSV/PDF des réservations (période, villa)
- Export revenus mensuels avec détail commission
- Génération facture automatique pour le propriétaire (pas juste le client)
- Page : `/dashboard/export`

---

## Phase 2 — Audit Espace Client (Tenant)

✅ Ce que Kayvila fait déjà :
- Recherche avec filtres, HoverCard, Carousel, Stepper checkout
- Espace client complet : checklist, livret, documents, notifications, favoris, parrainage
- Annulation 3 étapes, politique remboursement visible
- Guide des alentours Kayvila
- Partage séjour, ajout calendrier

🔴 Ce qui MANQUE (ordre de priorité) :

### 1. Avis double aveugle
**Pourquoi** : C'est LE standard. Sans ça, pas de confiance.
**Spécification** :
- Le voyageur ET le proprio notent sans voir la note de l'autre
- Publication automatique 14 jours après check-out (ou quand les 2 ont noté)
- 6 critères : Propreté, Emplacement, Équipements, Accueil, Rapport qualité/prix, Confort
- Note globale = moyenne pondérée
- Photos possibles dans les avis
- Réponse publique du propriétaire
- Recherche par mot-clé dans les avis ("piscine", "famille")
- Badge "Séjour vérifié" sur les avis

### 2. Favoris avec alertes de prix
**Pourquoi** : Airbnb envoie des emails "Le prix de votre villa en favori a baissé !"
**Spécification** :
- Notification/email si prix baisse de >10%
- Notification si dates bloquées se libèrent
- Section "Favoris" dans l'espace client avec statut disponibilité

### 3. Messagerie voyageur avancée
**Pourquoi** : Le chatbot est bien, mais un vrai chat avec le proprio c'est mieux.
**Spécification** :
- Chat direct avec le proprio (après réservation confirmée)
- Templates : "Demande de check-in anticipé", "Problème avec la clim", "Recommandation restaurant"
- Partage de photos dans le chat (signalement problème)
- Traduction automatique

### 4. Programme fidélité (Kayvila Club)
**Pourquoi** : Booking Genius, Airbnb n'a rien. Opportunité !
**Spécification** :
- 3 niveaux : Silver (2 séjours), Gold (5 séjours), Platinum (10 séjours)
- Avantages : réduction 5%/10%/15%, early check-in gratuit, late check-out, welcome gift
- Dashboard fidélité avec progression, avantages débloqués

### 5. Vérification identité voyageur
**Pourquoi** : Sécurité pour les proprios. Airbnb Verified ID.
**Spécification** :
- Upload pièce d'identité avant première réservation
- Selfie matching
- Badge "Voyageur vérifié" sur le profil

### 6. Check-in autonome amélioré
**Pourquoi** : Le futur c'est le check-in sans contact. Kayvila a une checklist, mais on peut aller plus loin.
**Spécification** :
- Digicode généré automatiquement et unique par séjour (serrure connectée Nuki/Yale)
- Code valide uniquement pendant le séjour
- Envoi automatique 24h avant arrivée
- Vidéo check-in (lien YouTube privé montrant l'entrée, le digicode, les équipements)

### 7. Conciergerie connectée
**Pourquoi** : Le Collectionist et Airbnb Luxe ont un concierge humain. Différenciateur luxe.
**Spécification** :
- Chat WhatsApp/SMS avec un vrai concierge (pas un bot)
- Réservation restaurant, activité, transfert aéroport → en un message
- Tarifs affichés, paiement intégré
- Historique des demandes

### 8. Après-séjour : ré-réservation + avis
**Pourquoi** : Le moment où le client est le plus engagé.
**Spécification** :
- Email J+1 : "Votre avis compte" → lien notation
- Email J+3 : suggestions villas similaires + code promo fidélité
- Email J+30 : "Les nouvelles villas depuis votre séjour"

---

## Phase 3 — Quick Wins (moins de 2h chaque)

1. **Badge "Vérifié"** sur les fiches villa et profil proprio (juste l'UI, même sans vérification réelle)
2. **Compteur "X personnes regardent cette villa"** — urgence sociale
3. **Temps de réponse moyen** affiché sur fiche villa ("Répond en < 2h")
4. **Photos des alentours** prises par l'équipe Kayvila (pas Google Images)
5. **Page /experience** — photos et vidéos immersives Martinique (déjà partiellement existant)
6. **Mode sombre** — luxe nocturne, les voyageurs réservent souvent le soir
7. **Accessibilité WCAG AA** — obligatoire pour les marchés US/UK

---

## Checklist

### Proprio
- [ ] Vérification identité (upload CNI + selfie)
- [ ] Smart Pricing (coefficients saison, demande, événements)
- [ ] Programme Superhost Kayvila (Silver/Gold/Platinum)
- [ ] Assurance dommages intégrée
- [ ] Messagerie temps réel + templates + traduction
- [ ] Co-Host (invitation, permissions granulaires)
- [ ] Export CSV/PDF revenus et réservations

### Client
- [ ] Avis double aveugle (6 critères, photos, réponse publique)
- [ ] Alertes prix/dispo sur favoris
- [ ] Chat proprio direct
- [ ] Programme fidélité Kayvila Club (3 niveaux)
- [ ] Vérification identité voyageur
- [ ] Digicode connecté + vidéo check-in
- [ ] Conciergerie connectée (WhatsApp, paiement intégré)
- [ ] Emails post-séjour (avis, suggestions, code promo)

### Quick Wins
- [ ] Badge "Vérifié"
- [ ] Compteur "X personnes regardent"
- [ ] Temps de réponse affiché
- [ ] Photos alentours équipe Kayvila
- [ ] Mode sombre
- [ ] Accessibilité WCAG AA

### Règles absolues
- [ ] Playfair Display intouchable
- [ ] Design Kayvila (gold/navy/offwhite) préservé
- [ ] `npm run build` passe
- [ ] Mobile vérifié sur chaque feature
