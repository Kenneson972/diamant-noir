# Login fix + Reviews enrichies

**Date** : 2026-05-26
**Statut** : Implementé

## 1. Login redirect fix

**Fichier** : `app/login/page.tsx`
- Ajout `await new Promise(resolve => setTimeout(resolve, 300))` avant `window.location.href = dest` dans handleLogin et handleSignup
- Laisse les cookies Supabase s'écrire avant redirection → plus de boucle

## 2. Notes par catégorie

**Fichier API** : `app/api/reviews/route.ts`
- Select explicite incluant cleanliness_rating, location_rating, communication_rating, value_rating, checkin_rating
- Join bookings(guest_email) pour lookup profiles

**Fichier UI** : `components/VillaReviews.tsx`
- Interface Review enrichie avec champs catégoriels + full_name + avatar_url
- Barres horizontales façon Airbnb pour chaque catégorie
- ReviewerAvatar avec photo de profil ou initiales fallback

## 3. Prénom du reviewer depuis profiles

- API : lookup profiles par email (via bookings.guest_email)
- Fallback sur guest_name si pas de profil
