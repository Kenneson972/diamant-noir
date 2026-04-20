-- Admin fiche membre : is_admin() + update/insert subscriptions + lecture admin commandes / items / bilans
-- Si RLS est déjà activé sur ces tables, ces politiques s’appliquent. Sinon elles sont enregistrées
-- et prendront effet au moment où RLS sera activé (à faire avec des politiques « user » complètes).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Subscriptions : admin met à jour / crée une ligne
DROP POLICY IF EXISTS "Admins update all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins update all subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins insert subscriptions" ON public.subscriptions;
CREATE POLICY "Admins insert subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (public.is_admin());

-- Lecture admin (complète les politiques « membre » existantes une fois RLS actif)
DROP POLICY IF EXISTS "Admins read all orders" ON public.orders;
CREATE POLICY "Admins read all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins read all order items" ON public.order_items;
CREATE POLICY "Admins read all order items"
  ON public.order_items FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins read all bilan bookings" ON public.bilan_bookings;
CREATE POLICY "Admins read all bilan bookings"
  ON public.bilan_bookings FOR SELECT
  USING (public.is_admin());
