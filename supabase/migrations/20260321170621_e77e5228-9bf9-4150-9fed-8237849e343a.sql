-- Add new notification preference columns
ALTER TABLE evelyn_preferencias_notificacao 
  ADD COLUMN IF NOT EXISTS receber_boletim_diario boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS receber_leis_dia boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS receber_livro_dia boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS receber_filme_dia boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS receber_novidades boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS receber_dica_estudo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS receber_jurisprudencia boolean DEFAULT false;

-- Create notifications log table
CREATE TABLE IF NOT EXISTS evelyn_notificacoes_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  telefone text NOT NULL,
  conteudo_resumo text,
  status text NOT NULL DEFAULT 'pendente',
  erro text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE evelyn_notificacoes_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role full access on evelyn_notificacoes_log"
  ON evelyn_notificacoes_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for querying logs
CREATE INDEX IF NOT EXISTS idx_evelyn_notificacoes_log_tipo_created 
  ON evelyn_notificacoes_log(tipo, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evelyn_notificacoes_log_status 
  ON evelyn_notificacoes_log(status);