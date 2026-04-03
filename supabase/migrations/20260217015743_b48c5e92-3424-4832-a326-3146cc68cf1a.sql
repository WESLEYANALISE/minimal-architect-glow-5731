
-- Migrar dados antigos de plan_click_analytics (open_modal) para premium_modal_views
INSERT INTO public.premium_modal_views (user_id, modal_type, source_page, source_feature, device, created_at)
SELECT 
  user_id,
  'upgrade_modal' as modal_type,
  '/assinatura' as source_page,
  CASE 
    WHEN plan_type = 'vitalicio' THEN 'Plano Vitalício'
    WHEN plan_type = 'mensal' THEN 'Plano Mensal'
    ELSE 'Plano ' || COALESCE(plan_type, 'Desconhecido')
  END as source_feature,
  device,
  created_at
FROM public.plan_click_analytics
WHERE action = 'open_modal';
