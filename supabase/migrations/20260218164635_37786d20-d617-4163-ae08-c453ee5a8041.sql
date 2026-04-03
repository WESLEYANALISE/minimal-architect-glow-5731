
-- Tabela de avaliações do Juriflix
CREATE TABLE public.juriflix_avaliacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  juriflix_id bigint NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nota integer NOT NULL CHECK (nota >= 1 AND nota <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(juriflix_id, user_id)
);

-- Enable RLS
ALTER TABLE public.juriflix_avaliacoes ENABLE ROW LEVEL SECURITY;

-- Todos podem ler avaliações
CREATE POLICY "Qualquer um pode ler avaliacoes"
ON public.juriflix_avaliacoes FOR SELECT
USING (true);

-- Usuários autenticados podem inserir sua própria avaliação
CREATE POLICY "Usuarios podem inserir sua avaliacao"
ON public.juriflix_avaliacoes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar sua própria avaliação
CREATE POLICY "Usuarios podem atualizar sua avaliacao"
ON public.juriflix_avaliacoes FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar sua própria avaliação
CREATE POLICY "Usuarios podem deletar sua avaliacao"
ON public.juriflix_avaliacoes FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_juriflix_avaliacoes_updated_at
BEFORE UPDATE ON public.juriflix_avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
