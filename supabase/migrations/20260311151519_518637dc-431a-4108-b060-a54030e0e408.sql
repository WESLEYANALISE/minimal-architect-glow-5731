-- Tabela de desafios semanais
CREATE TABLE public.desafios_semanais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  tema text,
  pontos integer NOT NULL DEFAULT 100,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date NOT NULL DEFAULT (CURRENT_DATE + interval '7 days'),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de participantes dos desafios
CREATE TABLE public.desafio_participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desafio_id uuid REFERENCES public.desafios_semanais(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  pontuacao integer NOT NULL DEFAULT 0,
  completado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de conquistas dos usuários
CREATE TABLE public.conquistas_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  icone text DEFAULT '🏆',
  conquistado_em timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.desafios_semanais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desafio_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquistas_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read desafios" ON public.desafios_semanais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read participantes" ON public.desafio_participantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own participacao" ON public.desafio_participantes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participacao" ON public.desafio_participantes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can read own conquistas" ON public.conquistas_usuario FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conquistas" ON public.conquistas_usuario FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_desafios_semanais_updated_at
  BEFORE UPDATE ON public.desafios_semanais
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();