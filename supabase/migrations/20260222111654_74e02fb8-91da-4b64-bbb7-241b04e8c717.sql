CREATE POLICY "Everyone can read dicas_do_dia"
ON public.dicas_do_dia
FOR SELECT
USING (status = 'pronto');