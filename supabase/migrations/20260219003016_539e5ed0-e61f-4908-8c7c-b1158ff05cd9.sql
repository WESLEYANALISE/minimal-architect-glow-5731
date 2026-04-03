
-- Inserir "O Mundo de Sofia" na BIBLIOTECA-CLASSICOS
INSERT INTO public."BIBLIOTECA-CLASSICOS" (id, livro, autor, area, link, download, imagem, sobre)
VALUES (
  149,
  'O Mundo de Sofia',
  'Jostein Gaarder',
  'Filosofia',
  'https://online.fliphtml5.com/zmzll/O-Mundo-de-Sofia---Jostein-Gaarder/',
  'https://drive.google.com/file/d/1Q_1ZaxA0KrcuFGKSQmbXnqtzj8_aQpc4/view?usp=sharing',
  '/images/o-mundo-de-sofia-capa.jpg',
  'O Mundo de Sofia é um romance filosófico do escritor norueguês Jostein Gaarder, publicado em 1991. A obra acompanha Sofia Amundsen, uma jovem de 14 anos que começa a receber cartas misteriosas com perguntas filosóficas como "Quem é você?" e "De onde vem o mundo?". Através dessas cartas, um filósofo chamado Alberto Knox guia Sofia por toda a história da filosofia ocidental — desde os pré-socráticos, passando por Platão, Aristóteles, Descartes, Kant, Hegel, até os pensadores existencialistas e contemporâneos. O livro entrelaça a narrativa ficcional com lições de filosofia de forma acessível e envolvente, tornando-se uma das obras mais populares para introdução ao pensamento filosófico.'
);

-- Inserir primeira notificação
INSERT INTO public.atualizacao_biblioteca (biblioteca, nome_livro, autor, capa_url, vezes, ativo)
VALUES (
  'Clássicos',
  'O Mundo de Sofia',
  'Jostein Gaarder',
  '/images/o-mundo-de-sofia-capa.jpg',
  1,
  true
);
