CREATE SEQUENCE IF NOT EXISTS "cdc_id_seq";
SELECT setval('cdc_id_seq', COALESCE((SELECT MAX(id) FROM "CDC – Código de Defesa do Consumidor"), 0) + 1);
ALTER TABLE "CDC – Código de Defesa do Consumidor" ALTER COLUMN id SET DEFAULT nextval('cdc_id_seq');