
-- Tabela de preferências de notificação do usuário
CREATE TABLE public.notificacoes_preferencias_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  canal_whatsapp boolean NOT NULL DEFAULT false,
  canal_email boolean NOT NULL DEFAULT false,
  canal_push boolean NOT NULL DEFAULT true,
  receber_boletim_diario boolean NOT NULL DEFAULT true,
  receber_leis_dia boolean NOT NULL DEFAULT true,
  receber_filme_dia boolean NOT NULL DEFAULT false,
  receber_livro_dia boolean NOT NULL DEFAULT false,
  receber_dica_estudo boolean NOT NULL DEFAULT false,
  receber_novidades boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.notificacoes_preferencias_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê suas preferências"
  ON public.notificacoes_preferencias_usuario
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere suas preferências"
  ON public.notificacoes_preferencias_usuario
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza suas preferências"
  ON public.notificacoes_preferencias_usuario
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin pode ler todas (para contagem)
CREATE POLICY "Admin lê todas preferências"
  ON public.notificacoes_preferencias_usuario
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'wn7corporation@gmail.com'
  );

-- Trigger updated_at
CREATE TRIGGER update_notificacoes_prefs_updated_at
  BEFORE UPDATE ON public.notificacoes_preferencias_usuario
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
