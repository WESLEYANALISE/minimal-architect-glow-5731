
-- Tabela trial_overrides
CREATE TABLE public.trial_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  extra_ms bigint NOT NULL DEFAULT 0,
  desativado boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

-- Enable RLS
ALTER TABLE public.trial_overrides ENABLE ROW LEVEL SECURITY;

-- Users can read their own override
CREATE POLICY "Users can read own trial override"
ON public.trial_overrides
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin can read all overrides (for admin panel)
CREATE POLICY "Admins can read all trial overrides"
ON public.trial_overrides
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trial_overrides;

-- Function for admin to adjust trial
CREATE OR REPLACE FUNCTION public.admin_ajustar_trial(
  p_user_id uuid,
  p_extra_ms bigint DEFAULT NULL,
  p_desativado boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  INSERT INTO public.trial_overrides (user_id, extra_ms, desativado, updated_by, updated_at)
  VALUES (
    p_user_id,
    COALESCE(p_extra_ms, 0),
    COALESCE(p_desativado, false),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    extra_ms = CASE 
      WHEN p_extra_ms IS NOT NULL THEN trial_overrides.extra_ms + p_extra_ms
      ELSE trial_overrides.extra_ms
    END,
    desativado = CASE
      WHEN p_desativado IS NOT NULL THEN p_desativado
      ELSE trial_overrides.desativado
    END,
    updated_by = (SELECT email FROM auth.users WHERE id = auth.uid()),
    updated_at = now();
END;
$$;
