
-- Tabela para rastrear aberturas de modais Premium
CREATE TABLE public.premium_modal_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  modal_type TEXT NOT NULL,
  source_page TEXT NOT NULL,
  source_feature TEXT,
  device TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas no admin
CREATE INDEX idx_premium_modal_views_created_at ON public.premium_modal_views (created_at DESC);
CREATE INDEX idx_premium_modal_views_user_id ON public.premium_modal_views (user_id);

-- RLS
ALTER TABLE public.premium_modal_views ENABLE ROW LEVEL SECURITY;

-- INSERT: qualquer pessoa (auth ou anon) pode inserir
CREATE POLICY "Anyone can insert premium modal views"
  ON public.premium_modal_views
  FOR INSERT
  WITH CHECK (true);

-- SELECT: apenas admin
CREATE POLICY "Only admin can view premium modal views"
  ON public.premium_modal_views
  FOR SELECT
  USING (public.is_admin(auth.uid()));
