-- Reload PostgREST schema cache to fix visibility issues
NOTIFY pgrst, 'reload schema';