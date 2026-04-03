
CREATE TABLE public.explicacoes_artigos_fila (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela_lei text NOT NULL,
  numero_artigo text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'gerando', 'concluido', 'erro')),
  erro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_explicacoes_fila_status ON public.explicacoes_artigos_fila(status);
CREATE INDEX idx_explicacoes_fila_tabela ON public.explicacoes_artigos_fila(tabela_lei);

CREATE TRIGGER update_explicacoes_fila_updated_at
  BEFORE UPDATE ON public.explicacoes_artigos_fila
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE public.explicacoes_artigos_fila ENABLE ROW LEVEL SECURITY;
