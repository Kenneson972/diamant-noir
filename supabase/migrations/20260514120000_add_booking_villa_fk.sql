-- Ajout de la clé étrangère bookings.villa_id -> villas.id
-- Permet les selects imbriqués Supabase (villas(id, name, bookings(...)))
-- et améliore l'intégrité référentielle

ALTER TABLE public.bookings
  ADD CONSTRAINT fk_bookings_villa
  FOREIGN KEY (villa_id)
  REFERENCES public.villas(id)
  ON DELETE CASCADE;

-- Index pour les requêtes fréquentes par villa_id
CREATE INDEX IF NOT EXISTS idx_bookings_villa_id ON public.bookings(villa_id);
