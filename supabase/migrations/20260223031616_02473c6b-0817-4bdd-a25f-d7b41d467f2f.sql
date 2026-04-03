
-- Desativar trial de todos os usuários expirados (que não são premium)
INSERT INTO trial_overrides (user_id, extra_ms, desativado, updated_by, updated_at)
SELECT 
  p.id,
  0,
  true,
  'admin-bulk-disable-2026-02-23',
  now()
FROM profiles p
LEFT JOIN trial_overrides t ON t.user_id = p.id
LEFT JOIN usuarios_premium up ON up.user_id = p.id AND up.status_premium = true
WHERE (t.desativado IS NULL OR t.desativado = false)
  AND p.created_at < NOW() - INTERVAL '3 days'
  AND up.user_id IS NULL
ON CONFLICT (user_id) DO UPDATE SET
  desativado = true,
  updated_by = 'admin-bulk-disable-2026-02-23',
  updated_at = now();
