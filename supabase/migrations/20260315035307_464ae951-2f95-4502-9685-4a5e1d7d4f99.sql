
-- Tabela de fila de geração de conteúdo
CREATE TABLE IF NOT EXISTS conteudo_geracao_fila (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  erro_msg TEXT,
  itens_gerados INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Config para pausar/resumir
CREATE TABLE IF NOT EXISTS conteudo_geracao_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  pausado BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO conteudo_geracao_config (id, pausado) VALUES ('main', false)
ON CONFLICT (id) DO NOTHING;

-- Trigger para updated_at
CREATE TRIGGER update_conteudo_geracao_fila_updated_at
  BEFORE UPDATE ON conteudo_geracao_fila
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_conteudo_geracao_config_updated_at
  BEFORE UPDATE ON conteudo_geracao_config
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE conteudo_geracao_fila ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteudo_geracao_config ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (admin controla via frontend)
CREATE POLICY "Allow all for authenticated" ON conteudo_geracao_fila FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON conteudo_geracao_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon select fila" ON conteudo_geracao_fila FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update fila" ON conteudo_geracao_fila FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon select config" ON conteudo_geracao_config FOR SELECT TO anon USING (true);
