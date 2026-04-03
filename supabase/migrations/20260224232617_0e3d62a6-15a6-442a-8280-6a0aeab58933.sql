ALTER TABLE public.trial_overrides 
ADD COLUMN IF NOT EXISTS bonus_day_claimed boolean DEFAULT false;