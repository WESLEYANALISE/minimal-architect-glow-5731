CREATE TABLE public.deputados_favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deputado_id INTEGER NOT NULL,
  deputado_nome TEXT,
  deputado_partido TEXT,
  deputado_uf TEXT,
  deputado_foto TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deputados_favoritos ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_deputados_favoritos_unique ON public.deputados_favoritos(user_id, deputado_id);

CREATE POLICY "Users can view own favorites" ON public.deputados_favoritos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.deputados_favoritos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.deputados_favoritos FOR DELETE USING (auth.uid() = user_id);