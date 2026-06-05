# Kayvila — Point d'avancement au 14 Mai 2026

## L'essentiel

La plateforme Kayvila est aujourd'hui complète sur ses 3 piliers : l'espace voyageur, l'espace concierge, et l'espace propriétaire — **avec désormais un système de paiement complet liant clients, propriétaires et Kayvila via Stripe Connect.**

---

## Ce qui existe aujourd'hui

### Pour vos voyageurs — Un espace client complet

Vos clients disposent maintenant d'un espace personnel riche qui les accompagne avant, pendant et après leur séjour :

- **Avant le séjour** : checklist de préparation, code d'accès reçu 24h avant l'arrivée, profil personnalisé (allergies, occasion spéciale, équipement bébé), livret d'accueil complet
- **Pendant le séjour** : messagerie avec la conciergerie, demandes de services (ménage supplémentaire, changement de linge), partage du séjour avec leurs proches, ajout au calendrier
- **Après le séjour** : facture, dépôt d'avis, proposition de villas similaires, ré-réservation en un clic

**Nouveau (14 mai)** : Un compte client est automatiquement créé après chaque paiement réussi. Le client reçoit un email d'invitation et retrouve toutes ses réservations dans son espace client.

### Pour votre équipe concierge — Un tableau de bord professionnel

Votre équipe a maintenant un outil de travail complet :

- **Vue d'ensemble** : tableau de bord avec les indicateurs clés (villas, réservations, clients), l'activité récente, les alertes
- **Gestion des demandes** : chaque demande client arrive dans une file d'attente, l'équipe répond, le client est notifié
- **Modération des avis** : validation des avis avant publication
- **Messagerie** : réponse aux messages clients en temps réel
- **Fiche client complète** : tout voir sur un client en une page (réservations, demandes, avis, préférences)
- **Réservations** : suivi, confirmation, annulation
- **Revenus** : graphiques de chiffre d'affaires
- **Paramètres** : contacts et services de conciergerie modifiables sans code

### Pour vos propriétaires — Un espace dédié

Chaque propriétaire accède à son propre tableau de bord pour suivre ses villas, ses réservations, ses revenus, ses tâches de maintenance et ses statistiques d'occupation.

**Nouveau (14 mai)** : Les propriétaires peuvent connecter leur compte Stripe directement depuis le tableau de bord. Pour les réservations directes sur le site : reversement automatique de **80 % des nuitées** au propriétaire ; Kayvila perçoit **20 % du séjour** plus **100 % des frais de ménage et de service** (facturés au voyageur).

---

## Ce qui a été fait cette semaine (dernière mise à jour : 14 mai)

1. **Espace client** entièrement construit (check-in, services, messagerie, avis, favoris)

2. **Dashboard conciergerie** refondu (interface centralisée, messagerie temps réel, fiches clients)

3. **Espace propriétaire** nettoyé et aligné visuellement

4. **Sécurité** renforcée (RLS, isolation par utilisateur)

5. **Système de paiement complet** :
   - Intégration Stripe avec calcul des frais côté serveur
   - Zod validation sur les routes API
   - Stockage du `payment_intent_id` pour traçabilité
   - **Stripe Connect** : 80 % des nuitées au propriétaire ; Kayvila = 20 % du séjour + ménage + frais de service
   - **Compte client automatique** : création de compte après paiement, réservations liées
   - **UI d'onboarding** : les propriétaires connectent leur compte Stripe depuis leur dashboard

---

## Prochaines étapes possibles

1. **Activation Stripe Connect** dans le dashboard Stripe (à faire)
2. **Migration SQL** des colonnes Stripe Connect à exécuter (à faire)
3. **Assistant IA pour l'équipe** — un chatbot intelligent qui détecte les anomalies et suggère des actions
4. **Mise en ligne** — déploiement sur internet pour un accès public
5. **Dashboard client fonctionnel** — espace client complet (réservations, profil, messagerie, check-in)
6. **Dashboard propriétaire** — vue d'ensemble complète (revenus, réservations, calendrier, maintenance)
