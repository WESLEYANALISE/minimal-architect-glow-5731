
-- Criar 6 tabelas de blogger seguindo o schema de oab_carreira_blog

CREATE TABLE public.blogger_faculdade (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  conteudo_gerado TEXT,
  url_capa TEXT,
  url_audio TEXT,
  topicos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  cache_validade TIMESTAMPTZ,
  gerado_em TIMESTAMPTZ
);

CREATE TABLE public.blogger_stf (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  conteudo_gerado TEXT,
  url_capa TEXT,
  url_audio TEXT,
  topicos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  cache_validade TIMESTAMPTZ,
  gerado_em TIMESTAMPTZ
);

CREATE TABLE public.blogger_senado (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  conteudo_gerado TEXT,
  url_capa TEXT,
  url_audio TEXT,
  topicos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  cache_validade TIMESTAMPTZ,
  gerado_em TIMESTAMPTZ
);

CREATE TABLE public.blogger_camara (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  conteudo_gerado TEXT,
  url_capa TEXT,
  url_audio TEXT,
  topicos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  cache_validade TIMESTAMPTZ,
  gerado_em TIMESTAMPTZ
);

CREATE TABLE public.blogger_constitucional (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  conteudo_gerado TEXT,
  url_capa TEXT,
  url_audio TEXT,
  topicos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  cache_validade TIMESTAMPTZ,
  gerado_em TIMESTAMPTZ
);

CREATE TABLE public.blogger_tribunais (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  conteudo_gerado TEXT,
  url_capa TEXT,
  url_audio TEXT,
  topicos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  cache_validade TIMESTAMPTZ,
  gerado_em TIMESTAMPTZ
);

-- Disable RLS for all (admin-only feature, accessed via admin check in frontend)
ALTER TABLE public.blogger_faculdade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_stf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_senado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_camara ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_constitucional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_tribunais ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow read for all" ON public.blogger_faculdade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all" ON public.blogger_stf FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all" ON public.blogger_senado FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all" ON public.blogger_camara FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all" ON public.blogger_constitucional FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all" ON public.blogger_tribunais FOR SELECT TO authenticated USING (true);

-- Allow anon read too
CREATE POLICY "Allow anon read" ON public.blogger_faculdade FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read" ON public.blogger_stf FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read" ON public.blogger_senado FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read" ON public.blogger_camara FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read" ON public.blogger_constitucional FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read" ON public.blogger_tribunais FOR SELECT TO anon USING (true);

-- Allow all operations for authenticated (admin enforced in app)
CREATE POLICY "Allow all for authenticated" ON public.blogger_faculdade FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.blogger_stf FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.blogger_senado FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.blogger_camara FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.blogger_constitucional FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.blogger_tribunais FOR ALL TO authenticated USING (true) WITH CHECK (true);
