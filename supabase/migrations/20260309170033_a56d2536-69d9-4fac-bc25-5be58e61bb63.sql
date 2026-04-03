
-- get_admin_online_details already exists with new signature (succeeded in previous migration)
-- Drop and recreate the other two
DROP FUNCTION IF EXISTS public.get_admin_online_30min_details();
DROP FUNCTION IF EXISTS public.get_admin_novos_detalhes(integer);
