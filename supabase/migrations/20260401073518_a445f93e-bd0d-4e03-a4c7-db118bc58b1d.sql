CREATE POLICY "Allow authenticated users to read explicacoes_artigos_fila"
ON public.explicacoes_artigos_fila
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete explicacoes_artigos_fila"
ON public.explicacoes_artigos_fila
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert explicacoes_artigos_fila"
ON public.explicacoes_artigos_fila
FOR INSERT
TO authenticated
WITH CHECK (true);