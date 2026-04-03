CREATE POLICY "Allow authenticated users to update explicacoes_artigos_fila"
ON public.explicacoes_artigos_fila
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);