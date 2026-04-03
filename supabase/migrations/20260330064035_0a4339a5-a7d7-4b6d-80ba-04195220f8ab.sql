-- Migration 1: Add ordem_artigo to Group 2 tables (30 tables missing it)
-- Also add termos_aprofundados to ESTATUTO - DESARMAMENTO

ALTER TABLE "ESTATUTO - ECA" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "ESTATUTO - OAB" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "ESTATUTO - IDOSO" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "ESTATUTO - CIDADE" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "ESTATUTO - PESSOA COM DEFICIÊNCIA" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "ESTATUTO - DESARMAMENTO" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "ESTATUTO - DESARMAMENTO" ADD COLUMN IF NOT EXISTS termos_aprofundados jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "ESTATUTO - IGUALDADE RACIAL" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "ESTATUTO - TORCEDOR" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;

ALTER TABLE "EST - Estatuto dos Militares" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "EST - Estatuto da Terra" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "EST - Estatuto da Migração" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "EST - Estatuto da Juventude" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "EST - Estatuto do Índio" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "EST - Estatuto do Refugiado" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "EST - Estatuto da Metrópole" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "EST - Estatuto do Desporto" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "EST - Estatuto da MPE" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "EST - Estatuto Segurança Privada" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "EST - Estatuto Magistério Superior" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "EST - Estatuto Pessoa com Câncer" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;

ALTER TABLE "Lei 11.340 de 2006 - Maria da Penha" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "Lei 11.343 de 2006 - Lei de Drogas" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "Lei 12.850 de 2013 - Organizações Criminosas" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "Lei 7.210 de 1984 - Lei de Execução Penal" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "Lei 8.072 de 1990 - Crimes Hediondos" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "Lei 9.099 de 1995 - Juizados Especiais" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "Lei 9.296 de 1996 - Interceptação Telefônica" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "Lei 9.455 de 1997 - Tortura" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "Lei 13.869 de 2019 - Abuso de Autoridade" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "Lei 13.964 de 2019 - Pacote Anticrime" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "Lei 14.197 de 2021 - Crimes Contra o Estado Democrático" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "LLD - Lei de Lavagem de Dinheiro" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "LEI 4657 - LINDB" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;
ALTER TABLE "CTB Código de Trânsito Brasileiro" ADD COLUMN IF NOT EXISTS ordem_artigo numeric;