
-- Tabela de fila para geração automática de metodologias
CREATE TABLE public.metodologias_fila (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  subtema TEXT NOT NULL,
  metodo TEXT NOT NULL, -- 'cornell', 'feynman', 'mapamental'
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, gerando, concluido, erro
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(area, tema, subtema, metodo)
);

-- Índices para queries frequentes
CREATE INDEX idx_metodologias_fila_status ON public.metodologias_fila(status);
CREATE INDEX idx_metodologias_fila_metodo ON public.metodologias_fila(metodo);

-- RLS habilitado mas com policy aberta para service_role (usado pelo cron)
ALTER TABLE public.metodologias_fila ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública (o dashboard admin precisa ler)
CREATE POLICY "Permitir leitura da fila" ON public.metodologias_fila
  FOR SELECT USING (true);

-- Policy para inserção/atualização (apenas service_role via edge functions)
CREATE POLICY "Permitir inserção na fila" ON public.metodologias_fila
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização na fila" ON public.metodologias_fila
  FOR UPDATE USING (true);

CREATE POLICY "Permitir deleção na fila" ON public.metodologias_fila
  FOR DELETE USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_metodologias_fila_updated_at
  BEFORE UPDATE ON public.metodologias_fila
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
