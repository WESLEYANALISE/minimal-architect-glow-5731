
CREATE TABLE public.subscription_funnel_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  plan_type text,
  payment_method text,
  amount numeric,
  referrer_page text,
  duration_seconds integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  device text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_funnel_events_user ON public.subscription_funnel_events(user_id);
CREATE INDEX idx_funnel_events_type ON public.subscription_funnel_events(event_type);
CREATE INDEX idx_funnel_events_created ON public.subscription_funnel_events(created_at DESC);

ALTER TABLE public.subscription_funnel_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own events
CREATE POLICY "Users can insert own funnel events"
ON public.subscription_funnel_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can read all events
CREATE POLICY "Admins can read all funnel events"
ON public.subscription_funnel_events
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Users can read their own events
CREATE POLICY "Users can read own funnel events"
ON public.subscription_funnel_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
