-- Add salary columns to simulados_concursos
ALTER TABLE public.simulados_concursos 
  ADD COLUMN IF NOT EXISTS salario_inicial text,
  ADD COLUMN IF NOT EXISTS salario_maximo text;

-- Create storage bucket for simulados PDFs (prova and gabarito)
INSERT INTO storage.buckets (id, name, public)
VALUES ('simulados-pdfs', 'simulados-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read (public bucket)
CREATE POLICY "Public read simulados-pdfs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'simulados-pdfs');

-- Allow authenticated users to upload
CREATE POLICY "Auth upload simulados-pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'simulados-pdfs');

-- Allow authenticated users to update
CREATE POLICY "Auth update simulados-pdfs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'simulados-pdfs');

-- Allow authenticated users to delete
CREATE POLICY "Auth delete simulados-pdfs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'simulados-pdfs');