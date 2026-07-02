# Spec — Refonte ergonomique Éditeur Villa (UX/UI v2)

**Date** : 2026-07-02
**Statut** : validé par Kenneson (brainstorming du 2026-07-02)
**Cible** : `components/dashboard/villa-editor/` + les 4 pages hôtes
**Approche retenue** : refonte in-place (approche 1) — la logique d'état, l'autosave et les sous-éditeurs ne bougent pas ; seule la couche présentation est réécrite.

## Constat (rappel du brief)

1. Split layout trop lourd — la preview 280 px à droite mange l'espace sans être utile ; sur mobile elle vit dans un onglet que personne n'utilise.
2. Trop de chrome — 4 systèmes de navigation concurrents (Stepper, ProgressBar, QuickNav, accordéon).
3. Aucune hiérarchie visuelle — le nom de la villa est traité comme `cleaning_fee_cents`.
4. Double personnalité — création en stepper 4 étapes, édition en accordéon 10 sections.
5. Découvert pendant l'exploration : l'éditeur n'est jamais pleine page. Les deux pages hôtes l'enferment dans une colonne 2/3 avec leur propre sidebar 1/3.

## Décisions actées

| # | Question | Décision |
|---|----------|----------|
| 1 | Quand créer la ligne DB en création ? | Mini-form (Bloc 1) → « Créer le brouillon » → villa non publiée en DB → redirection vers l'éditeur unifié |
| 2 | Mapping sections → blocs | Strict existant : zéro nouvelle feature (pas de Tags, pas de section Disponibilités neuve) |
| 3 | Bouton « Aperçu » | Nouvel onglet vers la page publique `/villas/[id]` (`target="_blank"`) |
| 4 | Modèle de sauvegarde | Autosave (moteur inchangé) + point discret + bouton « Terminer » → retour liste. Pas de boutons « Enregistrer » / « Annuler » |
| 5 | Pages hôtes | L'éditeur devient la page ; les sidebars hôtes sont absorbées |
| 6 | Thème | Clair (constaté dans le code des pages hôtes), principes impeccable appliqués |

## Corrections apportées au brief initial (avis skills ui-ux-pro-max + impeccable)

1. **Pas d'auto-fermeture des sections** (le brief demandait « jamais plus de 2 ouvertes »). Fermer une section que l'utilisateur a ouverte viole la prévisibilité et fait sauter le scroll quand une section au-dessus se referme. Les sections sont indépendantes, fermées par défaut ; l'orientation est assurée par le sommaire scrollspy.
2. **Pas de mini-carte d'identité flottante** (redondante avec le Bloc 1 toujours visible). Le sommaire porte en tête miniature photo + nom + badge statut.
3. **Sections plates, pas 10 cartes bordées empilées.** Les sous-éditeurs ont déjà leurs cartes internes → cartes imbriquées interdites. Sections séparées par des filets fins (`border-navy/8`) + espacement généreux entre blocs, serré dans un bloc. Seul le Bloc 3 reçoit un fond légèrement teinté.

## Architecture des composants

### Réécrits

- **`VillaEditorShell.tsx`** — grille desktop `[220px sommaire | 1fr contenu]`. Plus de preview, plus d'onglets mobile Éditer/Aperçu. Sur mobile : dropdown « Aller à… » sticky top à la place du sommaire.
- **`VillaEditor.tsx`** — garde `useReducer` + `villaFormReducer` + autosave (debounce 2,5 s, POST `{villaId, payload}`) tels quels. La sortie JSX passe des `<details>` bruts au composant `EditorSection`. Le mode création (stepper) disparaît du composant : la création est gérée par un mini-form dédié (voir plus bas).

### Nouveaux

- **`EditorSection.tsx`** — wrapper unique de section : icône + titre + badge statut (`empty`/`partial`/`complete`) + phrase d'aide sous le titre + chevron. Ouverture/fermeture animée via `grid-template-rows` (jamais `height`), respecte `prefers-reduced-motion`. Section vide fermée → l'en-tête affiche une phrase d'invite + CTA « Remplir » qui ouvre la section. Variante `static` pour le Bloc 1 (jamais repliable). Attributs ARIA repris de l'existant (`role="region"`, `aria-labelledby`, `aria-expanded`).
- **`EditorSummary.tsx`** — sommaire sticky gauche : en-tête miniature photo + nom + badge statut publication, puis liste des sections groupées par bloc avec pastille d'état (gris = vide, ambre = partiel, or = complet). Section courante surlignée via `IntersectionObserver`. Clic → `scrollIntoView` smooth ; chaque section a un `scroll-margin-top` égal à la hauteur du header sticky. Sur mobile, le même composant se replie en `<select>`/dropdown « Aller à… ».
- **`VillaCreateForm.tsx`** — mini-form de création : nom, localisation, prix/nuit, capacité. Validation Zod (sous-ensemble de `villaFormSchema`). Submit → `POST /api/dashboard/create-villa` (villa non publiée) → `router.push` vers la page d'édition. Remplace le stepper 4 étapes.

### Supprimés

`Stepper.tsx`, `ProgressBar.tsx`, `QuickNav.tsx`, `VillaPreviewCard.tsx`, et les onglets mobile du shell. `sectionCompleteness()` dans `villa-editor-state.ts` est conservé (il alimente les badges du sommaire et des sections).

### Intouchés

Tous les sous-éditeurs (`RoomsEditor`, `SeasonalPricesEditor`, `VillaAmenitiesEditor`, `EmergencyContactsEditor`, `ChipEditor`, `VillaImageManager`, `VillaFormFields`), `villa-editor-state.ts` (reducer + completeness), les routes API, la logique de sauvegarde.

## Header de l'éditeur

Une seule ligne : titre de la villa (`font-display`) à gauche ; à droite le point autosave (pastille minuscule + libellé au survol, remplace l'`AutosaveIndicator` encombrant — en cas d'erreur, le point devient rouge avec bouton « Réessayer »), le bouton « Aperçu » (ouvre `/villas/[id]` dans un nouvel onglet), et le bouton « Terminer » (retour à la liste des villas). Vérifier que la page publique est visible par admin/proprio même si la villa n'est pas publiée (garde serveur existante à contrôler pendant l'implémentation).

## Les 3 blocs

### Bloc 1 — Carte d'identité (jamais repliable, en haut)

Nom, localisation, type de bien ; prix/nuit en grand `font-display` ; capacité, chambres, salles de bain, surface ; photos (la 1ʳᵉ = cover, `VillaImageManager`) ; badge statut publication + tier (lecture seule pour le proprio, éditable admin dans le Bloc 3).

### Bloc 2 — Configuration (repliables, fermées par défaut)

Équipements, Pièces, Tarifs saisonniers, Services, Règles & sécurité, Contacts urgence. Chaque section : icône + titre + badge + phrase d'aide (ex. « Ajoutez les équipements intérieurs pour rassurer les voyageurs »).

La section **iCal** existe pour les deux rôles et son contenu devient `VillaIcalPanel` (le composant réel de la page proprio, qui remplace le stub actuel « Synchronisation iCal disponible. »). Pour le proprio elle est rangée en fin de Bloc 2 ; pour l'admin elle est rangée dans le Bloc 3.

### Bloc 3 — Administration (admin only, fond légèrement teinté)

- iCal (`VillaIcalPanel`, cf. ci-dessus).
- Commission (%) + frais de ménage.
- Propriétaire lié (`owner_id` existant) + statut publication + tier (éditables).
- Satellites rapatriés de la page admin : blocages (`AdminVillaBlocks`), historique des réservations, mini-carte géo (`VillaDetailMiniMap`). Composants existants, juste re-hébergés — zéro nouvelle feature.

## Mode création unifié

Page « Nouvelle villa » (`admin/villas/ajouter` et `dashboard/villas/nouvelle`) = `VillaCreateForm` seul, présenté comme le Bloc 1. Bouton « Créer le brouillon » → création DB non publiée → redirection vers l'éditeur complet où autosave et upload photos fonctionnent immédiatement. Aucun brouillon orphelin involontaire (rien n'est créé tant qu'on ne clique pas).

## Pages hôtes

- **`app/(admin)/admin/villas/[id]/page.tsx`** — devient : back-link + éditeur pleine largeur. La sidebar (checklist publication, mini-carte, historique, lien site) disparaît : la checklist est couverte par les statuts du sommaire, le reste rejoint le Bloc 3.
- **`app/(proprio)/dashboard/villas/[villaId]/page.tsx`** — idem : back-link + éditeur. `VillaIcalPanel` intégré à la section iCal ; les liens « Gérer les photos » / « Gérer les disponibilités » deviennent des liens contextuels dans les sections Photos et iCal (les pages dédiées existantes restent accessibles).

## Traitement visuel (impeccable)

- Zéro side-stripe (ban absolu). Zéro carte imbriquée. Zéro gradient text.
- Or = signal uniquement : badges « complet », statut « publié », CTA principal.
- Chiffres en `font-display` grands ; labels en eyebrow caps (`text-[10px] uppercase tracking-[0.2em]`).
- Asymétrie : texte à gauche, actions à droite. Espacement généreux entre blocs (48–64 px), serré dans un bloc (12–16 px).
- Animations : `transform`/`opacity`/`grid-template-rows` seulement, 150–300 ms, ease-out, `prefers-reduced-motion` respecté.
- Zones tactiles ≥ 44 px ; `inputMode`/types sémantiques (`number`, `email`, `tel`) pour le clavier mobile.
- Validation au blur, erreur sous le champ concerné (cause + comment corriger), focus auto sur le premier champ invalide au submit du mini-form création.

## Hors scope

- Le listing villas (DataGrid).
- La logique interne des sous-éditeurs.
- Les routes API et la logique de sauvegarde.
- Toute nouvelle feature (Tags, section Disponibilités neuve, thème sombre).

## Tests

- `lib/villa-editor-state.test.ts` — inchangé, doit rester vert (l'état ne bouge pas).
- Playwright : (1) parcours création mini-form → brouillon → éditeur ; (2) navigation sommaire (clic → scroll, scrollspy) ; (3) autosave (modification → point « enregistré ») ; (4) sections admin visibles en admin, absentes en proprio ; (5) mobile : dropdown « Aller à… » fonctionne.
- Build Next.js propre + lint avant commit (règle projet).

## Risques connus

- Les pages hôtes sont des Server Components : ne jamais passer de fonctions en props aux composants client (règle dure existante).
- Chemins avec parenthèses `app/(admin)/…` : vérifier l'échappement shell après édition (`find app -iname "*(*"`).
- Apostrophes françaises dans les strings JS : utiliser des double quotes.
