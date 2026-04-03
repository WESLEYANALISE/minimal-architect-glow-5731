-- Create storage bucket for lesson narrations
INSERT INTO storage.buckets (id, name, public)
VALUES ('aulas-narracoes', 'aulas-narracoes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read aulas-narracoes" ON storage.objects
FOR SELECT USING (bucket_id = 'aulas-narracoes');

-- Allow service role to upload
CREATE POLICY "Service upload aulas-narracoes" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'aulas-narracoes');