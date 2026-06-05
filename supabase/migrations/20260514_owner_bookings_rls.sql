-- Permet au propriétaire de voir les réservations de ses villas
-- Le propriétaire est défini par villas.owner_id = auth.uid()

-- Policy SELECT : le propriétaire voit les bookings de ses villas
CREATE POLICY "owner_own_villa_bookings_select" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.villas
      WHERE villas.id = bookings.villa_id
      AND villas.owner_id = auth.uid()
    )
  );

-- Policy UPDATE : le propriétaire peut modifier le statut des bookings de ses villas
CREATE POLICY "owner_own_villa_bookings_update" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.villas
      WHERE villas.id = bookings.villa_id
      AND villas.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.villas
      WHERE villas.id = bookings.villa_id
      AND villas.owner_id = auth.uid()
    )
  );
