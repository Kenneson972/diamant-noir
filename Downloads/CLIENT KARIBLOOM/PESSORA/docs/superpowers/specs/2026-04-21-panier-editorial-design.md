# Panier éditorial PessÓra — design (v1 + archive phase B)

## Décision produit

| Horizons | Contenu |
|----------|---------|
| **v1 (livraison prévue)** | Panier fonctionnel côté client : ajout depuis la fiche boisson, persistance locale, tiroir panier type Dal Cielo (liste, quantités, total), **sans paiement en ligne**. CTA orienté **passage au bar / contact** (aucun flux Stripe obligatoire dans cette phase). |
| **Phase B (archive / idée — présentation gérant)** | Parcours **commande complète** façon Dal Cielo : créneau, type de service (click & collect / livraison si un jour applicable), envoi vers backend, statuts, éventuellement paiement. **Non inclus dans le périmètre d’implémentation immédiat** ; sert de feuille de route et de discussion métier. |

Référence UX technique inspirée du projet **Dal Cielo** : `useCart` (état + persistance), badge compteur dans le header, tiroir latéral. La **direction artistique** reste celle de Pessora (editorial : filets fins, typo uppercase micro-libellés, palette noir / crème / forêt, animations sobres).

---

## Modèle de données panier (ligne)

Chaque ligne doit être identifiable de façon stable pour fusionner les doublons (même boisson + mêmes options).

- **`productId`**: `string` (slug ou id catalogue — aligné sur `MenuItem.id`).
- **`name`**, **`unitPrice`** (EUR), **`quantity`** (≥ 1).
- **`image`**: URL ou chemin optionnel pour vignette dans le tiroir.
- **`category`**: libellé ou clé de catégorie pour fallback visuel si pas d’image.
- **`options` / personnalisation**: structure sérialisable (ex. lait choisi, liste de boosters, notes courtes) ; la **clé de fusion** = `productId` + hash ou chaîne canonique des options (triée, comme Dal Cielo avec `customizations`).

Le total ligne = `(unitPrice + suppléments options) × quantity` (aligné sur la logique déjà présente sur `DrinkDetail` pour boosters / quantité).

---

## Options d’implémentation (v1)

### 1. Zustand + `persist` (recommandé)

- **Avantages**: même pattern que Dal Cielo, peu de code, persistance `localStorage` native, sélecteurs simples (`getItemCount`, `getTotal`).
- **Inconvénient**: une dépendance npm supplémentaire (`zustand`).

### 2. Context React + `useReducer` + persistance manuelle

- **Avantages**: zéro nouvelle dépendance.
- **Inconvénients**: plus de boilerplate, risque de re-renders si mal découpé.

### 3. État local par page uniquement

- **Rejeté** pour v1 : ne répond pas au besoin header + fiche produit + persistance.

**Recommandation v1:** option **1** (Zustand + persist), avec nom de storage dédié (ex. `pessora-cart`).

---

## Composants et flux UI (v1)

1. **`useCart` / store**  
   Actions : `addLine`, `removeLine`, `setQuantity`, `clear`, `getTotal`, `getItemCount`.  
   Comportement **add** : si même `productId` + même clé d’options → incrémenter `quantity`.

2. **Header**  
   - Remplacer le badge fixe `0` par `getItemCount()`.  
   - Clic sur l’icône panier → ouverture du tiroir (ou navigation si on préfère page dédiée — **recommandation : tiroir**, comme Dal Cielo).  
   - Animation discrète à l’augmentation du compteur (respect `prefers-reduced-motion`).

3. **`DrinkDetail`**  
   - Brancher « Ajouter au panier » : calcule le prix avec quantité + lait + boosters, pousse une ligne dans le store, feedback court (toast ou état bouton ~2s).  
   - Optionnel : événement `window` type `open-cart` pour ouvrir le tiroir après ajout (comme Dal Cielo) — à trancher en implémentation.

4. **`CartDrawer` (nouveau)**  
   - Panneau latéral (Framer Motion + overlay), fond blanc / crème, bordures fines, titres en uppercase tracking.  
   - Liste : vignette ou placeholder, nom, résumé options, stepper quantité, ligne prix, suppression.  
   - Pied : sous-total / total, puis **CTA principal** hors paiement, par exemple :  
     - « Préparer ma venue » / « Voir le récap au bar »  
     - ou lien secondaire **Contact / WhatsApp** avec préremplissage du message listant les lignes (si le métier le valide).  
   - Texte légal / rappel : commande réelle validée sur place si besoin (copy à valider avec le gérant).

5. **Autres points d’entrée**  
   - Cartes menu : **hors v1** sauf si explicitement demandé (réduit le scope) ; priorité fiche détail.

---

## Phase B (archive — discussion gérant)

Documenter pour la réunion sans l’implémenter tout de suite :

- API commandes (ou n8n / backend existant), statuts, créneaux, adresse / retrait.  
- Alignement avec `orders` / `order_items` Supabase côté Pessora si le flux devient tracé en base.  
- Paiement en ligne (Stripe) si pertinent — voir aussi les specs existantes dashboard Stripe.

Cette section sert de **backlog produit** ; aucune exigence technique pour la v1 ci-dessus.

---

## Erreurs et limites

- Panier **local au navigateur** : perte si vidage cache / autre appareil — acceptable en v1 ; mention possible en petit texte dans le tiroir.  
- **Pas de réservation de stock** côté serveur en v1.

---

## Vérification (spec self-review)

- Pas de placeholder TBD sur le choix A/B : **v1 = sans paiement**, **B = future**.  
- Identité des lignes : **productId string + clé options** explicitée.  
- Périmètre : fiche boisson prioritaire ; pas d’élargissement menu grille sans validation.

---

## Prochaine étape

Après validation de ce document : rédiger un **plan d’implémentation** détaillé (fichiers touchés, ordre des PRs, tests manuels) puis développer.
