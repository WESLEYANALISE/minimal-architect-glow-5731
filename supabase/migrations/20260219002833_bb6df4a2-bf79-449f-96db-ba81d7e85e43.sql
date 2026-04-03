
-- Tabela de notificações de novos livros
CREATE TABLE public.atualizacao_biblioteca (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  biblioteca text NOT NULL,
  nome_livro text NOT NULL,
  autor text NOT NULL,
  capa_url text,
  vezes integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atualizacao_biblioteca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler atualizacoes" ON public.atualizacao_biblioteca
  FOR SELECT USING (true);

-- Tabela de controle de visualizações por sessão/usuário
CREATE TABLE public.atualizacao_biblioteca_vistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atualizacao_id bigint NOT NULL REFERENCES public.atualizacao_biblioteca(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  user_id uuid,
  vezes_vista integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(atualizacao_id, session_id)
);

ALTER TABLE public.atualizacao_biblioteca_vistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler vistas" ON public.atualizacao_biblioteca_vistas
  FOR SELECT USING (true);

CREATE POLICY "Todos podem inserir vistas" ON public.atualizacao_biblioteca_vistas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos podem atualizar suas vistas" ON public.atualizacao_biblioteca_vistas
  FOR UPDATE USING (true);
