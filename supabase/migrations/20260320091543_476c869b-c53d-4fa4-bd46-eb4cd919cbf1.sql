
-- Cache de deputados federais
CREATE TABLE public.deputados_cache (
  id BIGINT PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_civil TEXT,
  sigla_partido TEXT,
  sigla_uf TEXT,
  url_foto TEXT,
  email TEXT,
  situacao TEXT DEFAULT 'Exercício',
  legislatura INT DEFAULT 57,
  cpf TEXT,
  data_nascimento TEXT,
  sexo TEXT,
  uri TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ranking de buscas/acessos de deputados (Em Alta)
CREATE TABLE public.deputados_ranking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deputado_id BIGINT REFERENCES public.deputados_cache(id) ON DELETE CASCADE,
  acessos INT DEFAULT 0,
  periodo TEXT DEFAULT 'semanal',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deputado_id, periodo)
);

-- Rankings de gastos (cota parlamentar)
CREATE TABLE public.deputados_gastos_ranking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deputado_id BIGINT REFERENCES public.deputados_cache(id) ON DELETE CASCADE,
  ano INT NOT NULL,
  mes INT,
  valor_total NUMERIC(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deputado_id, ano, mes)
);

-- RLS
ALTER TABLE public.deputados_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deputados_ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deputados_gastos_ranking ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can read deputados" ON public.deputados_cache FOR SELECT USING (true);
CREATE POLICY "Anyone can read rankings" ON public.deputados_ranking FOR SELECT USING (true);
CREATE POLICY "Anyone can read gastos" ON public.deputados_gastos_ranking FOR SELECT USING (true);
