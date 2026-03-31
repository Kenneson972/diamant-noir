# 🔑 Guide : Récupérer les Clés Supabase

## 📍 Où Trouver les Variables dans Supabase

### Étape 1 : Accéder aux Settings API

1. **Connecte-toi** à [supabase.com](https://supabase.com)
2. **Sélectionne ton projet** "Diamant Noir" (ou le nom que tu as donné)
3. Dans le menu de gauche, clique sur **"Settings"** (⚙️)
4. Puis clique sur **"API"** dans le sous-menu

### Étape 2 : Récupérer les 3 Clés Nécessaires

Tu vas voir plusieurs sections :

#### ✅ 1. Project URL (NEXT_PUBLIC_SUPABASE_URL)
- **Où** : Section "Project URL" en haut de la page
- **Format** : `https://xxxxxxxxxxxxx.supabase.co`
- **Exemple** : `https://abcdefghijklmnop.supabase.co`
- **Copie cette URL complète**

#### ✅ 2. anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- **Où** : Section "Project API keys"
- **Cherche** : La clé avec le label **"anon"** ou **"public"**
- **Format** : Une très longue chaîne qui commence souvent par `eyJ...`
- **⚠️ C'est la clé publique, elle peut être exposée dans le code client**

#### ✅ 3. service_role key (SUPABASE_SERVICE_ROLE_KEY)
- **Où** : Même section "Project API keys"
- **Cherche** : La clé avec le label **"service_role"**
- **Format** : Une très longue chaîne qui commence souvent par `eyJ...`
- **⚠️ SECRET : Ne JAMAIS exposer cette clé dans le code client !**
- **⚠️ Clique sur "Reveal" pour la voir** (elle est masquée par défaut)

---

## 📝 Créer le Fichier .env.local

### Étape 1 : Créer le Fichier

1. **Dans ton éditeur** (Cursor), va à la racine du projet `diamant-noir/`
2. **Crée un nouveau fichier** nommé `.env.local`
3. **⚠️ Important** : Le fichier doit commencer par un point (`.env.local`)

### Étape 2 : Ajouter les Variables

Colle ce template et remplace les valeurs :

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Exemple concret** :
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abc123def456...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xyz789uvw012...
```

---

## 🎯 Vérification Visuelle dans Supabase

Quand tu es dans **Settings > API**, tu devrais voir quelque chose comme ça :

```
┌─────────────────────────────────────┐
│ Project URL                         │
│ https://xxxxx.supabase.co           │ ← Copie ça
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Project API keys                    │
│                                     │
│ anon / public                       │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6...    │ ← Copie ça
│ [Copy]                              │
│                                     │
│ service_role                        │
│ ••••••••••••••••••••••••••••••••   │ ← Clique "Reveal" puis copie
│ [Reveal] [Copy]                     │
└─────────────────────────────────────┘
```

---

## ✅ Après Avoir Créé .env.local

1. **Sauvegarde le fichier** `.env.local`
2. **Redémarre le serveur Next.js** :
   ```bash
   # Arrête le serveur (Ctrl+C dans le terminal)
   # Puis relance :
   npm run dev
   ```
3. **Teste** : Va sur `http://127.0.0.1:3000/dashboard/proprio`
4. **Vérifie** : Les villas devraient maintenant s'afficher depuis Supabase !

---

## 🐛 Si ça ne Fonctionne Pas

### Erreur : "Cannot find module"
- Vérifie que le fichier s'appelle bien `.env.local` (avec le point au début)
- Vérifie qu'il est à la racine de `diamant-noir/` (pas dans un sous-dossier)

### Erreur : "Supabase is not configured"
- Vérifie que tu as bien redémarré le serveur après avoir créé `.env.local`
- Vérifie que les noms des variables sont exacts (copie-colle depuis ce guide)
- Vérifie qu'il n'y a pas d'espaces avant/après les `=` dans `.env.local`

### Les villas ne s'affichent toujours pas
- Ouvre la console du navigateur (F12)
- Regarde s'il y a des erreurs
- Vérifie que tu as bien inséré des villas dans Supabase (script `insert-villas-test.sql`)

---

## 📸 Capture d'Écran de Référence

Dans Supabase Dashboard, tu devrais voir :

**Settings > API** :
- **Project URL** : En haut de la page
- **anon key** : Dans "Project API keys", première clé
- **service_role key** : Dans "Project API keys", deuxième clé (clique "Reveal")

---

## 💡 Astuce

Si tu as plusieurs projets Supabase, assure-toi d'être sur le bon projet avant de copier les clés !
