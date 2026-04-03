
-- Tabela de comentários da Tribuna
CREATE TABLE public.tribuna_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  foto_flickr_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.tribuna_comentarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tribuna_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tribuna comments"
  ON public.tribuna_comentarios FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can insert own tribuna comments"
  ON public.tribuna_comentarios FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tribuna comments"
  ON public.tribuna_comentarios FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tribuna comments"
  ON public.tribuna_comentarios FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_tribuna_comentarios_updated_at
  BEFORE UPDATE ON public.tribuna_comentarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de likes nos comentários
CREATE TABLE public.tribuna_comentarios_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comentario_id UUID NOT NULL REFERENCES public.tribuna_comentarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comentario_id, user_id)
);

ALTER TABLE public.tribuna_comentarios_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tribuna likes"
  ON public.tribuna_comentarios_likes FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can insert own tribuna likes"
  ON public.tribuna_comentarios_likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tribuna likes"
  ON public.tribuna_comentarios_likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Trigger para atualizar likes_count
CREATE OR REPLACE FUNCTION public.update_tribuna_comentario_likes_count()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tribuna_comentarios SET likes_count = likes_count + 1 WHERE id = NEW.comentario_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tribuna_comentarios SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comentario_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER update_tribuna_likes_count
  AFTER INSERT OR DELETE ON public.tribuna_comentarios_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_tribuna_comentario_likes_count();

-- Tabela de favoritos
CREATE TABLE public.tribuna_favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  foto_flickr_id TEXT NOT NULL,
  instituicao_slug TEXT NOT NULL,
  foto_url TEXT,
  foto_titulo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, foto_flickr_id)
);

ALTER TABLE public.tribuna_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tribuna favorites"
  ON public.tribuna_favoritos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tribuna favorites"
  ON public.tribuna_favoritos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tribuna favorites"
  ON public.tribuna_favoritos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_tribuna_comentarios_foto ON public.tribuna_comentarios(foto_flickr_id);
CREATE INDEX idx_tribuna_comentarios_parent ON public.tribuna_comentarios(parent_id);
CREATE INDEX idx_tribuna_favoritos_user ON public.tribuna_favoritos(user_id);
