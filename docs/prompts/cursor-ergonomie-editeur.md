# Prompt Cursor — Ergonomie éditeur de villa : chips, formulaires structurés, plus de JSON

Tu travailles sur Kayvilla (ex-Diamant Noir). Stack : Next.js 15, TypeScript, Tailwind.

## Objectif

Remplacer les champs texte/JSON de l'éditeur de villa par des **composants ergonomiques** : chip editors, formulaires structurés, boutons interactifs. **Zéro JSON visible par l'utilisateur.**

---

## SECTION 1 — 🛋️ Équipements & Services → Chip Editors

**Fichier :** `components/dashboard/villa-editor/VillaFormFields.tsx`

Remplacer les 5 `<TagsField>` (texte à virgules) par des **chip editors** avec suggestions.

### Composant `ChipEditor`

Créer un composant réutilisable `ChipEditor` :

```tsx
// Props
type ChipEditorProps = {
  id: string;                    // ID unique pour le DOM
  label: string;                 // "Équipements intérieurs"
  items: string[];               // Liste actuelle
  suggestions: string[];         // Suggestions prédéfinies
  onChange: (items: string[]) => void;
};
```

**Comportement :**
- Affiche les suggestions sous forme de chips cliquables (gris si non sélectionné, navy si sélectionné avec ✓)
- Les items sélectionnés apparaissent en chips avec un X pour retirer
- Champ texte + bouton "+" pour ajouter un item personnalisé
- Entrée dans le champ texte → ajoute l'item

### Suggestions par catégorie

Utiliser les suggestions existantes dans `lib/villa-amenities-suggested.ts` et les répartir :

| Catégorie | Suggestions |
|-----------|-------------|
| Intérieur | Wi-Fi, Climatisation, Télévision, Cuisine équipée, Lave-linge, Sèche-linge, Baignoire, Eau chaude, Détecteur de fumée |
| Extérieur | Piscine, Jardin, Terrasse ou balcon, Barbecue, Parking gratuit, Vue mer |
| Services Home | Draps, Serviettes, Ménage fin de séjour, Linges de maison, Produits d'accueil, Lit bébé |
| Services Collection | Concierge dédié, Accueil champagne, Voiturier, Chef à domicile, Massage, Service voiture |
| À la carte | Chef privé, Massage, Location bateau, Babysitter, Visite guidée, Transfert aéroport, Location voiture, Cours de plongée, Petit-déjeuner |

### Remplacer dans VillaFormFields

Les 5 `<TagsField>` deviennent :

```tsx
<ChipEditor
  id="vf-equipment-interior"
  label="Équipements intérieurs"
  items={a(form.equipment_interior)}
  suggestions={INTERIOR_SUGGESTIONS}
  onChange={(items) => { /* stocker dans un ref */ }}
/>
// idem pour les 4 autres
```

---

## SECTION 2 — 📋 Règles & Sécurité → Champs structurés

### 2a. Règles de la maison → ChipEditor

Remplacer le `<TextareaField>` `vf-house-rules` par un **ChipEditor** :

```
Suggestions : Pas de fête, Non-fumeur, Animaux acceptés, Animaux non acceptés,
             Respect du voisinage, Pas de bruit après 22h, Enfants bienvenus,
             Adultes seulement, Check-in autonome
```

### 2b. Infos sécurité → ChipEditor

Remplacer `<TextareaField>` `vf-safety-info` par ChipEditor :

```
Suggestions : Extincteur, Trousse premiers secours, Détecteur de fumée,
             Détecteur CO, Caméra de surveillance, Alarme, Issues de secours,
             Piscine sécurisée, Portail sécurisé
```

### 2c. Politique d'annulation → Select + Textarea

Remplacer le `<TextareaField>` `vf-cancellation-policy` par :

```tsx
<select> // préréglages
  <option value="">Personnalisée</option>
  <option value="strict">Stricte — Remboursement 50% jusqu'à 30 jours</option>
  <option value="moderate">Modérée — Remboursement intégral jusqu'à 14 jours</option>
  <option value="flexible">Flexible — Remboursement intégral jusqu'à 7 jours</option>
  <option value="very_flexible">Très flexible — Remboursement intégral jusqu'à 24h avant</option>
</select>
<textarea> // optionnel, si "Personnalisée" sélectionné
```

### 2d. Conditions de réservation → Champs structurés

Remplacer le `<TextareaField>` JSON `vf-booking-terms` par :

```tsx
<div className="grid gap-4 sm:grid-cols-3">
  <Input label="Acompte (%)" type="number" min="0" max="100" id="vf-deposit-percent" />
  <Input label="Préavis check-in (heures)" type="number" min="0" id="vf-checkin-notice" />
  <Input label="Âge minimum" type="number" min="0" id="vf-min-age" />
</div>
```

### 2e. Contacts urgence → Formulaire répétable

Remplacer le JSON `vf-emergency-contacts` par :

```tsx
// Composant EmergencyContactsEditor
[
  { name: "Pompier", phone: "18" },
  { name: "Samu", phone: "15" },
  // bouton "+ Ajouter un contact"
]
```

Chaque ligne : `[Nom] [Téléphone] [🗑️]`

---

## SECTION 3 — 📍 Localisation & Environs

### 3a. Points d'intérêt → ChipEditor

Remplacer `<TagsField>` `vf-nearby-points` par ChipEditor :

```
Suggestions : Plage, Restaurant, Supermarché, Pharmacie, Hôpital, Aéroport,
             Golf, Randonnée, Marché local, Musée, Centre commercial,
             Station essence, Location voiture, Snack, Boulangerie
```

### 3b. GPS → Bouton "Me localiser"

À côté des champs latitude/longitude, ajouter un bouton :

```tsx
<button onClick={handleGeolocate}
  className="text-xs text-gold hover:underline">
  📍 Me localiser
</button>
```

Au clic → `navigator.geolocation.getCurrentPosition()` → remplit latitude/longitude.

---

## SECTION 4 — 💰 Prix & Conditions

### 4a. Détail des chambres → Formulaire répétable

Remplacer le JSON `vf-rooms-details` par `RoomsEditor` :

```tsx
// Chaque chambre a :
<div className="grid gap-4 sm:grid-cols-3">
  <Input label="Nom" id="room-name-0" placeholder="Chambre 1" />
  <select label="Type de lit">
    <option>King size</option>
    <option>Queen size</option>
    <option>Double</option>
    <option>Simple</option>
    <option>Canapé-lit</option>
  </select>
  <label className="flex items-center gap-2">
    <input type="checkbox" /> Salle de bain privative
  </label>
</div>
// Bouton "+ Ajouter une chambre"
```

### 4b. Prix saisonniers → Formulaire répétable

Remplacer le JSON `vf-seasonal-prices` par `SeasonalPricesEditor` :

```tsx
// Chaque saison a :
<div className="grid gap-4 sm:grid-cols-4">
  <Input label="Saison" placeholder="Haute saison" />
  <Input label="Début (MM-DD)" placeholder="12-01" />
  <Input label="Fin (MM-DD)" placeholder="04-30" />
  <Input label="Prix/nuit (€)" type="number" />
</div>
// Bouton "+ Ajouter une saison"
```

---

## SECTION 5 — Synchronisation handleSave

**Fichier :** `components/dashboard/proprio/VillaEditorForm.tsx`

Adapter le `handleSave` pour :
- Les ChipEditors → joindre avec `,` avant envoi (compatibilité API)
- EmergencyContactsEditor → `JSON.stringify` le tableau `[{name, phone}]`
- RoomsEditor → `JSON.stringify` le tableau de chambres
- SeasonalPricesEditor → `JSON.stringify` le tableau de saisons
- BookingTerms → construire l'objet `{deposit_percent, checkin_notice_hours, min_age}`

---

## RÈGLES

- **Jamais de JSON visible** par l'utilisateur. Tout est structuré en formulaires.
- Les composants doivent être dans `components/dashboard/villa-editor/` :
  - `ChipEditor.tsx`
  - `EmergencyContactsEditor.tsx`
  - `RoomsEditor.tsx`
  - `SeasonalPricesEditor.tsx`
- Le composant `ChipEditor` est réutilisé partout (équipements, règles, sécurité, points d'intérêt)
- Style cohérent : classes Tailwind existantes (gold, navy, muted, rounded-xl, border-navy/5)
- Les données sont stockées côté serveur au même format qu'avant (JSON arrays, strings) pour ne rien casser
- Tester que `handleSave` fonctionne avec les nouveaux composants
- `handleOtaImport` doit aussi remplir les nouveaux champs structurés
