
-- Allow service role and authenticated to insert/update prompts
CREATE POLICY "Authenticated can manage prompts"
  ON public.prompts_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
