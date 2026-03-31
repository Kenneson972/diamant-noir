# ✅ Vérification de la Configuration Supabase

## 🔍 Comment Vérifier que Supabase est Bien Configuré

### Étape 1 : Vérifier les Variables d'Environnement

1. **Créez un fichier `.env.local`** à la racine du projet `diamant-noir/`
2. **Ajoutez ces variables** (récupérées depuis Supabase Dashboard > Settings > API) :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
```

3. **Redémarrez le serveur Next.js** pour que les variables soient chargées :
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   # Puis relancez :
   npm run dev
   ```

### Étape 2 : Tester la Connexion

#### Option A : Via la Console du Navigateur

1. Ouvrez `http://127.0.0.1:3000/dashboard/proprio`
2. Ouvrez la console (F12)
3. Tapez dans la console :
   ```javascript
   // Vérifier que Supabase est chargé
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
   ```

#### Option B : Via le Dashboard

1. Allez sur `/dashboard/proprio`
2. Si les villas s'affichent → ✅ Supabase fonctionne !
3. Si vous voyez "Chargement..." indéfiniment → ❌ Problème de connexion

### Étape 3 : Vérifier les Logs

Dans la console du navigateur, vous devriez voir :
- ✅ `Supabase connected` ou les villas qui se chargent
- ❌ `Error fetching villas:` → Vérifiez vos variables d'environnement

---

## 🐛 Dépannage

### Problème : "Supabase is not configured"

**Cause** : Les variables d'environnement ne sont pas chargées.

**Solution** :
1. Vérifiez que `.env.local` existe à la racine de `diamant-noir/`
2. Vérifiez que les noms des variables sont exacts (copiez-collez depuis `.env.local.example`)
3. **Redémarrez le serveur** après avoir modifié `.env.local`

### Problème : "Error fetching villas" dans la console

**Causes possibles** :
1. **RLS bloque l'accès** : Les politiques de sécurité empêchent la lecture
2. **Mauvaise URL/Clé** : Vérifiez que vous avez copié les bonnes valeurs depuis Supabase
3. **Pas de villas dans la base** : Exécutez le script `insert-villas-test.sql`

**Solution** :
```sql
-- Vérifier que les villas existent
SELECT * FROM public.villas;

-- Si vide, exécutez insert-villas-test.sql
```

### Problème : Les villas ne s'affichent pas mais pas d'erreur

**Cause** : Le code utilise les données mockées (fallback).

**Solution** : Vérifiez que `getSupabaseBrowser()` ne retourne pas `null` :

```typescript
// Dans la console du navigateur
const supabase = getSupabaseBrowser();
console.log('Supabase client:', supabase); // Ne doit pas être null
```

---

## ✅ Checklist de Vérification

- [ ] Fichier `.env.local` créé à la racine du projet
- [ ] Variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` remplies
- [ ] Serveur Next.js redémarré après modification de `.env.local`
- [ ] Au moins une villa insérée dans Supabase (via `insert-villas-test.sql`)
- [ ] Console du navigateur ne montre pas d'erreurs Supabase
- [ ] Les villas s'affichent dans `/dashboard/proprio`

---

## 🧪 Test Rapide

Exécutez cette requête dans le SQL Editor de Supabase pour vérifier que tout est OK :

```sql
-- Vérifier les villas
SELECT 
  id, 
  name, 
  location, 
  price_per_night,
  owner_id,
  created_at
FROM public.villas
ORDER BY created_at DESC;
```

Si cette requête retourne des résultats, Supabase fonctionne ! 🎉
