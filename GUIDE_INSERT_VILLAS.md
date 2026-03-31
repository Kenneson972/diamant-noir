# 🏡 Guide : Insérer des Villas dans Supabase

## 📋 Étapes à Suivre

### Étape 1 : Créer un Utilisateur Auth (si pas déjà fait)

1. **Dans Supabase Dashboard** :
   - Allez dans **Authentication** > **Users**
   - Cliquez sur **"Add user"** ou **"Invite user"**
   - Créez un utilisateur avec un email (ex: `admin@diamantnoir.com`)
   - **Copiez l'UUID** de cet utilisateur (il ressemble à : `123e4567-e89b-12d3-a456-426614174000`)

### Étape 2 : Insérer les Villas de Test

1. **Dans Supabase Dashboard** :
   - Allez dans **SQL Editor**
   - Cliquez sur **"New query"**

2. **Ouvrez le fichier** `insert-villas-test.sql` dans ce projet

3. **Remplacez** `'VOTRE_USER_ID'` par l'UUID que vous avez copié à l'étape 1

4. **Exécutez le script** dans le SQL Editor

### Étape 3 : Vérifier l'Insertion

Exécutez cette requête pour voir vos villas :

```sql
SELECT id, name, location, price_per_night, capacity 
FROM public.villas 
ORDER BY created_at DESC;
```

Vous devriez voir 3 villas :
- Villa Diamant Noir
- Villa Horizon
- Villa Émeraude

### Étape 4 : Tester dans l'Application

1. **Ouvrez** `http://127.0.0.1:3000/dashboard/proprio`
2. **Vérifiez** que les villas s'affichent dans la grille
3. **Cliquez** sur une villa pour voir son dashboard

---

## 🔧 Si les Villas n'Apparaissent Pas

### Problème 1 : RLS (Row Level Security) bloque l'accès

**Solution** : Vérifiez que vous êtes connecté avec le même `owner_id` que celui utilisé dans les INSERT.

Pour tester sans auth (temporairement), vous pouvez désactiver RLS :

```sql
-- ⚠️ ATTENTION : À utiliser uniquement en développement
ALTER TABLE public.villas DISABLE ROW LEVEL SECURITY;
```

Puis réactivez-le après :

```sql
ALTER TABLE public.villas ENABLE ROW LEVEL SECURITY;
```

### Problème 2 : Variables d'environnement non configurées

Vérifiez que votre `.env.local` contient :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

### Problème 3 : Erreur dans la console

Ouvrez la console du navigateur (F12) et regardez les erreurs. Les logs Supabase devraient indiquer le problème.

---

## 🎯 Prochaines Étapes

Une fois les villas insérées et visibles :

1. ✅ **Tester l'affichage** dans `/dashboard/proprio`
2. ✅ **Tester le dashboard d'une villa** : `/dashboard/proprio/[villaId]`
3. ✅ **Créer une fonction "Ajouter une Villa"** depuis l'interface
4. ✅ **Ajouter des réservations de test** pour tester le calendrier

---

## 💡 Astuce : Insérer une Villa Sans owner_id (Temporaire)

Si vous voulez tester rapidement sans créer d'utilisateur auth, vous pouvez insérer avec `owner_id = NULL` :

```sql
INSERT INTO public.villas (name, description, price_per_night, capacity, location)
VALUES (
  'Villa Test',
  'Description de test',
  1000,
  8,
  'Le Diamant, Martinique'
);
```

⚠️ **Note** : Les politiques RLS pourraient bloquer la modification de cette villa. Pour la production, utilisez toujours un `owner_id` valide.
