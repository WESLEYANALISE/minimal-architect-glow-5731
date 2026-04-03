
CREATE TABLE public.raio_x_legislativo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resenha_id uuid REFERENCES public.resenha_diaria(id) ON DELETE CASCADE,
  categoria text NOT NULL,
  tipo_alteracao text DEFAULT 'nova',
  lei_afetada text,
  artigos_afetados text[],
  relevancia text DEFAULT 'normal',
  resumo_alteracao text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_raio_x_categoria ON public.raio_x_legislativo(categoria);
CREATE INDEX idx_raio_x_created_at ON public.raio_x_legislativo(created_at DESC);
CREATE INDEX idx_raio_x_resenha_id ON public.raio_x_legislativo(resenha_id);

ALTER TABLE public.raio_x_legislativo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to raio_x_legislativo"
  ON public.raio_x_legislativo
  FOR SELECT
  TO anon, authenticated
  USING (true);
