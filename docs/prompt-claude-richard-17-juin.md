# Prompt Claude — Kayvila : Retours Richard (17 Juin 2026)

## Contexte

Projet Kayvila (diamant-noir) — plateforme de conciergerie villas de luxe.
Stack : Next.js 14 + InsForge + Stripe Connect + n8n.
Repo : github.com/Kenneson972/diamant-noir (branche main).

Tu travailles dans le repo local, tu push à la fin.

## RÈGLES

- Lis d'abord les fichiers avant de modifier
- Respecte la palette et le design existant
- Mini-commits, un par fonctionnalité
- npm run build doit passer après chaque commit
- Si tu modifies l'admin, vérifie que le dashboard proprio n'est pas cassé

## 1. Header homepage — effet hover lumineux

Sur la homepage UNIQUEMENT, les éléments du header doivent avoir un effet "glow" / illumination au survol.

Ce que je veux : un halo lumineux subtil, élégant, doré (dans la palette Kayvila).

## 2. Carte interactive sur fiche villa

Quand on est sur la page d'une villa, afficher une carte interactive avec la position.
- Les coordonnées (lat, lng) sont déjà dans la table `villas`
- Utiliser Leaflet (gratuit, open-source) — pas Mapbox (payant)
- La carte doit être sobre, élégante, intégrée au design
- Ajouter un marqueur personnalisé

## 3. Espace Admin — Rubrique Documents

Nouvelle page `/admin/documents` :
- Upload de PDF (factures, reporting)
- Association à un propriétaire (liste déroulante)
- Stockage dans un bucket InsForge `documents`
- Table listant les documents avec : nom, propriétaire, date, actions (télécharger, supprimer)

## 4. Espace Proprio — Rubrique Factures & Reporting

Nouvelle section dans le dashboard proprio :
- Onglet ou page "Mes documents"
- Liste des documents que l'admin a uploadés pour CE propriétaire
- Bouton téléchargement
- Rien d'autre — simple et propre

## 5. Admin — Demandes voyageurs (2 améliorations)

Sur la page `/admin/demandes` :
- **a)** Sur chaque demande, afficher "Reçu il y a X minutes / X heures / X jours" (temps relatif depuis `created_at`)
- **b)** Trier la liste de la plus ancienne à la plus récente (ASC par date)
- **c)** À la création d'une demande (webhook ou API), envoyer un accusé de réception automatique au voyageur : "Bonjour, nous avons bien reçu votre demande. Notre équipe revient vers vous très rapidement. L'équipe Kayvila."

L'accusé peut être un email (via Resend) — le plus simple.

## ORDRE

Fais dans cet ordre (du plus simple au plus structurant) :
1. Header hover
2. Demandes voyageurs (temps relatif + tri + accusé)
3. Carte interactive
4. Documents Admin
5. Documents Proprio

## NE PAS TOUCHER

- Le middleware d'auth (il y a un fix P0 à part)
- Les workflows n8n
- Stripe / checkout
- Le dashboard admin principal (sauf ajout menu Documents)
