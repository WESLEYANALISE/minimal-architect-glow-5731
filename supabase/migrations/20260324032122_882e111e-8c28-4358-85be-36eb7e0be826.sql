
-- Deletar tópicos genéricos da Anhanguera (disciplinas 140-185)
DELETE FROM faculdade_topicos WHERE disciplina_id BETWEEN 140 AND 185;

-- ========== 1º SEMESTRE ==========
-- 140: Cultura Digital
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(140, 'Sociedade da Informação e Transformação Digital', 1),
(140, 'Ferramentas Digitais Aplicadas ao Direito', 2),
(140, 'Pesquisa Jurídica em Bases Digitais', 3),
(140, 'Inclusão Digital e Cidadania', 4),
(140, 'Ética no Ambiente Digital', 5);

-- 141: Fundamentos Históricos e Introdução ao Estudo do Direito
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(141, 'Origem e Evolução do Direito', 1),
(141, 'Fontes do Direito: Lei, Costumes, Jurisprudência e Doutrina', 2),
(141, 'Hermenêutica Jurídica e Interpretação das Normas', 3),
(141, 'Direito Público e Direito Privado', 4),
(141, 'Sistemas Jurídicos: Civil Law e Common Law', 5),
(141, 'Norma Jurídica: Validade, Vigência e Eficácia', 6),
(141, 'Relação Jurídica e Sujeitos de Direito', 7),
(141, 'Direito Natural e Direito Positivo', 8);

-- 142: Psicologia Aplicada ao Direito
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(142, 'Fundamentos da Psicologia Jurídica', 1),
(142, 'Comportamento Humano e o Direito', 2),
(142, 'Psicologia Forense e Perícia', 3),
(142, 'Mediação e Conciliação sob a Ótica Psicológica', 4),
(142, 'Psicologia do Testemunho', 5),
(142, 'Saúde Mental e Imputabilidade', 6);

-- 143: Teoria da Argumentação Jurídica
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(143, 'Lógica Formal e Lógica Jurídica', 1),
(143, 'Retórica e Oratória no Direito', 2),
(143, 'Técnicas de Argumentação e Persuasão', 3),
(143, 'Redação Jurídica e Linguagem Forense', 4),
(143, 'Análise de Peças Processuais', 5),
(143, 'Português Jurídico: Coesão e Coerência', 6);

-- 144: Teoria Geral do Direito Constitucional
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(144, 'Constitucionalismo e Poder Constituinte', 1),
(144, 'Classificação das Constituições', 2),
(144, 'Princípios Fundamentais da CF/88', 3),
(144, 'Direitos e Garantias Fundamentais', 4),
(144, 'Controle de Constitucionalidade', 5),
(144, 'Organização do Estado Brasileiro', 6),
(144, 'Separação dos Poderes', 7);

-- ========== 2º SEMESTRE ==========
-- 145: Direito Civil – Parte Geral
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(145, 'Pessoa Natural: Personalidade e Capacidade', 1),
(145, 'Pessoa Jurídica: Conceito e Classificação', 2),
(145, 'Domicílio Civil', 3),
(145, 'Bens Jurídicos: Classificação', 4),
(145, 'Fatos Jurídicos e Negócio Jurídico', 5),
(145, 'Defeitos do Negócio Jurídico', 6),
(145, 'Invalidade do Negócio Jurídico', 7),
(145, 'Prescrição e Decadência', 8);

-- 146: Direito Individual do Trabalho
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(146, 'Princípios do Direito do Trabalho', 1),
(146, 'Relação de Emprego e Relação de Trabalho', 2),
(146, 'Contrato Individual de Trabalho', 3),
(146, 'Jornada de Trabalho e Intervalos', 4),
(146, 'Remuneração e Salário', 5),
(146, 'Férias e 13º Salário', 6),
(146, 'Rescisão do Contrato de Trabalho', 7),
(146, 'FGTS e Seguro-Desemprego', 8);

-- 147: Teoria Geral do Processo
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(147, 'Conceito e Natureza Jurídica do Processo', 1),
(147, 'Princípios Processuais Constitucionais', 2),
(147, 'Jurisdição e Competência', 3),
(147, 'Ação: Condições e Elementos', 4),
(147, 'Processo e Procedimento', 5),
(147, 'Sujeitos Processuais', 6),
(147, 'Atos Processuais', 7);

-- 148: Teoria Jurídica do Direito Penal
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(148, 'Princípios do Direito Penal', 1),
(148, 'Teoria do Crime: Conceito Analítico', 2),
(148, 'Tipicidade e Ilicitude', 3),
(148, 'Culpabilidade', 4),
(148, 'Iter Criminis e Tentativa', 5),
(148, 'Concurso de Pessoas', 6),
(148, 'Concurso de Crimes', 7),
(148, 'Aplicação da Lei Penal no Tempo e no Espaço', 8);

-- ========== 3º SEMESTRE ==========
-- 149: Direito Civil – Obrigações
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(149, 'Conceito e Classificação das Obrigações', 1),
(149, 'Obrigações de Dar, Fazer e Não Fazer', 2),
(149, 'Transmissão das Obrigações', 3),
(149, 'Adimplemento e Extinção das Obrigações', 4),
(149, 'Inadimplemento e Mora', 5),
(149, 'Perdas e Danos', 6),
(149, 'Cláusula Penal e Arras', 7);

-- 150: Direito Constitucional
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(150, 'Organização dos Poderes: Legislativo', 1),
(150, 'Organização dos Poderes: Executivo', 2),
(150, 'Organização dos Poderes: Judiciário', 3),
(150, 'Funções Essenciais à Justiça', 4),
(150, 'Ordem Econômica e Financeira', 5),
(150, 'Ordem Social', 6),
(150, 'Remédios Constitucionais', 7),
(150, 'Nacionalidade e Direitos Políticos', 8);

-- 151: Direito Penal – Teoria das Penas e Execução Penal
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(151, 'Teoria e Finalidades da Pena', 1),
(151, 'Espécies de Penas: Privativas de Liberdade', 2),
(151, 'Penas Restritivas de Direitos', 3),
(151, 'Pena de Multa', 4),
(151, 'Dosimetria da Pena', 5),
(151, 'Regime de Cumprimento de Pena', 6),
(151, 'Progressão de Regime', 7),
(151, 'Lei de Execução Penal (LEP)', 8),
(151, 'Livramento Condicional', 9);

-- 152: Direito Processual Civil – Conhecimento
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(152, 'Petição Inicial: Requisitos e Emenda', 1),
(152, 'Citação e Intimação', 2),
(152, 'Contestação e Reconvenção', 3),
(152, 'Julgamento Antecipado e Saneamento', 4),
(152, 'Provas no Processo Civil', 5),
(152, 'Audiência de Instrução e Julgamento', 6),
(152, 'Sentença e Coisa Julgada', 7),
(152, 'Processo Judicial Eletrônico', 8);

-- ========== 4º SEMESTRE ==========
-- 153: Direito Ambiental
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(153, 'Princípios do Direito Ambiental', 1),
(153, 'Política Nacional do Meio Ambiente', 2),
(153, 'Licenciamento Ambiental e EIA/RIMA', 3),
(153, 'Responsabilidade Civil Ambiental', 4),
(153, 'Crimes Ambientais (Lei 9.605/98)', 5),
(153, 'Áreas de Preservação Permanente e Reserva Legal', 6),
(153, 'Recursos Hídricos e Legislação', 7);

-- 154: Direito Civil – Contratos
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(154, 'Teoria Geral dos Contratos', 1),
(154, 'Princípios Contratuais: Boa-fé e Função Social', 2),
(154, 'Formação dos Contratos', 3),
(154, 'Classificação dos Contratos', 4),
(154, 'Contratos em Espécie: Compra e Venda', 5),
(154, 'Contratos em Espécie: Locação e Doação', 6),
(154, 'Contratos em Espécie: Prestação de Serviço e Empreitada', 7),
(154, 'Extinção dos Contratos e Resolução por Inadimplemento', 8);

-- 155: Direito Coletivo do Trabalho e Tutelas Coletivas
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(155, 'Organização Sindical no Brasil', 1),
(155, 'Convenção e Acordo Coletivo de Trabalho', 2),
(155, 'Direito de Greve', 3),
(155, 'Negociação Coletiva', 4),
(155, 'Ação Civil Pública Trabalhista', 5),
(155, 'Tutelas Coletivas e Direitos Difusos', 6);

-- 156: Direito Econômico e Financeiro
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(156, 'Ordem Econômica na Constituição', 1),
(156, 'Intervenção do Estado no Domínio Econômico', 2),
(156, 'Direito da Concorrência e Antitruste', 3),
(156, 'Direito Financeiro: Orçamento Público', 4),
(156, 'Lei de Responsabilidade Fiscal', 5),
(156, 'Crédito Público e Dívida Pública', 6);

-- ========== 5º SEMESTRE ==========
-- 157: Direito Penal – Dos Crimes em Espécie
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(157, 'Crimes contra a Pessoa: Homicídio', 1),
(157, 'Crimes contra a Pessoa: Lesão Corporal', 2),
(157, 'Crimes contra o Patrimônio: Furto e Roubo', 3),
(157, 'Crimes contra o Patrimônio: Estelionato e Extorsão', 4),
(157, 'Crimes contra a Dignidade Sexual', 5),
(157, 'Crimes contra a Honra', 6),
(157, 'Crimes contra a Fé Pública', 7),
(157, 'Crimes contra a Administração Pública', 8);

-- 158: Direito Processual Civil – Execução
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(158, 'Teoria Geral da Execução', 1),
(158, 'Títulos Executivos Judiciais e Extrajudiciais', 2),
(158, 'Cumprimento de Sentença', 3),
(158, 'Execução por Quantia Certa', 4),
(158, 'Penhora e Expropriação', 5),
(158, 'Execução de Obrigação de Fazer e Não Fazer', 6),
(158, 'Embargos à Execução', 7);

-- 159: Direito Processual do Trabalho
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(159, 'Organização da Justiça do Trabalho', 1),
(159, 'Dissídios Individuais e Coletivos', 2),
(159, 'Reclamação Trabalhista', 3),
(159, 'Audiência Trabalhista', 4),
(159, 'Provas no Processo do Trabalho', 5),
(159, 'Recursos Trabalhistas', 6),
(159, 'Execução Trabalhista', 7);

-- 160: Filosofia e Sociologia do Direito
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(160, 'Filosofia do Direito: Jusnaturalismo e Positivismo', 1),
(160, 'Justiça e Equidade', 2),
(160, 'Sociologia Jurídica: Direito e Sociedade', 3),
(160, 'Controle Social e Normas Jurídicas', 4),
(160, 'Pluralismo Jurídico', 5),
(160, 'Acesso à Justiça e Movimentos Sociais', 6);

-- ========== 6º SEMESTRE ==========
-- 161: Direito Administrativo – Regime Jurídico Administrativo
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(161, 'Princípios da Administração Pública', 1),
(161, 'Atos Administrativos', 2),
(161, 'Poderes da Administração', 3),
(161, 'Licitações e Contratos Administrativos', 4),
(161, 'Serviços Públicos', 5),
(161, 'Responsabilidade Civil do Estado', 6),
(161, 'Bens Públicos', 7);

-- 162: Direito Civil – Coisas (Direitos Reais)
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(162, 'Posse: Conceito e Classificação', 1),
(162, 'Propriedade: Aquisição e Perda', 2),
(162, 'Função Social da Propriedade', 3),
(162, 'Usucapião', 4),
(162, 'Direitos Reais sobre Coisa Alheia', 5),
(162, 'Penhor, Hipoteca e Anticrese', 6),
(162, 'Condomínio e Incorporação Imobiliária', 7);

-- 163: Direito Empresarial e Societário
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(163, 'Teoria Geral do Direito Empresarial', 1),
(163, 'Empresário Individual e EIRELI', 2),
(163, 'Sociedades Empresárias: Tipos', 3),
(163, 'Sociedade Limitada e Sociedade Anônima', 4),
(163, 'Estabelecimento Empresarial', 5),
(163, 'Propriedade Industrial', 6),
(163, 'Desconsideração da Personalidade Jurídica', 7);

-- 164: Direito Previdenciário
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(164, 'Seguridade Social na Constituição', 1),
(164, 'Regime Geral de Previdência Social', 2),
(164, 'Segurados e Dependentes', 3),
(164, 'Benefícios Previdenciários', 4),
(164, 'Aposentadorias: Tipos e Requisitos', 5),
(164, 'Pensão por Morte e Auxílio-Doença', 6),
(164, 'Custeio da Previdência Social', 7),
(164, 'Reforma da Previdência (EC 103/2019)', 8);

-- 165: Responsabilidade Civil e Direito do Consumidor
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(165, 'Responsabilidade Civil: Pressupostos', 1),
(165, 'Responsabilidade Objetiva e Subjetiva', 2),
(165, 'Dano Material, Moral e Estético', 3),
(165, 'Relação de Consumo', 4),
(165, 'Código de Defesa do Consumidor: Princípios', 5),
(165, 'Responsabilidade pelo Fato e pelo Vício do Produto', 6),
(165, 'Práticas Abusivas e Publicidade Enganosa', 7),
(165, 'Proteção Contratual do Consumidor', 8);

-- ========== 7º SEMESTRE ==========
-- 166: Direito Civil – Família
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(166, 'Casamento: Requisitos e Impedimentos', 1),
(166, 'Regime de Bens', 2),
(166, 'União Estável', 3),
(166, 'Dissolução da Sociedade Conjugal e Divórcio', 4),
(166, 'Parentesco e Filiação', 5),
(166, 'Poder Familiar', 6),
(166, 'Guarda dos Filhos e Alienação Parental', 7),
(166, 'Alimentos', 8),
(166, 'Tutela e Curatela', 9);

-- 167: Direito Processual Civil – Recursos
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(167, 'Teoria Geral dos Recursos', 1),
(167, 'Apelação', 2),
(167, 'Agravo de Instrumento', 3),
(167, 'Embargos de Declaração', 4),
(167, 'Recurso Especial e Recurso Extraordinário', 5),
(167, 'Tutelas de Causas Repetitivas (IRDR)', 6),
(167, 'Incidente de Assunção de Competência', 7);

-- 168: Ética Profissional
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(168, 'Estatuto da Advocacia (Lei 8.906/94)', 1),
(168, 'Código de Ética da OAB', 2),
(168, 'Direitos e Deveres do Advogado', 3),
(168, 'Honorários Advocatícios', 4),
(168, 'Incompatibilidades e Impedimentos', 5),
(168, 'Processo Disciplinar na OAB', 6);

-- 169: Prática Jurídica I
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(169, 'Elaboração de Petição Inicial', 1),
(169, 'Contestação na Prática', 2),
(169, 'Audiência Simulada', 3),
(169, 'Núcleo de Prática Jurídica', 4),
(169, 'Atendimento ao Público', 5);

-- 170: Meios Integrados de Resolução de Conflitos
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(170, 'Mediação: Conceito e Técnicas', 1),
(170, 'Conciliação Judicial e Extrajudicial', 2),
(170, 'Arbitragem (Lei 9.307/96)', 3),
(170, 'Justiça Restaurativa', 4),
(170, 'Negociação e Autocomposição', 5),
(170, 'Sistema Multiportas', 6);

-- ========== 8º SEMESTRE ==========
-- 171: Direito Civil – Sucessões
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(171, 'Abertura da Sucessão e Transmissão da Herança', 1),
(171, 'Sucessão Legítima: Ordem de Vocação Hereditária', 2),
(171, 'Direito de Representação', 3),
(171, 'Sucessão Testamentária: Formas de Testamento', 4),
(171, 'Legados e Substituições', 5),
(171, 'Inventário e Partilha', 6),
(171, 'Herança Jacente e Herança Vacante', 7);

-- 172: Direito Processual Penal
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(172, 'Inquérito Policial', 1),
(172, 'Ação Penal Pública e Privada', 2),
(172, 'Procedimento Comum Ordinário e Sumário', 3),
(172, 'Tribunal do Júri', 4),
(172, 'Prisão e Liberdade Provisória', 5),
(172, 'Provas no Processo Penal', 6),
(172, 'Sentença Penal e Recursos', 7);

-- 173: Prática Jurídica II
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(173, 'Prática em Direito Civil', 1),
(173, 'Elaboração de Recursos', 2),
(173, 'Prática em Juizados Especiais', 3),
(173, 'Simulação de Audiências', 4),
(173, 'Análise de Jurisprudência', 5);

-- 174: Títulos de Crédito e Recuperação e Falência
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(174, 'Teoria Geral dos Títulos de Crédito', 1),
(174, 'Nota Promissória, Letra de Câmbio e Cheque', 2),
(174, 'Duplicata', 3),
(174, 'Recuperação Judicial e Extrajudicial', 4),
(174, 'Falência: Requisitos e Procedimento', 5),
(174, 'Efeitos da Falência sobre Contratos e Credores', 6);

-- 175: TCC I
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(175, 'Metodologia da Pesquisa Jurídica', 1),
(175, 'Projeto de Pesquisa: Tema e Problema', 2),
(175, 'Revisão Bibliográfica', 3),
(175, 'Normas ABNT para Trabalhos Acadêmicos', 4);

-- ========== 9º SEMESTRE ==========
-- 176: Direito Administrativo – Administração Pública
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(176, 'Administração Pública Direta e Indireta', 1),
(176, 'Agentes Públicos: Regime Jurídico', 2),
(176, 'Improbidade Administrativa (Lei 8.429/92)', 3),
(176, 'Processo Administrativo', 4),
(176, 'Intervenção do Estado na Propriedade', 5),
(176, 'Desapropriação', 6);

-- 177: Direito Tributário – Constitucional Tributário
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(177, 'Sistema Tributário Nacional', 1),
(177, 'Competência Tributária', 2),
(177, 'Limitações ao Poder de Tributar', 3),
(177, 'Princípios Tributários Constitucionais', 4),
(177, 'Espécies Tributárias', 5),
(177, 'Imunidades Tributárias', 6),
(177, 'Repartição de Receitas Tributárias', 7);

-- 178: Prática Jurídica III
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(178, 'Prática em Direito Penal', 1),
(178, 'Elaboração de Habeas Corpus', 2),
(178, 'Prática em Direito do Trabalho', 3),
(178, 'Prática em Direito Administrativo', 4),
(178, 'Atendimento em NPJ', 5);

-- 179: Sociedade Brasileira e Cidadania
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(179, 'Formação da Sociedade Brasileira', 1),
(179, 'Cidadania e Participação Política', 2),
(179, 'Desigualdade Social e Direitos Fundamentais', 3),
(179, 'Diversidade Cultural e Inclusão', 4),
(179, 'Políticas Públicas e Estado Democrático', 5);

-- 180: TCC II
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(180, 'Desenvolvimento da Monografia', 1),
(180, 'Análise de Dados e Resultados', 2),
(180, 'Redação Final e Revisão', 3),
(180, 'Defesa e Apresentação do TCC', 4);

-- ========== 10º SEMESTRE ==========
-- 181: Direito Cibernético
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(181, 'Marco Civil da Internet (Lei 12.965/2014)', 1),
(181, 'Lei Geral de Proteção de Dados (LGPD)', 2),
(181, 'Crimes Cibernéticos', 3),
(181, 'Propriedade Intelectual na Internet', 4),
(181, 'Responsabilidade dos Provedores', 5),
(181, 'Inteligência Artificial e Regulação', 6);

-- 182: Direito Internacional
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(182, 'Fontes do Direito Internacional Público', 1),
(182, 'Tratados Internacionais', 2),
(182, 'Organizações Internacionais: ONU e OEA', 3),
(182, 'Direito Internacional Privado: Conflito de Leis', 4),
(182, 'Nacionalidade e Condição Jurídica do Estrangeiro', 5),
(182, 'Cooperação Jurídica Internacional', 6),
(182, 'Tribunal Penal Internacional', 7);

-- 183: Direito Tributário – Tributos em Espécie
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(183, 'Impostos Federais: IR, IPI, IOF', 1),
(183, 'Impostos Estaduais: ICMS, IPVA, ITCMD', 2),
(183, 'Impostos Municipais: IPTU, ISS, ITBI', 3),
(183, 'Contribuições Sociais e de Intervenção no Domínio Econômico', 4),
(183, 'Processo Administrativo Tributário', 5),
(183, 'Execução Fiscal (Lei 6.830/80)', 6),
(183, 'Planejamento Tributário e Elisão Fiscal', 7);

-- 184: Direitos Humanos, Inclusão e Estatuto do Idoso
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(184, 'Declaração Universal dos Direitos Humanos', 1),
(184, 'Sistema Interamericano de Direitos Humanos', 2),
(184, 'Estatuto do Idoso (Lei 10.741/2003)', 3),
(184, 'Estatuto da Pessoa com Deficiência', 4),
(184, 'Ações Afirmativas e Inclusão Social', 5),
(184, 'Direitos Humanos no Ordenamento Jurídico Brasileiro', 6);

-- 185: Prática Jurídica IV
INSERT INTO faculdade_topicos (disciplina_id, titulo, ordem) VALUES
(185, 'Prática em Direito Tributário', 1),
(185, 'Prática em Direito Internacional', 2),
(185, 'Simulação de Tribunal do Júri', 3),
(185, 'Elaboração de Peças para OAB', 4),
(185, 'Preparação para o Exame da OAB', 5);
