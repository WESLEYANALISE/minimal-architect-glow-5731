-- Deletar as 3 assinaturas falsas (authorized sem pagamento real)
DELETE FROM public.subscriptions 
WHERE id IN (
  'ac4b4a8d-5c22-4210-aba1-fb4b325bd749', -- Artur vitalicio
  'ffde30a5-1b53-4794-b389-6eea57c3e661', -- Vanessa vitalicio  
  'f8ee578d-b8bb-4ebc-b312-c11b7f9edb27'  -- Victoria vitalicio
);

-- Revogar premium dos usuários que não pagaram de fato
-- (só se não tiverem outra assinatura authorized válida)
UPDATE public.usuarios_premium 
SET status_premium = false, updated_at = now()
WHERE user_id IN (
  '65243c79-7cf0-4c56-999b-631eefee8964', -- Artur
  '3e7eccce-c2d3-415c-a985-bc2eabfb201c', -- Vanessa
  'ffcbddb8-01f1-4407-b461-c5c48a2975d5'  -- Victoria
)
AND NOT EXISTS (
  SELECT 1 FROM public.subscriptions s 
  WHERE s.user_id = usuarios_premium.user_id 
  AND s.status = 'authorized'
  AND s.id NOT IN (
    'ac4b4a8d-5c22-4210-aba1-fb4b325bd749',
    'ffde30a5-1b53-4794-b389-6eea57c3e661',
    'f8ee578d-b8bb-4ebc-b312-c11b7f9edb27'
  )
);