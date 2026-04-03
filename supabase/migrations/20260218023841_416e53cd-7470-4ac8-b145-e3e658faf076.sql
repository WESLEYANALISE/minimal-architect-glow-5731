
CREATE TABLE public.videoaulas_favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tabela TEXT NOT NULL,
  video_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  thumbnail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tabela, video_id)
);

ALTER TABLE public.videoaulas_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
ON public.videoaulas_favoritos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON public.videoaulas_favoritos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.videoaulas_favoritos FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_videoaulas_favoritos_user ON public.videoaulas_favoritos(user_id, tabela);
