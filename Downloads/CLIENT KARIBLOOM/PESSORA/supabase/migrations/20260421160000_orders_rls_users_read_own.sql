-- Commandes : les membres ne doivent lire que leurs lignes (auth.uid() = user_id).
-- Sans politique « user », seule la politique admin peut exister — ou RLS désactivé.
-- Les lignes insérées à la main en test avec ton user_id apparaissent quand même
-- (c’est normal) : à nettoyer en base si ce ne sont pas de vraies commandes.

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;
CREATE POLICY "Users read own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- Les politiques "Admins read all orders" / "Admins read all order items" (migration
-- admin) coexistent : le membre voit ses lignes OU (si admin) tout — la requête
-- client .eq('user_id', id) limite toujours l’affichage à l’utilisateur courant.
