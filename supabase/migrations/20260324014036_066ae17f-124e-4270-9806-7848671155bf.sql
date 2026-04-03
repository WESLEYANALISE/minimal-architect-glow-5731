ALTER TABLE faculdade_universidades
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS fundacao integer,
  ADD COLUMN IF NOT EXISTS nota_mec numeric(3,1),
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'privada',
  ADD COLUMN IF NOT EXISTS ranking_nacional integer;

UPDATE faculdade_universidades SET foto_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Faculdade_de_Direito_da_Universidade_de_S%C3%A3o_Paulo_01.jpg/1280px-Faculdade_de_Direito_da_Universidade_de_S%C3%A3o_Paulo_01.jpg', fundacao = 1827, nota_mec = 5.0, descricao = 'A Faculdade de Direito da USP, localizada no Largo de São Francisco, é a mais antiga e prestigiada escola de Direito do Brasil. Fundada em 1827, formou presidentes, juristas e intelectuais que moldaram a história do país.', cidade = 'São Paulo', estado = 'SP', tipo = 'pública', ranking_nacional = 1 WHERE nome = 'USP';

UPDATE faculdade_universidades SET foto_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/UNIP_-_Campus_Marqu%C3%AAs_-_S%C3%A3o_Paulo.jpg/1280px-UNIP_-_Campus_Marqu%C3%AAs_-_S%C3%A3o_Paulo.jpg', fundacao = 1988, nota_mec = 4.0, descricao = 'A Universidade Paulista é uma das maiores instituições privadas do Brasil, com forte presença no ensino jurídico. Oferece cursos presenciais e EAD com ampla rede de campi.', cidade = 'São Paulo', estado = 'SP', tipo = 'privada', ranking_nacional = 15 WHERE nome = 'UNIP';

UPDATE faculdade_universidades SET foto_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Anhanguera_Educacional.jpg/1280px-Anhanguera_Educacional.jpg', fundacao = 1994, nota_mec = 3.5, descricao = 'A Anhanguera é uma das maiores redes de ensino superior do Brasil, pertencente ao grupo Cogna Educação. Presente em centenas de cidades, democratiza o acesso ao ensino jurídico.', cidade = 'Valinhos', estado = 'SP', tipo = 'privada', ranking_nacional = 30 WHERE nome = 'Anhanguera';

UPDATE faculdade_universidades SET foto_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/UNESA_Campus_Presidente_Vargas.jpg/1280px-UNESA_Campus_Presidente_Vargas.jpg', fundacao = 1970, nota_mec = 4.0, descricao = 'A Universidade Estácio de Sá é referência no ensino superior no Rio de Janeiro, com forte tradição no curso de Direito. Possui ampla rede de unidades e programas de pós-graduação.', cidade = 'Rio de Janeiro', estado = 'RJ', tipo = 'privada', ranking_nacional = 20 WHERE nome ilike '%stácio%' OR nome ilike '%estacio%';

UPDATE faculdade_universidades SET foto_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Uninove_-_Memorial.jpg/1280px-Uninove_-_Memorial.jpg', fundacao = 1972, nota_mec = 4.0, descricao = 'A Universidade Nove de Julho é uma das maiores universidades privadas de São Paulo, reconhecida pela qualidade do ensino e pesquisa em diversas áreas do Direito.', cidade = 'São Paulo', estado = 'SP', tipo = 'privada', ranking_nacional = 18 WHERE nome = 'Uninove';

UPDATE faculdade_universidades SET fundacao = 2011, nota_mec = 3.5, descricao = 'A Unopar é pioneira no ensino a distância no Brasil, oferecendo cursos de Direito com flexibilidade e tecnologia. Pertence ao grupo Kroton/Cogna.', cidade = 'Londrina', estado = 'PR', tipo = 'privada', ranking_nacional = 35 WHERE nome = 'Unopar';

UPDATE faculdade_universidades SET foto_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/PUC-SP_Campus_Monte_Alegre.jpg/1280px-PUC-SP_Campus_Monte_Alegre.jpg', fundacao = 1946, nota_mec = 5.0, descricao = 'A Pontifícia Universidade Católica de São Paulo é referência nacional em Direito, especialmente em Direito Constitucional e Tributário. Formou importantes juristas e magistrados.', cidade = 'São Paulo', estado = 'SP', tipo = 'privada', ranking_nacional = 3 WHERE nome = 'PUC-SP';

UPDATE faculdade_universidades SET foto_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Universidade_Presbiteriana_Mackenzie_%28pr%C3%A9dio_hist%C3%B3rico%29.jpg/1280px-Universidade_Presbiteriana_Mackenzie_%28pr%C3%A9dio_hist%C3%B3rico%29.jpg', fundacao = 1952, nota_mec = 5.0, descricao = 'A Universidade Presbiteriana Mackenzie tem uma das faculdades de Direito mais tradicionais do Brasil. Reconhecida pela excelência acadêmica e forte atuação em pesquisa jurídica.', cidade = 'São Paulo', estado = 'SP', tipo = 'privada', ranking_nacional = 5 WHERE nome = 'Mackenzie';

UPDATE faculdade_universidades SET foto_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Faculdade_de_Direito_da_UFMG.jpg/1280px-Faculdade_de_Direito_da_UFMG.jpg', fundacao = 1892, nota_mec = 5.0, descricao = 'A Faculdade de Direito da UFMG é uma das mais tradicionais do país, com destaque em pesquisa e extensão. Formou importantes nomes do Direito brasileiro.', cidade = 'Belo Horizonte', estado = 'MG', tipo = 'pública', ranking_nacional = 2 WHERE nome = 'UFMG';

UPDATE faculdade_universidades SET foto_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/UERJ_-_Campus_Maracan%C3%A3.jpg/1280px-UERJ_-_Campus_Maracan%C3%A3.jpg', fundacao = 1950, nota_mec = 5.0, descricao = 'A Universidade do Estado do Rio de Janeiro possui uma das faculdades de Direito mais respeitadas do país. Destaca-se na formação de magistrados e na pesquisa em Direito Público.', cidade = 'Rio de Janeiro', estado = 'RJ', tipo = 'pública', ranking_nacional = 4 WHERE nome = 'UERJ';