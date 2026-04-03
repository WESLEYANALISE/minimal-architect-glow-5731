
-- 30 new blogger tables for Explorar section
-- Each follows the same structure as existing blogger tables

CREATE TABLE IF NOT EXISTS public.blogger_processo_civil (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL DEFAULT 0,
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  conteudo_gerado TEXT,
  url_capa TEXT,
  url_audio TEXT,
  fonte_url TEXT,
  topicos TEXT[],
  cache_validade TEXT,
  gerado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_processo_penal (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_processo_trabalho (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_pratica_juridica (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_jurisprudencia (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_mediacao (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_previdenciario (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_financeiro (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_urbanistico (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_militar (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_maritimo (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_saude (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_imobiliario (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_bancario (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_agronegocio (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_familia (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_sucessoes (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_contratual (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_digital (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_lgpd (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_startups (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_compliance (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_desportivo (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_energia (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_filosofia (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_sociologia (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_hermeneutica (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_internacional_publico (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_internacional_privado (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogger_comparado (
  id SERIAL PRIMARY KEY, ordem INTEGER NOT NULL DEFAULT 0, titulo TEXT NOT NULL, descricao_curta TEXT, conteudo_gerado TEXT, url_capa TEXT, url_audio TEXT, fonte_url TEXT, topicos TEXT[], cache_validade TEXT, gerado_em TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
