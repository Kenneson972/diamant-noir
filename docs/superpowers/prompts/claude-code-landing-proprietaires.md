  # Prompt Claude Code — Landing propriétaires « Diamant Noir »

  > **Usage** : coller le bloc **« PROMPT À COPIER »** dans Claude Code (workflow Superpowers). Adapter les chemins si ton clone du repo diffère.

  ---

  ## Contexte produit (à lire avant d’exécuter)

  - **Marque** : Diamant Noir — conciergerie / location haut de gamme en Martinique.
  - **Objectif** : une **page dédiée propriétaires** (pas seulement une ancre sur l’accueil) pour les visiteurs qui cliquent sur **« Confier ma villa »**. La conversion prioritaire est la **soumission de bien** (lead proprio), pas la réservation voyageur.
  - **URL cible recommandée** : `app/proprietaires/page.tsx` → route publique **`/proprietaires`** (SEO clair, partageable).
  - **Pages déjà en place** (ne pas les casser) :
    - **Formulaire soumission** : `/soumettre-ma-villa` — `app/soumettre-ma-villa/page.tsx`, API `POST /api/villa-submissions`.
    - **Espace existant** : `/login?redirect=/dashboard/proprio`.
    - **Accueil** : `/` avec hero duo voyageurs / propriétaires ; aujourd’hui « Confier ma villa » pointe vers `#proprietaires` sur la même page.

  ---

  ## PROMPT À COPIER (Claude Code)

  ```
  Tu travailles sur le projet Next.js 15 (App Router) « diamant-noir » (Diamant Noir).

  ## Mission
  Créer une landing page **100 % orientée propriétaires** à l’URL `/proprietaires` qui sert d’« index » marketing quand un utilisateur choisit « Confier ma villa ». La **soumission de villa** doit être l’action la plus visible (above the fold + répétée avec discernement).

  ## Exigences fonctionnelles
  1. Nouveau fichier : `app/proprietaires/page.tsx` (Server Component sauf si une petite zone interactive impose « use client »).
  2. **CTA principal** (priorité absolue) : amener vers **`/soumettre-ma-villa`** (libellé du type « Soumettre ma villa », « Rejoindre le programme », « Faire valider mon bien » — ton luxe, français).
  3. **CTA secondaire** : connexion espace propriétaire → **`/login?redirect=/dashboard/proprio`** pour les comptes déjà actifs.
  4. **Sans dupliquer le formulaire** : la page est vitrine + preuves + processus ; le formulaire reste sur `/soumettre-ma-villa` (liens/boutons clairs).
  5. **Mise à jour des liens « Confier ma villa »** sur l’accueil : dans `app/page.tsx`, remplacer les `href="#proprietaires"` / ancres équivalentes liées au parcours proprio par **`/proprietaires`** (cartes hero, footer de section si besoin). Conserver éventuellement une courte section récap sur `/` ou rediriger le scroll `?pour=proprietaire` vers `/proprietaires` selon la solution la plus propre (documenter le choix en 1 phrase dans le code ou en COMMIT).
  6. **`HomeAudienceScroll`** (`components/home/HomeAudienceScroll.tsx`) : faire en sorte que `pour=proprietaire` (et variantes déjà prévues) mène à **`/proprietaires`** **ou** scroll cohérent — préférer **`router.replace('/proprietaires')` ou lien direct** pour éviter double contenu ; si tu utilises la navigation client, extraire la logique dans un petit composant client ou utiliser `redirect()` côté serveur via `searchParams` sur `page.tsx` racine (choisir une seule approche, simple).
  7. **Navbar** : l’entrée « Propriétaires » (`/?pour=proprietaire`) doit pointer vers **`/proprietaires`** (plus simple pour l’utilisateur).
  8. **SEO** : `metadata` (title, description, openGraph) spécifiques « programme propriétaires / confier sa villa Martinique » dans `app/proprietaires/page.tsx` (ou `layout.tsx` local si tu en crées un).
  9. **Sitemap** : ajouter `/proprietaires` dans `app/sitemap.ts` avec une priorité cohérente (≥ à `/soumettre-ma-villa`).
  10. **Accessibilité** : hiérarchie titres, contrastes, focus visible, CTA avec libellés explicites (pas de bouton « Cliquez ici » générique).

  ## Exigences UI / marque
  - Réutiliser les patterns existants : `bg-offwhite`, `text-navy`, or / `gold`, `font-display`, espacements type `page-px` / `px-6` déjà utilisés sur le site.
  - Esthétique **premium** (pas de template IA générique : éviter les grilles clipart, néons, inters trop futuristes).
  - Mobile-first, touches ≥ 44px sur les CTA.
  - Sections suggérées (ajuste si tu as déjà du contenu réutilisable) :
    - Hero propriétaires + double CTA (soumission prioritaire)
    - « Pourquoi Diamant Noir » (3–4 arguments : visibilité, conciergerie, sérénité, calibrage revenue)
    - Déroulé simple « Comment ça marche » (3–4 étapes jusqu’à la collaboration)
    - Réassurance (discrétion, standards, accompagnement local)
    - Bandeau CTA final vers `/soumettre-ma-villa`
  - Optionnel : lien discret vers `/contact` pour les proprios qui préfèrent le contact humain.

  ## Contraintes techniques
  - Pas de nouvelle dépendance npm sauf justification forte.
  - Pas de données métier en dur invérifiables (éviter des chiffres « inventés » ; préférer formulations qualitatives ou reprendre des éléments déjà présents sur `app/page.tsx` section propriétaires si tu factorises en `components/marketing/` ou `lib/data/`).
  - Si tu factorises du contenu, petit module `lib/proprietaires-landing-copy.ts` ou `data/proprietaires-landing.ts` pour faciliter les edits client.
  - Journalisation projet : append **une entrée** dans `docs/ACTIONS_LOG.md` + une ligne de contexte dans `docs/logs/YYYY-MM-DD.md` (date du jour), conformément aux règles du repo.

  ## Vérification avant de conclure
  - `npm run lint` sur les fichiers touchés.
  - Parcours manuel : depuis `/`, clic « Confier ma villa » → arrive sur `/proprietaires` → CTA → `/soumettre-ma-villa`.
  - Pas de régression sur `/` (hero voyageur + barre de recherche intacts).

  Livre le diff minimal mais complet ; explique en 3 bullets les choix de navigation (`?pour=` vs redirect).
  ```

  ---

  ## Notes pour toi (hors prompt)

  - Après implémentation, tu pourras **réduire** ou **fusionner** la section `#proprietaires` de l’accueil pour éviter la redondance (optionnel, dans une 2ᵉ passe).
  - Si tu utilises **Superpowers**, enchaîne avec une spec courte dans `docs/superpowers/specs/` si ton workflow l’exige.
