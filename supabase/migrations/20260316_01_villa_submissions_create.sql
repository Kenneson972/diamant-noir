-- Créer la table villa_submissions si elle n'existe pas (formulaire "Devenir propriétaire")
CREATE TABLE IF NOT EXISTS public.villa_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  villa_name text,
  villa_location text,
  villa_description text,
  airbnb_url text,
  no_photos boolean DEFAULT false,
  message text,
  status text DEFAULT 'pending',
  kanban_order integer DEFAULT 0,
  has_photos boolean DEFAULT true,
  visit_date date,
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- RLS : l'API utilise supabaseAdmin() (service_role) pour l'insert depuis le formulaire public
ALTER TABLE public.villa_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "villa_submissions_auth" ON public.villa_submissions;
CREATE POLICY "villa_submissions_auth" ON public.villa_submissions
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
