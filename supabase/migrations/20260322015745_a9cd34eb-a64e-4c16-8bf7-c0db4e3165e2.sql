INSERT INTO storage.buckets (id, name, public)
VALUES ('simulados-imagens', 'simulados-imagens', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read simulados-imagens"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'simulados-imagens');

CREATE POLICY "Auth upload simulados-imagens"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'simulados-imagens');

CREATE POLICY "Auth update simulados-imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'simulados-imagens');