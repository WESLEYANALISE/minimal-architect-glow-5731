
-- Add rating bonus columns to trial_overrides
ALTER TABLE public.trial_overrides
  ADD COLUMN IF NOT EXISTS rating_bonus_offered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating_bonus_claimed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating_bonus_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS rating_bonus_revoked boolean NOT NULL DEFAULT false;
