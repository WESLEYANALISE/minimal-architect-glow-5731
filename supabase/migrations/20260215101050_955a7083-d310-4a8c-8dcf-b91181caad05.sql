
-- Tabela de progresso por nível
CREATE TABLE public.gamificacao_progresso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  materia TEXT NOT NULL,
  nivel INTEGER NOT NULL CHECK (nivel >= 1 AND nivel <= 100),
  estrelas INTEGER NOT NULL DEFAULT 0 CHECK (estrelas >= 0 AND estrelas <= 3),
  palavras_acertadas INTEGER NOT NULL DEFAULT 0,
  palavras_total INTEGER NOT NULL DEFAULT 0,
  concluido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, materia, nivel)
);

-- Tabela de ranking global
CREATE TABLE public.gamificacao_ranking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_estrelas INTEGER NOT NULL DEFAULT 0,
  total_niveis_concluidos INTEGER NOT NULL DEFAULT 0,
  total_palavras_acertadas INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.gamificacao_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamificacao_ranking ENABLE ROW LEVEL SECURITY;

-- Progresso: leitura publica, escrita do proprio usuario
CREATE POLICY "Anyone can read progress" ON public.gamificacao_progresso FOR SELECT USING (true);
CREATE POLICY "Users can insert own progress" ON public.gamificacao_progresso FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.gamificacao_progresso FOR UPDATE USING (auth.uid() = user_id);

-- Ranking: leitura publica, escrita do proprio usuario
CREATE POLICY "Anyone can read ranking" ON public.gamificacao_ranking FOR SELECT USING (true);
CREATE POLICY "Users can insert own ranking" ON public.gamificacao_ranking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ranking" ON public.gamificacao_ranking FOR UPDATE USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_gamificacao_progresso_updated_at
  BEFORE UPDATE ON public.gamificacao_progresso
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gamificacao_ranking_updated_at
  BEFORE UPDATE ON public.gamificacao_ranking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
