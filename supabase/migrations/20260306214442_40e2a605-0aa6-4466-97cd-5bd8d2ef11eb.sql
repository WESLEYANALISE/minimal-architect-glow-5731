
-- Tabela de casos práticos gerados
CREATE TABLE public.gamificacao_casos_praticos (
  id SERIAL PRIMARY KEY,
  area TEXT NOT NULL DEFAULT 'Direito Penal',
  codigo TEXT NOT NULL DEFAULT 'cp',
  numero_artigo TEXT NOT NULL,
  titulo_artigo TEXT,
  caso_narrativa TEXT,
  questoes JSONB,
  imagem_capa_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  progresso_geracao INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(area, codigo, numero_artigo)
);

-- Tabela de progresso do usuário
CREATE TABLE public.gamificacao_casos_praticos_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  caso_id INT REFERENCES public.gamificacao_casos_praticos(id) ON DELETE CASCADE NOT NULL,
  pontuacao INT NOT NULL DEFAULT 0,
  acertos INT NOT NULL DEFAULT 0,
  total_questoes INT NOT NULL DEFAULT 0,
  concluido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, caso_id)
);

-- RLS
ALTER TABLE public.gamificacao_casos_praticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamificacao_casos_praticos_progresso ENABLE ROW LEVEL SECURITY;

-- Todos podem ler casos gerados
CREATE POLICY "Casos praticos leitura publica" ON public.gamificacao_casos_praticos FOR SELECT USING (true);

-- Service role insere via edge function (anon não insere)
CREATE POLICY "Casos praticos insert service" ON public.gamificacao_casos_praticos FOR INSERT WITH CHECK (true);
CREATE POLICY "Casos praticos update service" ON public.gamificacao_casos_praticos FOR UPDATE USING (true);

-- Progresso: user lê/insere/atualiza próprio
CREATE POLICY "Progresso select own" ON public.gamificacao_casos_praticos_progresso FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Progresso insert own" ON public.gamificacao_casos_praticos_progresso FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Progresso update own" ON public.gamificacao_casos_praticos_progresso FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_gamificacao_casos_praticos_updated_at
  BEFORE UPDATE ON public.gamificacao_casos_praticos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Storage bucket para capas
INSERT INTO storage.buckets (id, name, public) VALUES ('casos-praticos-capas', 'casos-praticos-capas', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: leitura pública
CREATE POLICY "Capas leitura publica" ON storage.objects FOR SELECT USING (bucket_id = 'casos-praticos-capas');
CREATE POLICY "Capas insert service" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'casos-praticos-capas');
