
-- Criar tabela para histórico de conversas da Professora
CREATE TABLE public.chat_professora_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,
  user_email TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  mode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas frequentes
CREATE INDEX idx_chat_prof_user_id ON public.chat_professora_historico(user_id);
CREATE INDEX idx_chat_prof_created_at ON public.chat_professora_historico(created_at DESC);
CREATE INDEX idx_chat_prof_role ON public.chat_professora_historico(role);

-- Habilitar RLS
ALTER TABLE public.chat_professora_historico ENABLE ROW LEVEL SECURITY;

-- Política: admin pode ler tudo (service_role já bypassa RLS)
CREATE POLICY "Admin pode ler historico professora"
ON public.chat_professora_historico
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
