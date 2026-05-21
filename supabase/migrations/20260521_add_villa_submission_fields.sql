-- Ajout des nouveaux champs pour le formulaire enrichi "Confier ma villa"
ALTER TABLE public.villa_submissions
  ADD COLUMN IF NOT EXISTS surface_terrain text,
  ADD COLUMN IF NOT EXISTS chambres text,
  ADD COLUMN IF NOT EXISTS salles_de_bains text,
  ADD COLUMN IF NOT EXISTS etages text,
  ADD COLUMN IF NOT EXISTS parking_places text,
  ADD COLUMN IF NOT EXISTS parking_securise boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS gardien_existant text,
  ADD COLUMN IF NOT EXISTS delai_souhaite text,
  ADD COLUMN IF NOT EXISTS adresse_postale text;
