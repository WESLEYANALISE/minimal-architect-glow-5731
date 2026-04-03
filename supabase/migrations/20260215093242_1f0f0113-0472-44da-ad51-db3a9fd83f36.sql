
-- Tabela de comentários do JuriFlix
CREATE TABLE public.juriflix_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  juriflix_id INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.juriflix_comentarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de likes dos comentários
CREATE TABLE public.juriflix_comentarios_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comentario_id UUID NOT NULL REFERENCES public.juriflix_comentarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comentario_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.juriflix_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.juriflix_comentarios_likes ENABLE ROW LEVEL SECURITY;

-- Políticas para comentários
CREATE POLICY "Comentários são visíveis para todos"
ON public.juriflix_comentarios FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem criar comentários"
ON public.juriflix_comentarios FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus próprios comentários"
ON public.juriflix_comentarios FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios comentários"
ON public.juriflix_comentarios FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Políticas para likes
CREATE POLICY "Likes são visíveis para todos"
ON public.juriflix_comentarios_likes FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem dar like"
ON public.juriflix_comentarios_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover seu like"
ON public.juriflix_comentarios_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para atualizar likes_count automaticamente
CREATE OR REPLACE FUNCTION public.update_juriflix_comentario_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.juriflix_comentarios SET likes_count = likes_count + 1 WHERE id = NEW.comentario_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.juriflix_comentarios SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comentario_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trg_juriflix_likes_count
AFTER INSERT OR DELETE ON public.juriflix_comentarios_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_juriflix_comentario_likes_count();

-- Trigger para updated_at
CREATE TRIGGER update_juriflix_comentarios_updated_at
BEFORE UPDATE ON public.juriflix_comentarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
