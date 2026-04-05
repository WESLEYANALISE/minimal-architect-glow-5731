
-- 1. Fix pro_purchases: remove public policies, restrict to service_role write + authenticated read
DROP POLICY IF EXISTS "System can manage purchases" ON public.pro_purchases;
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.pro_purchases;

CREATE POLICY "Service role manages purchases"
  ON public.pro_purchases FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users read own purchases"
  ON public.pro_purchases FOR SELECT TO authenticated USING (true);

-- 2. Fix evolution_config: remove all public policies, restrict to service_role only
DROP POLICY IF EXISTS "Allow public read evolution_config" ON public.evolution_config;
DROP POLICY IF EXISTS "Allow public insert evolution_config" ON public.evolution_config;
DROP POLICY IF EXISTS "Allow public update evolution_config" ON public.evolution_config;
DROP POLICY IF EXISTS "Allow all operations on evelyn_config" ON public.evolution_config;

CREATE POLICY "Service role only evolution_config"
  ON public.evolution_config FOR ALL TO service_role USING (true) WITH CHECK (true);
