# Finir la migration i18n (Diamant Noir / Kayvila)

## Contexte

Une demande initiale proposait d'ajouter l'internationalisation avec `next-intl` en partant du principe que le projet n'avait aucun système i18n. Ce n'est pas le cas : le projet dispose déjà d'un système d'i18n maison complet et fonctionnel, adopté sur 15 des 42 fichiers pages/composants concernés :

- `lib/i18n.ts` — dictionnaires de traduction fr/en/es (français par défaut), fonctions `t()` (client), `tServer()` (server component, avec interpolation `{{var}}`), `getServerLocale()` (lit le header `x-dn-locale`).
- `contexts/LocaleContext.tsx` — `LocaleProvider` + hook `useLocale()`, persistance via cookie `dn_locale` + `localStorage`.
- `middleware.ts` — pose déjà le header `x-dn-locale` sur toutes les requêtes à partir du cookie `dn_locale`. Un bloc de code gère un préfixe d'URL `/en` et `/es` (`langPrefixMatch`), mais aucun lien du site ne pointe vers ces préfixes : c'est du code mort, laissé tel quel (hors périmètre).
- Un sélecteur de langue déjà présent dans la `Navbar` (`setLocale`).
- La bascule de langue est un swap client-side (contexte React), **pas** une navigation d'URL — la page courante est donc conservée nativement.

Le vrai besoin n'est donc pas de reconstruire un système i18n, mais de **finir la migration des textes encore en dur** vers ce système existant, sans changer l'architecture.

## Objectif

Éliminer le texte français en dur sur les pages et composants du site vitrine, du tunnel de réservation et de l'espace-client, en le remplaçant par des appels `t()` / `tServer()` alimentés par des clés dans `lib/i18n.ts` (fr/en/es), sans changer l'architecture i18n existante, sans changer le routing/URL, et sans régression visuelle.

## Périmètre

### In scope

- **Site vitrine** : `app/page.tsx` (accueil), `app/villas/[id]/page.tsx`, `app/villas/comparer/page.tsx`, `app/prestations/page.tsx`, `app/prestations/nos-formules/page.tsx`, `app/prestations/services/[slug]/page.tsx`, `app/tarifs/page.tsx`, `app/experience/page.tsx`, et les composants associés (`components/home/`, `components/villas/`, `components/prestations/`, `VillaQuickView`, `VillaGallery`, `VillaReviews`, `VillaInteractions`, `VillaViewTracker`, `VillaLeafletMap`, `VillasMapView`, `VillaFilters`).
- **Tunnel de réservation restant** : `app/book/page.tsx`, `app/success/page.tsx`, `HeroSearchWidget`, `BookingBottomSheet` (le reste du flow — `BookingForm`, `CheckoutView`, `CheckoutPriceSummary`, `AvailabilityCalendar` — est déjà migré).
- **Auth** : `app/login/page.tsx`, `app/register/page.tsx`.
- **Espace-client** (locataire connecté) : les 15 fichiers sous `app/espace-client/*` (shell, profil, réservations, checklist, conciergerie, documents, favoris, livret + livret/print, messagerie, notifications, parrainage, demandes).

### Hors périmètre (explicitement, ne pas migrer)

- Dashboard admin (`app/(admin)/*`) et dashboard propriétaire (`app/(proprio)/*`) — usage interne, équipe Kayvila et propriétaires en Martinique, tous francophones (cf. contexte design du `CLAUDE.md`).
- Pages légales (`cgv`, `terms`, `confidentialite`, `cookies`, `mentions-legales`) — texte juridique, le français fait foi ; une traduction nécessiterait une revue juridique, pas juste une passe de traduction UI.
- Contenu dynamique stocké en base Supabase (descriptions de villas, équipements, règlement intérieur, avis) — pas de colonnes multi-langues dans le schéma actuel ; ce contenu reste français même en mode EN/ES. Chantier séparé si besoin un jour.
- Le routing par préfixe d'URL (`/en`, `/es`) dans `middleware.ts` — code mort, non utilisé, non touché.
- Le SEO multilingue (hreflang, alternates par langue) — l'URL ne change pas selon la langue, donc pas de changement metadata nécessaire.

## Méthode d'exécution

**Migration séquentielle par groupe**, dans cet ordre :

1. Accueil (`app/page.tsx` + `components/home/`) — remarque : les clés `home.*` existent déjà dans `lib/i18n.ts` mais ne sont pas câblées ; ce groupe est surtout du branchage, peu de création de clés.
2. Villas (détail, comparateur, composants villa)
3. Prestations (page + sous-pages + composants)
4. Réservation restante (book, success, widgets)
5. Auth (login, register)
6. Espace-client (le plus gros bloc — probablement scindé en deux sous-passes : shell/profil/réservations d'abord, puis conciergerie/documents/messagerie/notifications/parrainage/checklist/livret/demandes/favoris ensuite)

Chaque groupe = un pass de migration + une vérification visuelle avant de passer au suivant. Pas de parallélisation multi-agents sur cette tâche : tous les groupes touchent potentiellement le même fichier partagé `lib/i18n.ts`, et des agents concurrents dessus créeraient des conflits de fusion. Un seul flux de travail à la fois.

## Méthode d'audit par fichier

Pour chaque fichier du groupe en cours :

1. Repérer le texte en dur : chaînes JSX visibles, mais aussi `placeholder`, messages d'erreur/validation, `alt=`, `aria-label`, `title=`, texte dans les `toast`/notifications.
2. Pour chaque texte trouvé, chercher si une clé équivalente existe déjà dans `lib/i18n.ts` (namespaces existants : `nav.`, `footer.`, `common.`, `villas.`, `villa.`, `checkout.`, `booking.`, `faq.`, `contact.`, `home.`, `submit.`, `client.`, `services.`, `about.`, `prestations.`). Réutiliser une clé existante plutôt que d'en dupliquer une nouvelle avec le même sens.
3. Sinon, créer la clé dans les 3 blocs (`fr`, `en`, `es`) de `lib/i18n.ts`, dans le namespace le plus proche sémantiquement (nouveau namespace `espace.*` à introduire pour les pages de l'espace-client pas encore couvertes).
4. Remplacer le texte en dur par `t("clé")` (composant client, via `useLocale()`) ou `tServer(locale, "clé")` (server component, via `getServerLocale(headers())`), en suivant le pattern déjà utilisé dans les fichiers migrés (ex. `app/faq/page.tsx`, `components/layout/Navbar.tsx`).
5. Pour les textes avec variable (ex. nombre de nuits, nom de villa), utiliser l'interpolation `{{var}}` déjà supportée par `tServer`.

## Vérification anti-régression

Après chaque groupe migré :

- Lancer le dev server (port 3001, ne jamais lancer `npm run build` — cf. règle projet existante).
- Parcourir les pages du groupe dans les 3 langues via le sélecteur de la Navbar.
- Vérifier qu'aucun layout ne casse avec des traductions plus longues (anglais/espagnol) — attention particulière aux boutons, badges de filtre, labels courts.
- Vérifier qu'aucun texte français ne subsiste dans les fichiers du groupe (hors zones volontairement hors périmètre : contenu Supabase, pages légales).
- Vérifier que la navigation entre pages conserve la langue choisie (déjà garanti par le cookie + contexte, à confirmer en pratique).

## Definition of done

- Les 12 pages/groupes de composants du site vitrine + réservation + auth listés en périmètre n'ont plus de texte UI statique en dur.
- Les 15 fichiers de l'espace-client n'ont plus de texte UI statique en dur.
- `lib/i18n.ts` contient une clé fr/en/es pour chaque texte migré, sans doublon sémantique.
- Aucune régression visuelle constatée en dev sur les 3 langues, sur les pages migrées.
- Admin, proprio, pages légales et contenu Supabase restent inchangés et en français.
