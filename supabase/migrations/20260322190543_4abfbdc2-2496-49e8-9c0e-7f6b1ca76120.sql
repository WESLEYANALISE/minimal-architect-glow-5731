ALTER TABLE simulados_questoes
  ADD COLUMN IF NOT EXISTS comentario_ia TEXT,
  ADD COLUMN IF NOT EXISTS tema_qc TEXT,
  ADD COLUMN IF NOT EXISTS subtema_qc TEXT,
  ADD COLUMN IF NOT EXISTS url_audio_comentario TEXT;