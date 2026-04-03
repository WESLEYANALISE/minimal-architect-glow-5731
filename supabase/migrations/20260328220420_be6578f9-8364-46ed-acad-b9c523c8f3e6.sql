
-- Função para auto-expirar assinaturas vencidas
CREATE OR REPLACE FUNCTION public.auto_expirar_assinaturas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE subscriptions 
  SET status = 'expired', updated_at = now()
  WHERE status IN ('authorized', 'active', 'approved')
    AND expiration_date IS NOT NULL
    AND expiration_date < now();
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$;
