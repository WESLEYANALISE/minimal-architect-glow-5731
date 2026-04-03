
-- Tabela de simulados de concursos
CREATE TABLE public.simulados_concursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cargo text,
  banca text,
  ano integer,
  orgao text,
  url_prova text,
  url_gabarito text,
  total_questoes integer DEFAULT 0,
  status text NOT NULL DEFAULT 'rascunho',
  icone text DEFAULT 'Scale',
  cor text DEFAULT '#3b82f6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de questões dos simulados
CREATE TABLE public.simulados_questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulado_id uuid NOT NULL REFERENCES public.simulados_concursos(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  enunciado text NOT NULL,
  alternativa_a text,
  alternativa_b text,
  alternativa_c text,
  alternativa_d text,
  alternativa_e text,
  gabarito text,
  materia text,
  imagem_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_simulados_questoes_simulado_id ON public.simulados_questoes(simulado_id);
CREATE INDEX idx_simulados_concursos_status ON public.simulados_concursos(status);

-- RLS
ALTER TABLE public.simulados_concursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulados_questoes ENABLE ROW LEVEL SECURITY;

-- Leitura pública para usuários resolverem
CREATE POLICY "Leitura pública simulados_concursos"
  ON public.simulados_concursos FOR SELECT
  USING (true);

CREATE POLICY "Leitura pública simulados_questoes"
  ON public.simulados_questoes FOR SELECT
  USING (true);

-- Escrita apenas para admin (verificado via is_admin)
CREATE POLICY "Admin pode inserir simulados_concursos"
  ON public.simulados_concursos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin pode atualizar simulados_concursos"
  ON public.simulados_concursos FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin pode deletar simulados_concursos"
  ON public.simulados_concursos FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin pode inserir simulados_questoes"
  ON public.simulados_questoes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin pode atualizar simulados_questoes"
  ON public.simulados_questoes FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin pode deletar simulados_questoes"
  ON public.simulados_questoes FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_simulados_concursos_updated_at
  BEFORE UPDATE ON public.simulados_concursos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
