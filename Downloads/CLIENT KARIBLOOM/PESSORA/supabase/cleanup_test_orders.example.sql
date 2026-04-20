-- Exemple : repérer puis supprimer des commandes de test (SQL Editor Supabase).
-- 1) Lister
SELECT id, user_id, total, status, created_at
FROM public.orders
ORDER BY created_at DESC;

-- 2) Supprimer une commande et ses lignes (remplacer les UUID)
-- DELETE FROM public.order_items WHERE order_id = '00000000-0000-0000-0000-000000000000';
-- DELETE FROM public.orders WHERE id = '00000000-0000-0000-0000-000000000000';
