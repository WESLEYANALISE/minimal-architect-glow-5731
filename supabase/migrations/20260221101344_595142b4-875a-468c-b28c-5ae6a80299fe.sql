INSERT INTO public.usuarios_premium (user_id, status_premium, data_ativacao)
VALUES ('31d176a2-5674-474d-addb-f7734bd72e10', true, now())
ON CONFLICT (user_id) DO UPDATE SET status_premium = true, data_ativacao = now();