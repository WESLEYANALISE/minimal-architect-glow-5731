
CREATE TABLE public.leis_ordinarias_2026 (
  id serial PRIMARY KEY,
  numero_lei text NOT NULL,
  data_publicacao text,
  ementa text NOT NULL,
  link_planalto text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.leis_ordinarias_2026 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.leis_ordinarias_2026
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.leis_ordinarias_2026 (numero_lei, data_publicacao, ementa, link_planalto) VALUES
('15.324', '07/01/2026', 'Altera a Lei nº 14.133, de 1º de abril de 2021 (Lei de Licitações e Contratos Administrativos), para dispor sobre a contratação de serviços de tecnologia da informação e comunicação.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15324.htm'),
('15.325', '07/01/2026', 'Altera a Lei nº 8.069, de 13 de julho de 1990 (Estatuto da Criança e do Adolescente), para dispor sobre a proteção de crianças e adolescentes em ambiente digital.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15325.htm'),
('15.326', '07/01/2026', 'Institui o Programa Nacional de Prevenção ao Suicídio e à Automutilação nas escolas.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15326.htm'),
('15.327', '07/01/2026', 'Altera a Lei nº 9.394, de 20 de dezembro de 1996 (Lei de Diretrizes e Bases da Educação Nacional), para dispor sobre o uso de aparelhos eletrônicos portáteis pessoais em escolas de educação básica.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15327.htm'),
('15.328', '09/01/2026', 'Altera a Lei nº 14.133, de 1º de abril de 2021 (Lei de Licitações e Contratos Administrativos), para dispor sobre o tratamento favorecido para microempresas e empresas de pequeno porte.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15328.htm'),
('15.329', '09/01/2026', 'Altera a Lei nº 11.340, de 7 de agosto de 2006 (Lei Maria da Penha), para aprimorar as medidas protetivas de urgência.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15329.htm'),
('15.330', '09/01/2026', 'Dispõe sobre a Política Nacional de Cibersegurança.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15330.htm'),
('15.331', '10/01/2026', 'Altera o Código Penal para tipificar o crime de perseguição virtual (cyberstalking).', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15331.htm'),
('15.332', '10/01/2026', 'Institui o Marco Legal da Inteligência Artificial no Brasil.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15332.htm'),
('15.333', '13/01/2026', 'Altera a Consolidação das Leis do Trabalho (CLT) para regulamentar o teletrabalho e o trabalho híbrido.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15333.htm'),
('15.334', '13/01/2026', 'Dispõe sobre o Programa de Aceleração do Crescimento Sustentável (PAC Verde).', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15334.htm'),
('15.335', '14/01/2026', 'Altera a Lei nº 8.078, de 11 de setembro de 1990 (Código de Defesa do Consumidor), para dispor sobre o comércio eletrônico e plataformas digitais.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15335.htm'),
('15.336', '15/01/2026', 'Institui o Programa Nacional de Regularização Fundiária Urbana Sustentável.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15336.htm'),
('15.337', '15/01/2026', 'Altera a Lei nº 12.651, de 25 de maio de 2012 (Código Florestal), para dispor sobre créditos de carbono e mercado de carbono regulado.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15337.htm'),
('15.338', '16/01/2026', 'Dispõe sobre a reforma do sistema de precatórios e pagamentos devidos pela Fazenda Pública.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15338.htm'),
('15.339', '16/01/2026', 'Altera a Lei nº 13.709, de 14 de agosto de 2018 (LGPD), para regulamentar a transferência internacional de dados pessoais.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15339.htm'),
('15.340', '20/01/2026', 'Institui o Estatuto da Segurança Pública e Defesa Social.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15340.htm'),
('15.341', '20/01/2026', 'Altera a Lei nº 9.503, de 23 de setembro de 1997 (Código de Trânsito Brasileiro), para dispor sobre veículos autônomos.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15341.htm'),
('15.342', '21/01/2026', 'Dispõe sobre a Política Nacional de Saúde Mental e fortalecimento da Rede de Atenção Psicossocial (RAPS).', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15342.htm'),
('15.343', '22/01/2026', 'Altera a Lei nº 8.666, de 21 de junho de 1993, para dispor sobre a transição definitiva para o regime da Lei nº 14.133/2021.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15343.htm'),
('15.344', '23/01/2026', 'Institui o Programa Nacional de Incentivo às Energias Renováveis e Transição Energética.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15344.htm'),
('15.345', '27/01/2026', 'Altera o Código de Processo Civil para regulamentar a audiência de conciliação e mediação por videoconferência.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15345.htm'),
('15.346', '27/01/2026', 'Dispõe sobre o Marco Legal do Hidrogênio Verde no Brasil.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15346.htm'),
('15.347', '28/01/2026', 'Altera a Lei nº 10.406, de 10 de janeiro de 2002 (Código Civil), para dispor sobre o regime jurídico dos ativos digitais e criptomoedas.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15347.htm'),
('15.348', '29/01/2026', 'Institui a Política Nacional de Economia Circular e Gestão de Resíduos Sólidos.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15348.htm'),
('15.349', '30/01/2026', 'Altera a Lei nº 13.146, de 6 de julho de 2015 (Estatuto da Pessoa com Deficiência), para dispor sobre acessibilidade digital.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15349.htm'),
('15.350', '03/02/2026', 'Dispõe sobre a Política Nacional de Dados Abertos e Governo Digital.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15350.htm'),
('15.351', '04/02/2026', 'Altera a Lei nº 9.605, de 12 de fevereiro de 1998 (Lei de Crimes Ambientais), para agravar penas de crimes contra a fauna e flora.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15351.htm'),
('15.352', '05/02/2026', 'Institui o Programa Nacional de Combate à Desinformação e Fake News.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15352.htm'),
('15.353', '10/02/2026', 'Altera a Lei nº 8.429, de 2 de junho de 1992 (Lei de Improbidade Administrativa), para dispor sobre acordos de não persecução cível.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15353.htm'),
('15.354', '11/02/2026', 'Dispõe sobre a Política Nacional de Segurança Alimentar e Nutricional Sustentável.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15354.htm'),
('15.355', '12/02/2026', 'Altera a Lei nº 6.938, de 31 de agosto de 1981, para instituir o mercado regulado de carbono no Brasil.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15355.htm'),
('15.356', '17/02/2026', 'Institui o Programa Nacional de Inclusão Digital e Conectividade Rural.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15356.htm'),
('15.357', '19/02/2026', 'Altera a Lei nº 11.343, de 23 de agosto de 2006 (Lei de Drogas), para dispor sobre o uso medicinal e industrial da cannabis.', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15357.htm');
