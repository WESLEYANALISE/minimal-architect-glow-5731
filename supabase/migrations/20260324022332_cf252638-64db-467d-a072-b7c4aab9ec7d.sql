
-- Add area_conteudo column to faculdade_disciplinas
ALTER TABLE public.faculdade_disciplinas ADD COLUMN IF NOT EXISTS area_conteudo TEXT;

-- Populate mapping based on discipline names
-- Order matters: more specific patterns first

-- Processual Civil (before generic Civil)
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Processual Civil' WHERE area_conteudo IS NULL AND (nome ILIKE '%Processual Civil%' OR nome ILIKE '%Processo Civil%');

-- Processual Penal (before generic Penal)
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Processual Penal' WHERE area_conteudo IS NULL AND (nome ILIKE '%Processual Penal%' OR nome ILIKE '%Processo Penal%');

-- Processual do Trabalho
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Processual do Trabalho' WHERE area_conteudo IS NULL AND (nome ILIKE '%Processual%Trabalho%' OR nome ILIKE '%Processo%Trabalho%');

-- Direito Civil
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Civil' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Civil%' OR nome ILIKE '%Obrigaç%' OR nome ILIKE '%Contrato%' 
  OR nome ILIKE '%Família%' OR nome ILIKE '%Sucessõ%' OR nome ILIKE '%Sucessoe%'
  OR nome ILIKE '%Reais%' OR nome ILIKE '%Romano%' OR nome ILIKE '%Privado%'
  OR nome ILIKE '%Responsabilidade%'
);

-- Direito Penal
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Penal' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Penal%' OR nome ILIKE '%Crime%' OR nome ILIKE '%Criminolog%' 
  OR nome ILIKE '%Punib%' OR nome ILIKE '%Medicina Legal%' OR nome ILIKE '%Execução Penal%'
);

-- Direito Constitucional
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Constitucional' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Constitucional%' OR nome ILIKE '%Estado%' OR nome ILIKE '%Fundamentais%'
);

-- Direito do Trabalho
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito do Trabalho' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Trabalho%' OR nome ILIKE '%Trabalhista%'
);

-- Direito Tributário
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Tributário' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Tributár%' OR nome ILIKE '%Tributar%' OR nome ILIKE '%Tributos%' OR nome ILIKE '%Financeiro%'
);

-- Direito Empresarial
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Empresarial' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Empresarial%' OR nome ILIKE '%Societár%' OR nome ILIKE '%Comercial%' 
  OR nome ILIKE '%Empresa%' OR nome ILIKE '%Falência%' OR nome ILIKE '%Recuperação%'
);

-- Direito Administrativo
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Administrativo' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Administrativo%'
);

-- Direito Ambiental
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Ambiental' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Ambiental%' OR nome ILIKE '%Urbanístico%'
);

-- Direito Internacional
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Internacional' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Internacional%'
);

-- Direitos Humanos
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direitos Humanos' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Humanos%'
);

-- Direito do Consumidor
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito do Consumidor' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Consumidor%' OR nome ILIKE '%Consumo%'
);

-- Direito Previdenciário
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Previdenciário' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Previdenciár%' OR nome ILIKE '%Seguridade%'
);

-- Direito Eleitoral
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Eleitoral' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Eleitoral%'
);

-- Filosofia do Direito
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Filosofia do Direito' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Filosofia%' OR nome ILIKE '%Hermenêutica%' OR nome ILIKE '%Hermeneutica%'
  OR nome ILIKE '%Ética%' OR nome ILIKE '%Etica%' OR nome ILIKE '%Introdução ao Estudo%'
  OR nome ILIKE '%Teoria Geral do Direito' OR nome ILIKE '%Lógica%'
);

-- Direito Agrário / Fundiário
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Agrário' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Agrário%' OR nome ILIKE '%Agrario%'
);

-- Direito Digital / Tecnologia
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Direito Digital' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Digital%' OR nome ILIKE '%Cibernético%' OR nome ILIKE '%Tecnologia%' OR nome ILIKE '%Informática%'
);

-- Formação Complementar (catch-all for non-legal subjects)
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Formação Complementar' WHERE area_conteudo IS NULL AND (
  nome ILIKE '%Economia%' OR nome ILIKE '%Sociologia%' OR nome ILIKE '%Metodologia%'
  OR nome ILIKE '%Ciência Política%' OR nome ILIKE '%Psicologia%' OR nome ILIKE '%Antropologia%'
  OR nome ILIKE '%Língua%' OR nome ILIKE '%Português%' OR nome ILIKE '%História%'
  OR nome ILIKE '%Monografia%' OR nome ILIKE '%TCC%' OR nome ILIKE '%Estágio%'
  OR nome ILIKE '%Prática%' OR nome ILIKE '%Pesquisa%' OR nome ILIKE '%Extensão%'
  OR nome ILIKE '%Atividade%' OR nome ILIKE '%Optativa%' OR nome ILIKE '%Eletiva%'
  OR nome ILIKE '%Seminário%' OR nome ILIKE '%Mediação%' OR nome ILIKE '%Negociação%'
  OR nome ILIKE '%Redação%' OR nome ILIKE '%Argumentação%' OR nome ILIKE '%Retórica%'
  OR nome ILIKE '%Contabilidade%' OR nome ILIKE '%Deontologia%'
);

-- Anything still unmapped gets Formação Complementar
UPDATE public.faculdade_disciplinas SET area_conteudo = 'Formação Complementar' WHERE area_conteudo IS NULL;
