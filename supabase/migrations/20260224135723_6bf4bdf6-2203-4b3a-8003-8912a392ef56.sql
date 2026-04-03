
-- Tabela de avaliações de filmes e livros do dia
CREATE TABLE public.avaliacoes_recomendacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('filme', 'livro')),
  item_data DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('assistido', 'pretendo_assistir', 'lido', 'pretendo_ler')),
  nota INTEGER CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_avaliacoes_tipo_data ON public.avaliacoes_recomendacoes (tipo, item_data);
CREATE INDEX idx_avaliacoes_user ON public.avaliacoes_recomendacoes (user_id);
CREATE UNIQUE INDEX idx_avaliacoes_unique_user_item ON public.avaliacoes_recomendacoes (user_id, tipo, item_data);

-- RLS
ALTER TABLE public.avaliacoes_recomendacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler avaliacoes"
ON public.avaliacoes_recomendacoes FOR SELECT
USING (true);

CREATE POLICY "Usuarios inserem proprias avaliacoes"
ON public.avaliacoes_recomendacoes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios atualizam proprias avaliacoes"
ON public.avaliacoes_recomendacoes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios deletam proprias avaliacoes"
ON public.avaliacoes_recomendacoes FOR DELETE
USING (auth.uid() = user_id);

-- Coluna imagens_conteudo na tabela dicas_do_dia
ALTER TABLE public.dicas_do_dia ADD COLUMN IF NOT EXISTS imagens_conteudo TEXT[];
