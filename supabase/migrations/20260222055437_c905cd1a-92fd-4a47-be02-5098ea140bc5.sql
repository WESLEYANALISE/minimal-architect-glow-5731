-- Permitir DELETE para admin limpar registros travados
CREATE POLICY "Admin can delete dicas_do_dia"
ON public.dicas_do_dia
FOR DELETE
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'wn7corporation@gmail.com'
);

-- Limpar registros travados
DELETE FROM dicas_do_dia WHERE status IN ('gerando', 'erro');