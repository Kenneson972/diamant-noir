# Guide Complet Kayvila — Fonctionnement du site

> Guide destiné à l'équipe Kayvila. Explication détaillée de chaque page, chaque bouton, chaque fonctionnalité.  
> Langage simple, sans termes techniques.

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Site public — Ce que voient les visiteurs](#2-site-public--ce-que-voient-les-visiteurs)
3. [Espace Client — Ce que voit le voyageur](#3-espace-client--ce-que-voit-le-voyageur)
4. [Dashboard Admin — Le centre de contrôle](#4-dashboard-admin--le-centre-de-contrôle)
5. [Dashboard Propriétaire — Suivi des villas](#5-dashboard-propriétaire--suivi-des-villas)
6. [Les emails automatiques](#6-les-emails-automatiques)
7. [Comment l'argent circule](#7-comment-largent-circule)
8. [Glossaire](#8-glossaire)

---

## 1. Vue d'ensemble

Le site Kayvila a **4 parties** :

| Partie | Qui ? | Pour quoi faire ? |
|--------|-------|-------------------|
| **Site public** | Les visiteurs | Découvrir les villas, réserver un séjour |
| **Espace client** | Les voyageurs (après réservation) | Préparer et gérer leur séjour |
| **Dashboard admin** | L'équipe Kayvila | Gérer villas, réservations, revenus, propriétaires, clients |
| **Dashboard proprio** | Les propriétaires | Suivre leurs villas, leurs réservations, leurs revenus |

Chaque partie est protégée : l'espace client et les dashboards demandent une connexion (email + mot de passe ou lien magique).

---

## 2. Site public — Ce que voient les visiteurs

C'est la vitrine. N'importe qui peut y accéder sans compte.

### Pages principales

#### Accueil (`/`)
La page d'entrée. Elle contient :
- Un **grand titre** avec une photo de villa en arrière-plan
- Un **moteur de recherche** : le visiteur choisit ses dates (arrivée/départ) et le nombre de voyageurs, puis clique sur "Rechercher"
- Une **sélection de villas** mises en avant
- Des **informations sur la conciergerie** (services, confiance, réactivité)
- Un **pied de page** avec les liens légaux et les réseaux sociaux

#### Catalogue des villas (`/villas`)
Toutes les villas disponibles à la location. On peut voir :
- **En liste** : chaque villa avec sa photo, son nom, sa localisation, son prix par nuit, sa capacité
- **Sur une carte** : un bouton permet de basculer entre la liste et la carte interactive (Leaflet). Les villas apparaissent comme des points sur la carte de Martinique
- **Filtres** par capacité, prix, équipements
- **Comparateur** : on peut sélectionner jusqu'à 3 villas pour les comparer côte à côte

#### Fiche d'une villa (`/villas/nom-de-la-villa`)
La page détaillée d'une villa avec :
- **Galerie photos** en pleine largeur, avec lightbox (clic pour agrandir)
- **Nom, localisation, capacité**, prix par nuit
- **Équipements** listés avec des icônes (piscine, climatisation, WiFi, etc.)
- **Calendrier des disponibilités** : le visiteur voit quelles dates sont libres
- **Bouton "Réserver"** qui lance le processus de réservation

#### Réservation (`/book`)
Le tunnel de réservation :
1. Le client choisit ses dates (arrivée/départ)
2. Il voit le **prix total** : nuitées + frais de ménage + frais de service
3. Il remplit ses informations : **nom, email, téléphone**
4. Il doit **accepter les CGV** (conditions générales de vente)
5. Il paie par **carte bancaire** via Stripe (paiement sécurisé)
6. Il est redirigé vers la page de **confirmation** (`/success`)

Si la villa appartient à un propriétaire dont le compte bancaire n'est pas encore validé, la réservation est bloquée (message : "Le propriétaire doit finaliser son compte de paiement").

#### Autres pages publiques

| Page | Description |
|------|-------------|
| **Qui sommes-nous** | L'histoire de Kayvila, la mission, l'équipe |
| **Conciergerie** | Les services proposés : ménage, accueil, maintenance, gestion locative |
| **Soumettre ma villa** | Formulaire pour les propriétaires qui veulent confier leur villa. Demande : type de bien, surface, chambres, équipements, photos, coordonnées |
| **Tarifs** | Les prix des services de conciergerie |
| **FAQ** | Questions fréquentes |
| **Contact** | Formulaire de contact (nom, email, message) |
| **CGV** | Conditions générales de vente |
| **Mentions légales** | Informations légales obligatoires |
| **Confidentialité** | Politique de confidentialité (RGPD) |
| **Cookies** | Gestion des cookies |

---

## 3. Espace Client — Ce que voit le voyageur

Le client se connecte avec son email. Il reçoit un **lien magique** par email qui le connecte automatiquement.

La **barre latérale** (menu) affiche 10 rubriques avec des icônes. En haut de chaque page, un **texte doré** (le "kicker") indique le contexte.

### Page d'accueil — Séjour

**Kicker :** CONCIERGERIE KAYVILA
**Titre :** Bonjour, [Prénom]

Cette page est le tableau de bord du voyageur. Elle affiche :

- **Avatar et prénom** du client en haut à droite
- **Réservations en attente** : si le client a une réservation non encore confirmée, elle apparaît dans un encadré doré avec le nom de la villa, les dates, et un message "L'équipe Kayvila traite votre réservation sous 24h"
- **Prochain séjour** : une grande bannière avec la photo de la villa, le compte à rebours (J-12, J-3...), les dates
- **Informations pratiques** : heures de check-in (16h00) et check-out (11h00), nom du WiFi et mot de passe (avec bouton pour copier), lien Google Maps
- **Instructions de check-out** : les consignes spécifiques de la villa
- **Demandes en cours** : la liste des services demandés et leur statut
- **Accès rapides** : boutons vers la messagerie, le livret d'accueil, les favoris
- **Partage** : bouton pour partager les infos du séjour (dates, adresse) avec ses proches
- **Réservations passées** : cartes avec photo, dates, bouton "Réserver à nouveau"
- **Suggestions** : jusqu'à 3 villas similaires proposées après un séjour
- **Guide local** : recommandations (restaurants, activités)

**État vide** (aucune réservation) : message "Aucune réservation" avec explication et bouton "Découvrir nos villas".

---

### Livret d'accueil

**Kicker :** VOTRE VILLA
**Titre :** Livret d'accueil

Le guide numérique de la villa. Le client y trouve :

- **Nom de la villa** et localisation
- **Bouton "Télécharger PDF"** pour imprimer le livret
- **5 sections navigables** (menu sur le côté sur ordinateur, boutons en haut sur téléphone) :

| Section | Contenu |
|---------|---------|
| **WiFi & accès** | Nom du réseau, mot de passe (affichable/masquable), bouton "Copier" |
| **Check-in / Check-out** | Horaires (16h00 / 11h00), instructions personnalisées, lien Google Maps |
| **Contacts utiles** | Contacts d'urgence spécifiques à la villa |
| **À proximité** | Recommandations : restaurants, plages, activités, commerces |
| **Urgences** | Numéros : SAMU (15), Police (17), Pompiers (18), Urgences Europe (112). Avec liens cliquables pour appeler |

**État vide :** message "Le livret sera complété avant votre arrivée par l'équipe Kayvila."

---

### Favoris

**Kicker :** VOS COUPS DE CŒUR
**Titre :** Mes favoris

- **Compteur** : "X villa(s) enregistrée(s)"
- **Grille de cartes** : chaque villa a sa photo, son nom, sa localisation, son prix par nuit
- **Bouton cœur** (rouge) pour retirer des favoris
- **Lien "Voir la villa"** pour accéder à la fiche détaillée

**État vide :** message "Aucune villa favorite" avec bouton "Découvrir nos villas".

---

### Messages

**Kicker :** VOTRE CONCIERGE
**Titre :** Messages

Messagerie directe avec l'équipe Kayvila :

- **Fil de discussion** avec l'équipe (chat)
- L'équipe répond sous 24h
- La conversation est liée au séjour en cours du client

---

### Notifications

**Kicker :** RESTEZ INFORMÉ
**Titre :** Notifications

Centre d'alertes du client :

- **Compteur** : "X notification(s) non lue(s)" ou "Tout est lu"
- **Bouton "Tout marquer comme lu"** pour effacer les notifications non lues
- Chaque notification a : un titre, un message (2 lignes), une date relative ("il y a 2 heures")
- **Point doré** = non lu, **point gris** = lu
- Si la notification a un lien, un bouton "Voir" apparaît

**État vide :** message "Aucune notification. Les notifications de vos demandes et messages apparaîtront ici."

---

### Services & demandes

**Kicker :** PENDANT VOTRE SÉJOUR
**Titre :** Services & demandes

Le client peut demander des services pendant son séjour :

- **Formulaire de demande** : choix du type de service, message descriptif
- **Historique** : liste des demandes déjà faites avec leur statut (en cours, traité, etc.)

**État vide** (pas de séjour actif) : message "Les demandes sont disponibles pendant votre séjour confirmé."

---

### Avant votre arrivée (Checklist)

**Kicker :** VOTRE SÉJOUR
**Titre :** Avant votre arrivée

Une checklist pour préparer le séjour. **4 étapes** à cocher :

1. **Pièces d'identité** — Passeport ou carte d'identité en cours de validité
2. **Contrat de location signé** — Vérifier l'email de confirmation ou contacter la conciergerie
3. **Ajouter au calendrier** — Trois boutons : **iCal** (fichier .ics à télécharger), **Google Calendar** (lien direct), **Outlook** (lien direct)
4. **Horaires & accès** — Check-in à partir de 16h00, check-out avant 11h00. Lien vers le livret.

- Une **barre de progression** montre l'avancement (ex: "3/4 étapes complétées")
- Un chip **"Prêt"** apparaît quand tout est coché
- Les cases cochées sont sauvegardées automatiquement
- Les éléments complétés apparaissent barrés et grisés

---

### Profil

**Kicker :** VOTRE COMPTE
**Titre :** Mon profil

Gestion des informations personnelles :

- **Formulaire** : nom complet, téléphone, avatar (photo de profil)
- **Email** : affiché en lecture seule (lié au compte)
- **Préférences de séjour** :
  - Allergies & régimes alimentaires (texte libre)
  - Occasion spéciale (anniversaire, lune de miel, etc.)
  - Heure d'arrivée estimée (de 14h00 à 22h00)
  - Équipement bébé : lit bébé, chaise haute (cases à cocher)
  - Bouton **"Enregistrer les préférences"**
  - Message de confirmation "Préférences sauvegardées" (disparaît après 3 secondes)

---

### Documents

**Kicker :** VOTRE DOSSIER
**Titre :** Mes documents

Centralise les documents du client :

- **Livret d'accueil PDF** pour chaque réservation (bouton pour ouvrir)
- **Factures** : pour les séjours terminés, un bouton "Télécharger" génère une facture PDF avec le logo Kayvila, les dates, le montant

**État vide :** message "Aucun document disponible."

---

### Contacts & urgences

**Kicker :** NOUS JOINDRE
**Titre :** Contacts & urgences

Tous les moyens de contacter Kayvila :

- **Urgences 24h/24** : `+596 696 68 18 69` — lien cliquable pour appeler
- **Téléphone** : même numéro, disponible Lun-Sam 8h-20h
- **Email** : `contact@kayvila.com` — réponse sous 24h
- **Horaires détaillés** : Lundi-Vendredi 8h-20h, Samedi 9h-18h, Dimanche et jours fériés (urgences uniquement)
- **Services ponctuels** : ménage supplémentaire, changement de linge, remplissage gaz/eau (liens vers la page Demandes)

---

## 4. Dashboard Admin — Le centre de contrôle

Accessible uniquement par l'équipe Kayvila (mot de passe). C'est ici que tout se gère.

### Accueil Admin

**Ce qu'on voit :**

- **4 KPI prioritaires** : nombre de réservations, demandes en attente, avis à modérer, note moyenne
- **4 KPI secondaires** : nombre de villas, propriétaires, clients, taux de conversion des demandes
- **Actions rapides** : boutons "Ajouter une villa", "Réservations", "Messages"
- **Arrivées du jour** : liste des clients qui arrivent aujourd'hui (nom, villa)
- **Départs du jour** : liste des clients qui partent aujourd'hui
- **Activité récente** : les 8 derniers événements (nouvelles résas, demandes, avis) triés par date
- **Alertes** : demandes en attente et avis à modérer
- **Villas les plus aimées** : top 5 des villas ajoutées aux favoris
- **Taux d'occupation** : pourcentage par villa pour le mois en cours, avec barre de progression

---

### Villas (liste)

**Ce qu'on peut faire :**

- **Rechercher** une villa par nom ou localisation
- **Filtrer** par statut (publiées / non publiées) et par collection (Premium, Essentielle, etc.)
- **Trier** par prix, nom, localisation, capacité
- **Ajouter une villa** (bouton en haut à droite)

**Le tableau affiche pour chaque villa :**

| Colonne | Description |
|---------|-------------|
| Image | Miniature |
| Nom | Nom de la villa |
| Localisation | Ville ou région |
| Prix | Prix par nuit |
| Capacité | Nombre de personnes |
| Collection | Niveau (Premium, etc.) |
| Propriétaire | Nom du proprio (lien cliquable) |
| Publiée | Oui (vert) / Non (gris) |
| Résas | Nombre de réservations (cliquable → ouvre l'historique) |
| Revenus | Total des revenus confirmés |
| Actions | "Modifier", "Calendrier", "Voir" (site public) |

**Sur mobile :** les villas apparaissent en cartes au lieu d'un tableau.

**Fonction spéciale :** cliquer sur le nombre de réservations ouvre un panneau latéral avec l'historique complet (client, dates, nuits, montant, commission, source).

---

### Éditeur de villa

Quand on clique sur "Modifier" depuis la liste des villas.

**Ce qu'on peut modifier :**
- Nom, description, localisation, coordonnées GPS
- Photos (ajout, suppression, réorganisation)
- Prix par nuit, frais de ménage, frais de service
- Capacité, chambres, salles de bain
- Équipements (5 catégories : intérieur, extérieur, cuisine, divertissement, sécurité) avec recherche
- Tarifs saisonniers (prix différents selon la période)
- Propriétaire assigné
- Statut de publication (publiée / brouillon)

**Fonctionnalités :**
- **Sauvegarde automatique** après 2,5 secondes d'inactivité
- **Aperçu en direct** des modifications
- **Carte miniature** si les coordonnées GPS sont renseignées
- **Historique des réservations** de la villa

---

### Réservations

**Ce qu'on peut faire :**

- **3 modes d'affichage** : Liste, Kanban (colonnes par statut), Calendrier
- **Filtrer** par statut : Toutes, En attente, Confirmées, Annulées, Passées
- **Filtrer par villa** : sélectionner une villa spécifique
- **Rechercher** par nom de client ou numéro de réservation
- **Créer une réservation manuellement** (bouton "Nouvelle réservation")
- **Actions en masse** : sélectionner plusieurs réservations → Confirmer, Annuler, ou Exporter

**Mode Liste (tableau) :**

| Colonne | Description |
|---------|-------------|
| ☐ | Case à cocher (sélection multiple) |
| Client | Nom + email |
| Villa | Nom de la villa |
| Arrivée | Date d'arrivée |
| Départ | Date de départ |
| Nuits | Nombre de nuits |
| Montant | Prix total |
| Statut | Pastille : vert (confirmé), orange (en attente), rouge (annulé) |
| Actions | "Voir", "Confirmer", "Annuler" |

**Mode Kanban :** 5 colonnes — En attente, Confirmées, Check-in, Terminées, Annulées. On peut **glisser-déposer** une réservation d'une colonne à l'autre pour changer son statut.

**Mode Calendrier :** vue mensuelle avec navigation. Chaque réservation apparaît le jour de son arrivée avec le nom du client et la villa. Le jour actuel est surligné en doré.

**Créer une réservation (modale) :**
- Champs : Villa, Nom du client, Email, Date d'arrivée, Date de départ, Prix total (calculé automatiquement si vide), Statut
- Boutons : "Créer la réservation" / "Annuler"

---

### Revenus

**Ce qu'on voit :**

- **6 cartes de statistiques** : CA du mois, CA de l'année, CA total historique, Commission Kayvila, Reversement propriétaires, Nombre total de réservations
- **Graphique 12 mois** : histogramme du CA mensuel. Chaque barre est **cliquable** pour voir le détail du mois
- **Sélecteur de mois** : permet de choisir un mois précis
- **Bouton "Export CSV"** (global) : télécharge un fichier avec les données par villa

**Quand on clique sur un mois — Détail complet :**

- **Badges de comparaison** : "vs mois précédent : +15%" (vert) ou "-8%" (rouge), "vs année dernière : +22%"
- **8 cartes de synthèse** : CA brut, Commission Kayvila (avec détail : nuitées, ménage, service), Reversement propriétaires, Nombre de réservations, Nuitées vendues, Prix moyen/nuit, Taux d'occupation, Panier moyen
- **Widget "Annulé ce mois"** (fond rouge) : nombre de réservations annulées + CA perdu
- **Widget "En attente (pipeline)"** (fond gris) : nombre de réservations en attente + CA potentiel
- **Tableau par villa** : pour chaque villa → CA brut, Nuitées, Occupation %, ADR, Commission, Reversement, Nombre de résas, % du CA du mois
- **Tableau par canal** : Airbnb, Direct, Booking, etc. → CA, % du mois, taux de commission
- **Détail par villa (accordéon)** : cliquer sur une villa déplie la liste de ses réservations (client, dates, nuits, canal, brut, commission, net). Lien "voir tout" vers les réservations filtrées.
- **Bouton "Exporter ce mois"** : télécharge un CSV avec le détail des réservations du mois

---

### Propriétaires

**Tableau des propriétaires :**

| Colonne | Description |
|---------|-------------|
| Propriétaire | Avatar (initiale) + nom + badge "Suspendu" si applicable |
| Email | Adresse email |
| Villas | Nombre de villas + combien sont publiées |
| Stripe | Statut du compte bancaire : "Connecté" (vert), "En attente" (orange), "Non configuré" (gris) |
| Commission | Taux de commission moyen |
| Inscrit le | Date d'inscription |
| Actions | Lien "Détail →" |

**Fiche détaillée d'un propriétaire (4 onglets) :**
1. **Infos** — coordonnées, date d'inscription
2. **Villas** — liste de ses villas avec statut, prix, commission
3. **Revenus** — graphiques et chiffres, historique des réservations
4. **Stripe & Litiges** — configuration du compte bancaire, gestion des litiges

---

### Clients

**Tableau des clients :**

| Colonne | Description |
|---------|-------------|
| Nom | Nom complet |
| Email | Adresse email |
| Téléphone | Numéro de téléphone |
| Séjours | Nombre de réservations effectuées |
| Inscrit le | Date d'inscription |
| Actions | Lien "Fiche 360°" |

**Recherche :** par nom ou email.

**Fiche client 360° :**
- Informations de contact (email, téléphone)
- Préférences de séjour (allergies, occasions, équipement bébé)
- Historique des réservations avec statut et état de la checklist
- Demandes de services effectuées
- Avis laissés (note en étoiles, commentaire, statut)

---

### Soumissions (propriétaires qui veulent confier leur villa)

**Chaque soumission est une carte avec 4 colonnes :**

| Colonne | Contenu |
|---------|---------|
| **Le bien** | Type de bien, surface, terrain, chambres, SDB, étages, parking. Équipements : piscine, vue mer, jacuzzi, etc. |
| **Situation** | Statut locatif, gardien, photos disponibles, plateformes actuelles |
| **Contact** | Nom, email, téléphone, adresse |
| **Admin** | Score AI (note/10), recommandation, notes internes |

**Actions disponibles pour chaque soumission :**
- "Voir la fiche" (détail complet)
- "Programmer visite" (avec sélecteur de date)
- "Appel" (change le statut)
- "Docs" (demander des documents)
- **"Accepter"** (fond vert) — crée la villa automatiquement
- **"Refuser"** (bordure rouge) — clôture le dossier

---

### Tarification saisonnière

Permet de définir des prix différents selon les périodes.

- **Sélecteur de villa** : choisir la villa à configurer
- **Tableau des tarifs** : saison, dates de début/fin, prix/nuit, différence en % par rapport au prix de base
- **Formulaire d'ajout** : nom de la saison, date début, date fin, prix/nuit
- Validation : les plages ne peuvent pas se chevaucher

---

### Autres pages admin

| Page | Description |
|------|-------------|
| **Avis** | Modération des avis clients (approuver, refuser) |
| **Messages** | Messagerie avec les clients et propriétaires |
| **Paramètres** | Configuration : infos générales, paiements, sécurité, notifications, formulaire conciergerie (téléphone, email), saisons Martinique |
| **Membres** | Gestion des comptes de l'équipe (qui a accès à l'admin) |
| **Documents** | Documents internes partagés |
| **Sync OTA** | Synchronisation avec Airbnb, Booking, etc. |
| **Hub classique** | Interface alternative pour la gestion quotidienne |

---

## 5. Dashboard Propriétaire — Suivi des villas

Les propriétaires se connectent avec leur email et mot de passe.

### Accueil Propriétaire

**Ce qu'on voit :**

- **Bannière Stripe Connect** :
  - Si pas connecté : message orange "Paiements non configurés" + bouton "Connecter mon compte Stripe"
  - Si connecté : message vert "Compte bancaire connecté — paiements automatiques activés"

- **4 KPI** : Revenus du mois, Réservations à venir, Tâches en attente, Occupation du mois

- **Aujourd'hui** : arrivées, départs, séjours en cours (avec nom du voyageur et villa)

- **Graphique des revenus** : 6 derniers mois, en euros

- **Prochaines réservations** : jusqu'à 3 réservations à venir avec dates et nom du client

- **Mes villas** : liste des villas avec lien "Gérer"

- **Tâches & alertes** : tâches en attente

- **Assistant IA "Diamant"** : le propriétaire peut poser des questions sur ses villas, réservations ou revenus

**État vide (aucune villa) :** message de bienvenue avec bouton "Ajouter ma première villa".

---

### Mes Villas

Liste des villas du propriétaire sous forme de **cartes** (1 colonne sur mobile, 3 sur desktop).

Chaque carte affiche : photo, nom, localisation, capacité, chambres, salles de bain, prix par nuit.  
Survol → "Modifier →". Clic → page de détail.

Bouton **"Ajouter une villa"** en haut.

---

### Réservations

**Filtres :**
- Par statut : Toutes, En attente, Confirmées, Annulées
- Par villa (si plusieurs villas)
- Recherche par nom de voyageur

**Affichage :** groupé par mois (ex: "Juillet 2026", "Juin 2026"). Chaque réservation montre :
- Nom du voyageur
- Badge de statut (couleur)
- Nom de la villa
- Dates (format français)
- Prix total
- Nombre de nuits
- Source (Airbnb, Direct, Booking, etc.)
- Statut de paiement

Clic → page de détail de la réservation.

---

### Revenus

- **3 cartes** : Reversement net ce mois, Reversement net (6 mois), Moyenne mensuelle
- **Graphique 6 mois** : histogramme des revenus nets
- **Tableau détaillé** :

| Colonne | Description |
|---------|-------------|
| Arrivée | Date d'arrivée |
| Voyageur | Nom du client |
| Villa | Nom de la villa |
| Nuits | Nombre de nuits |
| Brut | Montant total |
| Commission | Part Kayvila (en rouge) |
| Fr. ménage | Frais de ménage |
| Net | Reversement au proprio (en doré) |
| Statut | Paiement : En attente, Payé, Virement émis |
| Action | Flèche pour déplier le détail |

- **Ligne de totaux** en pied de tableau
- **Ligne détail** (dépliable) : décomposition financière, infos Stripe (ID transfert, date)
- **Bouton "Télécharger le relevé"** (PDF du mois)
- **Bouton "Exporter en PDF"** (rapport complet)

---

### Statistiques

Page de sélection : choisir une villa pour voir ses statistiques détaillées (occupation, ADR, revenus, tendances).

---

### Tâches

Suivi des maintenances :

- **Bouton "Signaler un problème"** : ouvre un formulaire (type : plomberie, électricité, clim, piscine, jardin, ménage, autre ; description ; priorité : normale ou urgente)
- **Liste des tâches** : chaque tâche montre son titre, description (2 lignes), date d'échéance, villa concernée, statut (À faire / En cours / Terminée)
- Clic → détail de la tâche

---

### Documents

Documents partagés par l'équipe Kayvila (contrats, factures).

**Tableau :** Nom du fichier, Tags (ex: "contrat"), Taille, Date, Bouton téléchargement.

---

### Mon Concierge

Messagerie avec l'équipe Kayvila :

- **Deux onglets** : "Concierge IA" (assistant) et "Notre équipe" (messagerie)
- **Messagerie** : fil de discussion avec l'équipe, messages en temps réel
- **3 boutons rapides** : Reversement, Disponibilités, Autre demande
- **Sélecteur de sujet** avant d'envoyer un message
- **Compteur de caractères** (max 2000)
- **Indicateurs de statut** : Envoyé, Lu par l'équipe, Répondu

---

## 6. Les emails automatiques

Le site envoie automatiquement ces emails :

| Email | Destinataire | Quand ? |
|-------|-------------|---------|
| **Confirmation de réservation** | Client | Juste après le paiement |
| **Nouvelle réservation** | Admin | À chaque nouvelle réservation |
| **Nouvelle réservation** | Propriétaire | À chaque réservation sur sa villa |
| **Rappel check-in (J-3)** | Client | 3 jours avant l'arrivée |
| **Demande d'avis** | Client | Après son séjour |
| **Alerte litige Stripe** | Admin | Si un client conteste un paiement |
| **Bienvenue Stripe Connect** | Propriétaire | Quand son compte bancaire est validé |

**Expéditeur :** `Kayvila <conciergerie@kayvila.com>`

Si l'envoi échoue, le site continue de fonctionner normalement (l'erreur est enregistrée dans les logs mais ne bloque rien).

---

## 7. Comment l'argent circule

### Quand un client réserve

1. Le client paie le montant total (nuitées + ménage + service) par carte bancaire
2. Stripe encaisse le paiement sur le **compte plateforme Kayvila**
3. Stripe transfère automatiquement la **part du propriétaire** sur son compte bancaire (78% ou 80% des nuitées)
4. Kayvila garde sa **commission** (20% ou 22% des nuitées + 100% des frais de ménage et service)

### Taux de commission

| Source de la réservation | Commission Kayvila | Part proprio |
|--------------------------|-------------------|--------------|
| Direct (site Kayvila) | 22% | 78% |
| OTA (Airbnb, Booking, etc.) | 20% | 80% |

### Remboursement

Quand l'admin annule une réservation :
- Le client est remboursé
- La part du propriétaire est automatiquement reprise par Stripe

### Garde-fou

Une villa dont le propriétaire n'a pas finalisé son compte bancaire Stripe **ne peut pas être réservée**. Le client voit un message "Le propriétaire doit finaliser son compte de paiement".

---

## 8. Glossaire

| Terme | Signification |
|-------|---------------|
| **ADR** | Prix moyen par nuit (Average Daily Rate). CA nuitées ÷ nombre de nuits vendues |
| **CA brut** | Chiffre d'affaires total (ce que le client paie, avant commission) |
| **Commission** | La part que Kayvila garde (20% ou 22% des nuitées) |
| **Reversement** | La part envoyée au propriétaire (78% ou 80% des nuitées) |
| **OTA** | Plateforme de réservation en ligne (Airbnb, Booking.com, Expedia, VRBO) |
| **Pipeline** | Réservations en attente de confirmation |
| **Taux d'occupation** | Pourcentage de nuits occupées par rapport aux nuits disponibles |
| **Panier moyen** | Montant moyen par réservation (CA total ÷ nombre de résas) |
| **KYC** | Vérification d'identité (Know Your Customer) — obligatoire pour Stripe |
| **Stripe Connect** | Le système qui permet de payer automatiquement les propriétaires |
| **Kicker** | La petite ligne en majuscules dorées au-dessus du titre de chaque page |
