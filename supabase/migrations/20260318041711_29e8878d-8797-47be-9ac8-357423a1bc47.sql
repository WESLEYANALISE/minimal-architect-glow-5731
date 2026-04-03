
-- Garantir sequence para CTN apenas (CF já tem identity column)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'ctn_codigo_tributario_id_seq') THEN
    CREATE SEQUENCE public.ctn_codigo_tributario_id_seq;
  END IF;
END $$;

ALTER TABLE public."CTN – Código Tributário Nacional" 
  ALTER COLUMN id SET DEFAULT nextval('public.ctn_codigo_tributario_id_seq');

SELECT setval('public.ctn_codigo_tributario_id_seq', COALESCE((SELECT MAX(id) FROM public."CTN – Código Tributário Nacional"), 0) + 1);
