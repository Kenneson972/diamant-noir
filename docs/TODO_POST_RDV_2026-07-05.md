# Kayvila — Actions post-rdv Richard (5 Juillet 2026)

## 🔴 Stripe Live (priorité absolue)
- [ ] Activer le compte Stripe en mode live (KYC si pas fait)
- [ ] Récupérer `sk_live_*` et `whsec_*` (2 endpoints)
- [ ] DNS kayvila.com → Vercel
- [ ] Mettre les clés live dans Vercel + redéployer
- [ ] Créer les 2 webhooks (votre compte + comptes connectés)
- [ ] Purger les comptes Connect de test en DB
- [ ] Test : 1 résa réelle → checkout → webhook → emails → remboursement

## 🟡 Données (avant live)
- [ ] Mettre les bons emails (Resend, notifications, admin)
- [ ] Retirer les faux clients / fausses données de la DB

## 🟠 UI / Polish
- [ ] Chevauchement texte dashboard admin → section espace client
- [ ] Polish UI général
- [ ] Polish UI espace client
- [ ] Historique revenus proprio → réduire à 1 mois

## 🟢 Contenu
- [ ] Vidéo IA (script → production Higgsfield)

---

*Suite du guide complet dans `docs/stripe-go-live.md`*
