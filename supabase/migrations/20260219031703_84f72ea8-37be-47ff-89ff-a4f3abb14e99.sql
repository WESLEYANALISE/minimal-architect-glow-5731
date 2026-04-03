
CREATE OR REPLACE FUNCTION public.get_admin_novos_por_periodo(p_dias integer DEFAULT 0)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM profiles
  WHERE 
    CASE 
      WHEN p_dias = 0 THEN 
        created_at >= date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'
      ELSE 
        created_at >= NOW() - (p_dias || ' days')::INTERVAL
    END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_novos_detalhes(p_dias integer DEFAULT 7)
 RETURNS TABLE(user_id uuid, nome text, email text, telefone text, dispositivo text, intencao text, created_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id as user_id,
    p.nome,
    p.email,
    p.telefone,
    p.dispositivo,
    p.intencao,
    p.created_at
  FROM profiles p
  WHERE 
    CASE 
      WHEN p_dias = 0 THEN 
        p.created_at >= date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'
      ELSE 
        p.created_at >= NOW() - (p_dias || ' days')::INTERVAL
    END
  ORDER BY p.created_at DESC;
$function$;
