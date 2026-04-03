
-- Tabela para 50 Termos Jurídicos com aulas interativas
CREATE TABLE public.termos_juridicos_aulas (
  id serial PRIMARY KEY,
  ordem integer NOT NULL,
  termo text NOT NULL UNIQUE,
  descricao_curta text,
  origem text,
  categoria text,
  estrutura_completa jsonb,
  capa_url text,
  gerado_em timestamptz,
  capa_gerada_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.termos_juridicos_aulas ENABLE ROW LEVEL SECURITY;

-- Todos podem ler
CREATE POLICY "Termos juridicos são públicos para leitura"
ON public.termos_juridicos_aulas FOR SELECT
USING (true);

-- Apenas service role pode inserir/atualizar (via edge functions)
CREATE POLICY "Service role pode gerenciar termos"
ON public.termos_juridicos_aulas FOR ALL
USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'wn7corporation@gmail.com'));

-- Trigger para updated_at
CREATE TRIGGER update_termos_juridicos_updated_at
BEFORE UPDATE ON public.termos_juridicos_aulas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Popular com 50 termos
INSERT INTO public.termos_juridicos_aulas (ordem, termo, descricao_curta, origem, categoria) VALUES
(1, 'Jurisprudência', 'Conjunto de decisões reiteradas dos tribunais sobre determinada matéria', 'Latim', 'Geral'),
(2, 'Habeas Corpus', 'Remédio constitucional que protege a liberdade de locomoção', 'Latim', 'Direito Constitucional'),
(3, 'Mandado de Segurança', 'Ação para proteger direito líquido e certo contra ato de autoridade', 'Português', 'Direito Constitucional'),
(4, 'Homicídio', 'Crime de matar alguém, dolosa ou culposamente', 'Latim', 'Direito Penal'),
(5, 'Dolo', 'Intenção consciente e voluntária de praticar o ato ilícito', 'Latim', 'Direito Penal'),
(6, 'Culpa', 'Conduta negligente, imprudente ou imperita que causa dano', 'Latim', 'Direito Penal'),
(7, 'Litispendência', 'Existência de ação idêntica já em curso no Judiciário', 'Latim', 'Direito Processual Civil'),
(8, 'Coisa Julgada', 'Decisão judicial da qual não cabe mais recurso', 'Português', 'Direito Processual Civil'),
(9, 'Prescrição', 'Perda do direito de ação pelo decurso do tempo', 'Latim', 'Direito Civil'),
(10, 'Decadência', 'Perda do próprio direito material pelo decurso do tempo', 'Latim', 'Direito Civil'),
(11, 'Ação Penal', 'Direito do Estado de punir o autor de uma infração penal', 'Português', 'Direito Penal'),
(12, 'Competência', 'Limite da jurisdição atribuído a cada órgão judicial', 'Latim', 'Direito Processual Civil'),
(13, 'Jurisdição', 'Poder do Estado de dizer o direito e resolver conflitos', 'Latim', 'Direito Processual Civil'),
(14, 'Capacidade Processual', 'Aptidão para estar em juízo e praticar atos processuais', 'Português', 'Direito Processual Civil'),
(15, 'Legitimidade', 'Qualidade de quem pode ser parte em determinado processo', 'Latim', 'Direito Processual Civil'),
(16, 'Contraditório', 'Direito de ser ouvido e de contestar provas e alegações', 'Latim', 'Direito Constitucional'),
(17, 'Ampla Defesa', 'Direito de usar todos os meios legais para se defender', 'Português', 'Direito Constitucional'),
(18, 'Devido Processo Legal', 'Garantia de processo justo com todas as formalidades legais', 'Português', 'Direito Constitucional'),
(19, 'Boa-Fé', 'Princípio de lealdade e confiança nas relações jurídicas', 'Português', 'Direito Civil'),
(20, 'Tutela Antecipada', 'Decisão provisória que antecipa os efeitos da sentença final', 'Português', 'Direito Processual Civil'),
(21, 'Liminar', 'Decisão judicial urgente concedida no início do processo', 'Latim', 'Direito Processual Civil'),
(22, 'Agravo', 'Recurso contra decisões interlocutórias do juiz', 'Português', 'Direito Processual Civil'),
(23, 'Apelação', 'Recurso contra sentença de primeiro grau', 'Latim', 'Direito Processual Civil'),
(24, 'Embargos', 'Recurso para esclarecer obscuridade, contradição ou omissão', 'Português', 'Direito Processual Civil'),
(25, 'Preclusão', 'Perda da faculdade processual por não exercício no prazo', 'Latim', 'Direito Processual Civil'),
(26, 'Revelia', 'Situação do réu que não apresenta defesa no prazo legal', 'Latim', 'Direito Processual Civil'),
(27, 'Ab Initio', 'Desde o início, desde a origem do ato ou fato jurídico', 'Latim', 'Geral'),
(28, 'Ad Hoc', 'Para este fim específico, designado para caso particular', 'Latim', 'Geral'),
(29, 'In Dubio Pro Reo', 'Na dúvida, decide-se em favor do réu', 'Latim', 'Direito Penal'),
(30, 'Erga Omnes', 'Efeito que se aplica a todos, com eficácia geral', 'Latim', 'Direito Constitucional'),
(31, 'Inter Partes', 'Efeito que se aplica apenas às partes do processo', 'Latim', 'Direito Processual Civil'),
(32, 'Pacta Sunt Servanda', 'Os contratos devem ser cumpridos como foram pactuados', 'Latim', 'Direito Civil'),
(33, 'Rebus Sic Stantibus', 'Cláusula de revisão contratual por mudança das circunstâncias', 'Latim', 'Direito Civil'),
(34, 'Lide', 'Conflito de interesses qualificado por uma pretensão resistida', 'Latim', 'Direito Processual Civil'),
(35, 'Petição Inicial', 'Peça que inaugura o processo judicial com o pedido do autor', 'Português', 'Direito Processual Civil'),
(36, 'Sentença', 'Decisão do juiz que resolve o mérito da causa', 'Latim', 'Direito Processual Civil'),
(37, 'Acórdão', 'Decisão colegiada proferida por tribunal', 'Português', 'Direito Processual Civil'),
(38, 'Súmula', 'Enunciado que resume entendimento predominante de um tribunal', 'Latim', 'Geral'),
(39, 'Recurso Extraordinário', 'Recurso ao STF por violação à Constituição Federal', 'Português', 'Direito Constitucional'),
(40, 'Ato Jurídico', 'Ação humana voluntária que produz efeitos jurídicos', 'Português', 'Direito Civil'),
(41, 'Fato Jurídico', 'Acontecimento que gera consequências no mundo do Direito', 'Português', 'Direito Civil'),
(42, 'Negócio Jurídico', 'Declaração de vontade destinada a produzir efeitos jurídicos', 'Português', 'Direito Civil'),
(43, 'Pessoa Jurídica', 'Entidade com personalidade jurídica própria distinta de seus membros', 'Português', 'Direito Civil'),
(44, 'Responsabilidade Civil', 'Obrigação de reparar dano causado a outrem', 'Português', 'Direito Civil'),
(45, 'Dano Moral', 'Lesão aos direitos da personalidade que causa sofrimento', 'Português', 'Direito Civil'),
(46, 'Dano Material', 'Prejuízo econômico efetivo sofrido pela vítima', 'Português', 'Direito Civil'),
(47, 'Tipicidade', 'Adequação da conduta ao tipo penal descrito em lei', 'Português', 'Direito Penal'),
(48, 'Antijuridicidade', 'Contrariedade da conduta ao ordenamento jurídico', 'Português', 'Direito Penal'),
(49, 'Culpabilidade', 'Juízo de reprovação pessoal sobre o autor do fato típico', 'Português', 'Direito Penal'),
(50, 'Imputabilidade', 'Capacidade de compreender o caráter ilícito do fato', 'Português', 'Direito Penal');
