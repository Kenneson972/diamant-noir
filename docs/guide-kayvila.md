# Guide Kayvila — Comment fonctionne votre site

> Un guide simple pour comprendre chaque partie du site, sans termes techniques.
> Destiné à l'équipe Kayvila (Richard et son équipe).

---

## Vue d'ensemble

Le site Kayvila est composé de **4 parties** :

| Partie | Qui l'utilise ? | À quoi ça sert ? |
|--------|-----------------|-------------------|
| **Site public** | Les visiteurs (voyageurs) | Découvrir les villas, réserver |
| **Espace client** | Les voyageurs (après réservation) | Gérer son séjour |
| **Dashboard admin** | L'équipe Kayvila | Gérer tout : villas, résas, revenus, propriétaires |
| **Dashboard proprio** | Les propriétaires de villa | Suivre leurs villas, leurs revenus |

---

## 1. Le site public (ce que voient les visiteurs)

C'est la vitrine de Kayvila sur internet. N'importe qui peut y accéder.

### Pages principales

| Page | Description |
|------|-------------|
| **Accueil** (`/`) | La page d'entrée. Un grand titre avec un moteur de recherche (dates, voyageurs), les villas mises en avant, et des informations sur la conciergerie. |
| **Villas** (`/villas`) | Le catalogue de toutes les villas. On peut voir une liste OU une carte (bouton pour basculer). Chaque villa a sa photo, son prix par nuit, sa capacité. |
| **Fiche villa** (`/villas/nom-de-la-villa`) | La page détaillée d'une villa : photos, équipements, disponibilités, prix. C'est ici que le client clique sur "Réserver". |
| **Réservation** (`/book`) | Le formulaire de réservation. Le client choisit ses dates, voit le prix total, et paie par carte bancaire (Stripe). |
| **Confirmation** (`/success`) | La page qui confirme que la réservation est bien prise en compte. Le client reçoit aussi un email. |
| **Qui sommes-nous** | L'histoire de Kayvila, l'équipe. |
| **Conciergerie** | Les services proposés (ménage, accueil, maintenance...). |
| **Soumettre ma villa** | Un formulaire pour les propriétaires qui veulent confier leur villa à Kayvila. |
| **Tarifs** | Les prix des services de conciergerie. |
| **FAQ** | Questions fréquentes. |
| **Contact** | Formulaire pour contacter Kayvila (email, téléphone). |
| **CGV / Mentions légales / Cookies / Confidentialité** | Les pages légales obligatoires. |

### Comment un client réserve ?

1. Il arrive sur le site → cherche une villa → voit les disponibilités
2. Il clique sur **"Réserver"** → choisit ses dates → voit le prix
3. Il remplit ses infos (nom, email) → accepte les CGV → paie par carte
4. Il reçoit un **email de confirmation** automatiquement
5. Il est redirigé vers son **espace client**

---

## 2. L'espace client (le voyageur après sa réservation)

Le client se connecte avec son email (lien magique reçu par email).

| Page | Description |
|------|-------------|
| **Séjour** (accueil) | Un résumé : le compte à rebours avant l'arrivée, les infos de sa réservation, des accès rapides. |
| **Livret d'accueil** | Toutes les infos pratiques : code WiFi, heures d'arrivée/départ, contacts utiles, recommandations. |
| **Favoris** | Les villas mises en favoris par le client pour les comparer ou y revenir plus tard. |
| **Messages** | Une messagerie pour parler directement avec l'équipe Kayvila. |
| **Notifications** | Les alertes reçues (rappel check-in, nouveau message, etc.). |
| **Services & demandes** | Le client peut demander des services pendant son séjour (ménage supplémentaire, réservation restaurant, etc.). |
| **Avant votre arrivée** | Une checklist : ce qu'il faut préparer avant le séjour (documents, contacts, etc.). |
| **Mon profil** | Les infos personnelles du client (nom, téléphone, email). |
| **Mes documents** | Les factures et documents liés aux séjours. |
| **Contacts & urgences** | Les numéros et contacts importants (urgences 24h/24, conciergerie, etc.). |

---

## 3. Le dashboard admin (l'équipe Kayvila)

C'est le centre de contrôle. Accessible uniquement par l'équipe (mot de passe).

### Accueil admin

Un tableau de bord avec :
- Les **KPIs** : arrivées du jour, départs du jour, occupation des villas
- L'**activité récente** : dernières réservations, nouveaux messages
- Des **actions rapides** : créer une réservation, voir les tâches

### Gestion des villas

| Page | Description |
|------|-------------|
| **Villas** | La liste de toutes les villas. On peut voir leur statut (publiée ou non), leur prix, leur propriétaire. Cliquer sur une villa permet de la modifier. |
| **Éditeur de villa** | Une page complète pour modifier une villa : nom, description, photos, prix, équipements, chambres, tarifs saisonniers, etc. Les modifications sont sauvegardées automatiquement. |
| **Créer une villa** | Formulaire pour ajouter une nouvelle villa au catalogue. |

### Gestion des réservations

| Page | Description |
|------|-------------|
| **Réservations** | Toutes les réservations, en liste OU en calendrier. Filtres par statut (confirmée, annulée, en attente) et par villa. Actions : confirmer, annuler, rembourser. |
| **Détail d'une réservation** | Toutes les infos : client, villa, dates, montant, statut, historique. |

### Gestion des revenus

| Page | Description |
|------|-------------|
| **Revenus** | Le tableau de bord financier. Affiche le chiffre d'affaires du mois, de l'année, et total. Un **graphique** montre l'évolution sur 12 mois. En cliquant sur un mois, on voit le **détail** : CA par villa, commission Kayvila, reversement propriétaires, taux d'occupation, annulations. Export CSV possible. |

### Gestion des propriétaires

| Page | Description |
|------|-------------|
| **Propriétaires** | Liste de tous les propriétaires, leurs villas, leurs revenus. |
| **Fiche propriétaire** | Détail d'un proprio : infos de contact, villas, revenus, statut Stripe Connect (paiements). |

### Autres sections admin

| Page | Description |
|------|-------------|
| **Clients** | Liste des clients (voyageurs), leur historique de réservations. |
| **Soumissions** | Les demandes de propriétaires qui veulent confier leur villa. Actions : accepter, planifier une visite, demander des documents. |
| **Tarification** | Gestion des prix : tarifs saisonniers, frais de ménage, promotions. |
| **Avis** | Les avis clients sur les villas. |
| **Concierge** | Paramètres de la conciergerie : horaires, contacts, messages automatiques. |
| **Documents** | Les documents internes (contrats, factures, etc.). |
| **Paramètres** | Configuration générale du site. |
| **Membres** | Gestion des comptes de l'équipe (qui a accès à l'admin). |
| **Messages** | Messagerie avec les clients et les propriétaires. |
| **Sync OTA** | Synchronisation avec les plateformes externes (Airbnb, Booking, etc.). |
| **Hub classique** | Interface alternative pour la gestion quotidienne. |

---

## 4. Le dashboard propriétaire

Les propriétaires se connectent avec leur email et mot de passe.

| Page | Description |
|------|-------------|
| **Accueil** | Un résumé : prochaines réservations, revenus du mois, occupation. |
| **Mes villas** | La liste des villas du propriétaire. Il peut voir les infos mais c'est l'admin qui les modifie. |
| **Réservations** | Toutes les réservations pour ses villas. Filtres par statut et par villa. |
| **Revenus** | Ses revenus : graphique d'évolution, détails par mois, export PDF. |
| **Statistiques** | Statistiques détaillées par villa (occupation, ADR, revenus). |
| **Documents** | Documents partagés avec l'admin (contrats, relevés). |
| **Tâches** | Tâches à faire pour ses villas (maintenance, check-in, check-out). |
| **Concierge** | Contacter l'équipe Kayvila. |

### Comment un propriétaire est payé ?

1. **Stripe Connect** : chaque propriétaire a son propre compte bancaire relié à Kayvila
2. Quand un client paie une réservation, Stripe envoie automatiquement la part du propriétaire sur son compte (78-80% des nuitées)
3. Kayvila garde sa commission (20-22% des nuitées + 100% des frais de ménage et service)
4. Le propriétaire reçoit ses virements automatiquement (quotidiens après un délai initial)

---

## 5. Les emails automatiques

Le site envoie automatiquement ces emails :

| Email | À qui ? | Quand ? |
|-------|---------|---------|
| Confirmation de réservation | Au client | Juste après le paiement |
| Notification nouvelle réservation | À l'équipe Kayvila | À chaque nouvelle réservation |
| Notification nouvelle réservation | Au propriétaire | À chaque nouvelle réservation sur sa villa |
| Rappel check-in (J-3) | Au client | 3 jours avant l'arrivée |
| Demande d'avis | Au client | Après son séjour |
| Alerte litige Stripe | À l'équipe Kayvila | Si un client conteste un paiement |
| Onboarding Stripe Connect | Au propriétaire | Quand son compte bancaire est validé |

---

## 6. Glossaire simple

| Terme | Signification |
|-------|---------------|
| **ADR** | Prix moyen par nuit (Average Daily Rate) |
| **Taux d'occupation** | Pourcentage de nuits occupées par rapport aux nuits disponibles |
| **CA brut** | Chiffre d'affaires total (ce que le client paie) |
| **Commission Kayvila** | La part que Kayvila garde (20-22% des nuitées) |
| **Reversement proprio** | La part envoyée au propriétaire (78-80% des nuitées) |
| **OTA** | Plateforme de réservation en ligne (Airbnb, Booking, Expedia, etc.) |
| **Pipeline** | Réservations en attente (pas encore confirmées) |
| **KYC** | Vérification d'identité (Know Your Customer) — obligatoire pour Stripe |

---

## 7. Questions fréquentes

**Comment ajouter une nouvelle villa ?**
Dashboard admin → Villas → "Nouvelle villa" → remplir les infos → publier.

**Comment voir combien rapporte une villa ?**
Dashboard admin → Revenus → cliquer sur un mois → tableau "Par villa".

**Comment annuler une réservation ?**
Dashboard admin → Réservations → trouver la réservation → cliquer "Annuler". Le client est remboursé automatiquement.

**Comment contacter un client ?**
Dashboard admin → Clients → trouver le client → voir son email, ou utiliser la messagerie.

**Le site est-il sécurisé ?**
Oui. Les paiements passent par Stripe (certifié PCI). Les mots de passe sont gérés par Supabase. Les données personnelles sont protégées (RGPD).
