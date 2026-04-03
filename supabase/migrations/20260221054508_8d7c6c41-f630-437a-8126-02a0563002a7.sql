
-- Tabela de monitoramento de tokens
CREATE TABLE public.api_token_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  edge_function text NOT NULL,
  model text,
  provider text DEFAULT 'gemini',
  tipo_conteudo text DEFAULT 'texto',
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  total_tokens integer GENERATED ALWAYS AS (COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0)) STORED,
  custo_estimado_brl numeric(10,6) DEFAULT 0,
  api_key_index integer,
  sucesso boolean DEFAULT true,
  erro text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Índices para queries rápidas
CREATE INDEX idx_token_usage_created_at ON public.api_token_usage (created_at DESC);
CREATE INDEX idx_token_usage_edge_function ON public.api_token_usage (edge_function);
CREATE INDEX idx_token_usage_user_id ON public.api_token_usage (user_id);
CREATE INDEX idx_token_usage_provider ON public.api_token_usage (provider);

-- RLS
ALTER TABLE public.api_token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ler token usage"
  ON public.api_token_usage FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role pode inserir token usage"
  ON public.api_token_usage FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Função para inserção via service role (usada pela edge function)
CREATE OR REPLACE FUNCTION public.registrar_uso_token(
  p_edge_function text,
  p_model text DEFAULT NULL,
  p_provider text DEFAULT 'gemini',
  p_tipo_conteudo text DEFAULT 'texto',
  p_input_tokens integer DEFAULT 0,
  p_output_tokens integer DEFAULT 0,
  p_custo_estimado_brl numeric DEFAULT 0,
  p_user_id uuid DEFAULT NULL,
  p_api_key_index integer DEFAULT NULL,
  p_sucesso boolean DEFAULT true,
  p_erro text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.api_token_usage (
    edge_function, model, provider, tipo_conteudo,
    input_tokens, output_tokens, custo_estimado_brl,
    user_id, api_key_index, sucesso, erro, metadata
  ) VALUES (
    p_edge_function, p_model, p_provider, p_tipo_conteudo,
    p_input_tokens, p_output_tokens, p_custo_estimado_brl,
    p_user_id, p_api_key_index, p_sucesso, p_erro, p_metadata
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;
