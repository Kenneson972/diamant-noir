# 💬 Chatbot Diamant Noir - Configuration

Le chatbot Diamant Noir est maintenant intégré dans l'application. Il suit la même logique que le chatbot Karibloom (Élise).

## 🚀 Fonctionnalités

- **FAB (Floating Action Button)** : Bouton flottant en bas à droite pour ouvrir le chat
- **Interface de chat moderne** : Design premium adapté au style Diamant Noir
- **Suggestions rapides** : Boutons contextuels pour accélérer les interactions
- **Sélecteur d'émojis** : Pour enrichir les messages
- **Gestion de session** : Persistance via localStorage
- **Mode plein écran** : Sur desktop, possibilité d'agrandir la fenêtre
- **Responsive** : Optimisé pour mobile et desktop

## ⚙️ Configuration

### 1. Mode Démo (Sans Webhook)

Par défaut, le chatbot fonctionne en mode démo avec des réponses automatiques. Aucune configuration n'est nécessaire pour tester l'interface.

### 2. Mode Production (Avec Webhook n8n)

Pour activer les réponses IA réelles, configurez un webhook n8n (ou autre service IA).

#### Variables d'Environnement

Ajoutez dans votre `.env.local` :

```bash
# Option 1 : Webhook n8n (recommandé)
N8N_WEBHOOK_URL=https://votre-n8n.com/webhook/diamant-noir

# Option 2 : Autre service IA
CHAT_WEBHOOK_URL=https://votre-service-ia.com/api/chat
```

#### Format du Payload

Le chatbot envoie ce payload au webhook :

```json
{
  "message": "Quelles sont vos villas disponibles ?",
  "sessionid": "session-1234567890-abc123",
  "timestamp": "2026-01-24T19:00:00.000Z",
  "source": "web"
}
```

#### Format de Réponse Attendu

Le webhook doit retourner :

```json
{
  "response": "Nous avons 3 villas d'exception disponibles...",
  "sessionid": "session-1234567890-abc123"
}
```

**Ou** toute autre clé parmi : `elise_response`, `message`, `output`, `text`, `reply`, `answer`

## 🎨 Personnalisation

### Suggestions Rapides

Modifiez les suggestions dans `components/chatbot/Chatbot.tsx` :

```typescript
const QUICK_SUGGESTIONS = {
  default: [
    "Vos suggestions personnalisées ici",
  ],
  // ...
};
```

### Message de Bienvenue

Modifiez le message de bienvenue dans le `useEffect` initial du composant.

### Style

Le chatbot utilise les classes Tailwind du design system Diamant Noir :
- `bg-navy` : Fond sombre
- `bg-gold` : Accents dorés
- `bg-offwhite` : Fond clair

## 📱 Utilisation

### Ouvrir le Chatbot

1. **Via le FAB** : Cliquez sur le bouton flottant en bas à droite
2. **Via JavaScript** : `window.dispatchEvent(new CustomEvent('openChatbot'))`

### Intégration dans d'autres Pages

Le chatbot est déjà intégré dans le layout global, donc disponible sur toutes les pages.

Pour ouvrir le chatbot depuis n'importe quelle page :

```typescript
window.dispatchEvent(new CustomEvent('openChatbot'));
```

## 🔧 API Route

L'API route `/api/chat` gère :
- ✅ Rate limiting (50 requêtes/heure par IP)
- ✅ Gestion de session
- ✅ Appel au webhook
- ✅ Gestion d'erreurs
- ✅ Mode démo si pas de webhook configuré

## 🐛 Debug

Les logs sont disponibles dans la console du navigateur :
- `📤 [Chatbot] Envoi du message`
- `📥 [Chatbot] Réponse reçue`
- `❌ [Chatbot] Erreur`

## 📝 Notes

- Le chatbot fonctionne en mode démo par défaut (pas besoin de webhook pour tester)
- Les sessions sont stockées dans `localStorage` avec la clé `diamant_noir_session_id`
- Le rate limiting est basique (en production, utiliser Redis/Upstash)
