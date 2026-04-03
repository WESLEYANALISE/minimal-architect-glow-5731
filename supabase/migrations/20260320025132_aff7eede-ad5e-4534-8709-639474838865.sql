
CREATE TABLE public.cursos_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  area text NOT NULL,
  aula_id uuid REFERENCES public.aulas_interativas(id) ON DELETE CASCADE NOT NULL,
  concluida boolean NOT NULL DEFAULT false,
  nota_feedback integer CHECK (nota_feedback >= 1 AND nota_feedback <= 5),
  comentario text,
  concluida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, aula_id)
);

ALTER TABLE public.cursos_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON public.cursos_progresso FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.cursos_progresso FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.cursos_progresso FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
