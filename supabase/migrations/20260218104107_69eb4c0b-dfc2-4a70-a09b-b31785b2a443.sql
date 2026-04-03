CREATE TABLE gamificacao_sim_nao_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  materia TEXT NOT NULL,
  nivel INTEGER NOT NULL,
  perguntas JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(materia, nivel)
);
ALTER TABLE gamificacao_sim_nao_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura publica" ON gamificacao_sim_nao_cache FOR SELECT USING (true);