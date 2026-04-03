CREATE TABLE IF NOT EXISTS "LC 109 - PREVIDENCIA COMPLEMENTAR" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  "Narração" text,
  "Comentario" text,
  "Aula" text,
  explicacao_tecnico text,
  explicacao_resumido text,
  explicacao_simples_menor16 text,
  explicacao_simples_maior16 text,
  exemplo text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  ultima_atualizacao timestamp without time zone,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamptz,
  versao_conteudo integer DEFAULT 1,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  ordem_artigo integer,
  novidades jsonb,
  hierarquia text,
  contexto_hierarquico text,
  tipo_dispositivo text,
  url_lei_alteradora text
);

ALTER TABLE "LC 109 - PREVIDENCIA COMPLEMENTAR" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON "LC 109 - PREVIDENCIA COMPLEMENTAR"
  FOR SELECT USING (true);