
-- Criar 19 tabelas do Vade Mecum que não existem no banco
-- Estrutura padrão: id, Número do Artigo, Artigo, explicacao_tecnico, Narração, ordem_artigo, ultima_atualizacao

CREATE TABLE IF NOT EXISTS public."LEI 12016 - MANDADO DE SEGURANCA" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 9507 - HABEAS DATA" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 10520 - PREGAO" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 12965 - MARCO CIVIL INTERNET" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 9307 - ARBITRAGEM" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 8245 - INQUILINATO" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 3365 - DESAPROPRIACAO" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 6938 - MEIO AMBIENTE" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 11101 - RECUPERACAO FALENCIA" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 9605 - CRIMES AMBIENTAIS" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 13104 - FEMINICIDIO" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 13260 - ANTITERRORISMO" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 7492 - CRIMES SISTEMA FINANCEIRO" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 8137 - CRIMES ORDEM TRIBUTARIA" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LC 135 - FICHA LIMPA" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 1079 - CRIMES RESPONSABILIDADE" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public."LEI 5015 - CRIMES TRANSNACIONAIS" (
  id bigint primary key generated always as identity,
  "Número do Artigo" text,
  "Artigo" text,
  explicacao_tecnico text,
  "Narração" text,
  ordem_artigo integer,
  ultima_atualizacao timestamptz default now()
);

-- Habilitar RLS em todas as novas tabelas (acesso público de leitura)
ALTER TABLE public."LEI 12016 - MANDADO DE SEGURANCA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 9507 - HABEAS DATA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 10520 - PREGAO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 12965 - MARCO CIVIL INTERNET" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 9307 - ARBITRAGEM" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 8245 - INQUILINATO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 3365 - DESAPROPRIACAO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 6938 - MEIO AMBIENTE" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 11101 - RECUPERACAO FALENCIA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 9605 - CRIMES AMBIENTAIS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 13104 - FEMINICIDIO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 13260 - ANTITERRORISMO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 7492 - CRIMES SISTEMA FINANCEIRO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 8137 - CRIMES ORDEM TRIBUTARIA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LC 135 - FICHA LIMPA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 1079 - CRIMES RESPONSABILIDADE" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEI 5015 - CRIMES TRANSNACIONAIS" ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública para todas
CREATE POLICY "Leitura pública" ON public."LEI 12016 - MANDADO DE SEGURANCA" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 9507 - HABEAS DATA" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 10520 - PREGAO" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 12965 - MARCO CIVIL INTERNET" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 9307 - ARBITRAGEM" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 8245 - INQUILINATO" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 3365 - DESAPROPRIACAO" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 6938 - MEIO AMBIENTE" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 11101 - RECUPERACAO FALENCIA" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 9605 - CRIMES AMBIENTAIS" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 13104 - FEMINICIDIO" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 13260 - ANTITERRORISMO" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 7492 - CRIMES SISTEMA FINANCEIRO" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 8137 - CRIMES ORDEM TRIBUTARIA" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LC 135 - FICHA LIMPA" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 1079 - CRIMES RESPONSABILIDADE" FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public."LEI 5015 - CRIMES TRANSNACIONAIS" FOR SELECT USING (true);
