-- Adicionar coluna ordem_artigo nas tabelas que ainda não a possuem
ALTER TABLE "LEI 8213 - Benefícios" ADD COLUMN IF NOT EXISTS ordem_artigo integer;
ALTER TABLE "LEI 9784 - PROCESSO ADMINISTRATIVO" ADD COLUMN IF NOT EXISTS ordem_artigo integer;
ALTER TABLE "LEI 9868 - ADI E ADC" ADD COLUMN IF NOT EXISTS ordem_artigo integer;
ALTER TABLE "LEI 12527 - ACESSO INFORMACAO" ADD COLUMN IF NOT EXISTS ordem_artigo integer;
ALTER TABLE "LC 101 - LRF" ADD COLUMN IF NOT EXISTS ordem_artigo integer;
ALTER TABLE "LEI 9099 - JUIZADOS CIVEIS" ADD COLUMN IF NOT EXISTS ordem_artigo integer;

-- Adicionar colunas de novidades e hierarquia onde faltam
DO $$
DECLARE
  tbl text;
  tables_to_update text[] := ARRAY[
    'LEI 8213 - Benefícios',
    'LEI 9784 - PROCESSO ADMINISTRATIVO',
    'LEI 9868 - ADI E ADC',
    'LEI 12527 - ACESSO INFORMACAO',
    'LC 101 - LRF',
    'LEI 9099 - JUIZADOS CIVEIS'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_update
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS novidades jsonb', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS hierarquia text', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS contexto_hierarquico text', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tipo_dispositivo text', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS url_lei_alteradora text', tbl);
  END LOOP;
END $$;