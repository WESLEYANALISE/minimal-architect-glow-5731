-- Fix existing profiles that have no intencao (stuck in onboarding loop)
-- Use 'estudante' which is allowed by the check constraint
UPDATE profiles SET intencao = 'estudante' WHERE intencao IS NULL AND email IS NOT NULL;