
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
  
  INSERT INTO public.profiles (id, nome, email, telefone, avatar_url, dispositivo, device_info, utm_source, utm_medium, utm_campaign, utm_content, utm_term)
  VALUES (
    new.id, 
    COALESCE(
      new.raw_user_meta_data ->> 'nome', 
      new.raw_user_meta_data ->> 'full_name', 
      new.raw_user_meta_data ->> 'name'
    ),
    new.email,
    new.raw_user_meta_data ->> 'telefone',
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
