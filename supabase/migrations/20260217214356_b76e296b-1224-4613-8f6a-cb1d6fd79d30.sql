
-- Add UTM columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- Add UTM columns to page_views
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- Update handle_new_user to extract UTM params from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  device_info_value jsonb;
BEGIN
  BEGIN
    device_info_value := (new.raw_user_meta_data ->> 'device_info_json')::jsonb;
  EXCEPTION WHEN OTHERS THEN
    device_info_value := NULL;
  END;
  
  INSERT INTO public.profiles (id, nome, email, avatar_url, dispositivo, device_info, utm_source, utm_medium, utm_campaign, utm_content, utm_term)
  VALUES (
    new.id, 
    COALESCE(
      new.raw_user_meta_data ->> 'nome', 
      new.raw_user_meta_data ->> 'full_name', 
      new.raw_user_meta_data ->> 'name'
    ),
    new.email,
    COALESCE(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    new.raw_user_meta_data ->> 'dispositivo',
    device_info_value,
    new.raw_user_meta_data ->> 'utm_source',
    new.raw_user_meta_data ->> 'utm_medium',
    new.raw_user_meta_data ->> 'utm_campaign',
    new.raw_user_meta_data ->> 'utm_content',
    new.raw_user_meta_data ->> 'utm_term'
  );
  RETURN new;
END;
$function$;
