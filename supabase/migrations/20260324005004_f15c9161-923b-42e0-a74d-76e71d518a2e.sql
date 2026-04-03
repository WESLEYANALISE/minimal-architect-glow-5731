
-- Create faculdade_universidades table
CREATE TABLE public.faculdade_universidades (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  sigla TEXT NOT NULL,
  logo_url TEXT,
  total_semestres INTEGER NOT NULL DEFAULT 10,
  duracao_anos INTEGER NOT NULL DEFAULT 5,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add universidade_id to faculdade_disciplinas
ALTER TABLE public.faculdade_disciplinas 
ADD COLUMN universidade_id INTEGER REFERENCES public.faculdade_universidades(id);

-- Enable RLS
ALTER TABLE public.faculdade_universidades ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Anyone can read universidades" ON public.faculdade_universidades
FOR SELECT USING (true);

-- Insert 10 universities
INSERT INTO public.faculdade_universidades (nome, nome_completo, sigla, total_semestres, duracao_anos, ativo, ordem) VALUES
('USP', 'Universidade de São Paulo', 'USP', 10, 5, true, 1),
('UNIP', 'Universidade Paulista', 'UNIP', 10, 5, true, 2),
('Anhanguera', 'Universidade Anhanguera', 'ANHANGUERA', 10, 5, true, 3),
('Estácio', 'Universidade Estácio de Sá', 'ESTACIO', 10, 5, false, 4),
('Uninove', 'Universidade Nove de Julho', 'UNINOVE', 10, 5, false, 5),
('Unopar', 'Universidade Norte do Paraná', 'UNOPAR', 10, 5, false, 6),
('PUC-SP', 'Pontifícia Universidade Católica de São Paulo', 'PUCSP', 10, 5, false, 7),
('Mackenzie', 'Universidade Presbiteriana Mackenzie', 'MACKENZIE', 10, 5, false, 8),
('UFMG', 'Universidade Federal de Minas Gerais', 'UFMG', 10, 5, false, 9),
('UERJ', 'Universidade do Estado do Rio de Janeiro', 'UERJ', 10, 5, false, 10);

-- Update existing USP disciplinas
UPDATE public.faculdade_disciplinas SET universidade_id = (SELECT id FROM public.faculdade_universidades WHERE sigla = 'USP');
