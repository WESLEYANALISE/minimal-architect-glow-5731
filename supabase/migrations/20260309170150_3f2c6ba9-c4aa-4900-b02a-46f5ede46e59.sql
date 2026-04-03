
CREATE FUNCTION public.get_admin_online_30min_details()
 RETURNS TABLE(user_id text, nome text, email text, telefone text, dispositivo text, page_path text, last_seen timestamp with time zone, country text, region text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH latest_views AS (
    SELECT 
      pv.user_id,
      pv.session_id,
      pv.page_path,
      pv.device,
      pv.country,
      pv.region,
      MAX(pv.created_at) as last_seen
    FROM page_views pv
    WHERE pv.created_at >= NOW() - INTERVAL '30 minutes'
    GROUP BY pv.user_id, pv.session_id, pv.page_path, pv.device, pv.country, pv.region
  ),
  ranked AS (
    SELECT 
      lv.user_id,
      lv.session_id,
      lv.page_path,
      lv.device,
      lv.country,
      lv.region,
      lv.last_seen,
      ROW_NUMBER() OVER (PARTITION BY COALESCE(lv.user_id::text, lv.session_id) ORDER BY lv.last_seen DESC) as rn
    FROM latest_views lv
  )
  SELECT 
    COALESCE(r.user_id::text, r.session_id) as user_id,
    p.nome::text,
    p.email::text,
    p.telefone::text,
    COALESCE(p.dispositivo, r.device)::text as dispositivo,
    r.page_path::text,
    r.last_seen,
    r.country::text,
    r.region::text
  FROM ranked r
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.rn = 1
  ORDER BY r.last_seen DESC;
$function$;

CREATE FUNCTION public.get_admin_novos_detalhes(p_dias integer DEFAULT 7)
 RETURNS TABLE(user_id uuid, nome text, email text, telefone text, dispositivo text, intencao text, created_at timestamp with time zone, pais_cadastro text, estado_cadastro text)
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
    p.created_at,
    p.pais_cadastro,
    p.estado_cadastro
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
