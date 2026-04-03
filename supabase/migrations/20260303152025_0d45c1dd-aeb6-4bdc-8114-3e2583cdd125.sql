
-- Tabela de templates de push
CREATE TABLE public.push_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  cor TEXT,
  icone_url TEXT,
  imagem_url TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.push_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar templates" ON public.push_templates
  FOR ALL USING (public.is_admin(auth.uid()));

-- Tabela de push agendados
CREATE TABLE public.push_agendados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  cor TEXT,
  icone_url TEXT,
  imagem_url TEXT,
  link TEXT,
  agendar_para TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  resultado JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.push_agendados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar agendados" ON public.push_agendados
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_push_agendados_updated_at
  BEFORE UPDATE ON public.push_agendados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
