CREATE TABLE public.suporte_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_nome text,
  categoria text NOT NULL,
  mensagem text NOT NULL,
  status text NOT NULL DEFAULT 'aberto',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suporte_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own tickets"
  ON public.suporte_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tickets"
  ON public.suporte_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);