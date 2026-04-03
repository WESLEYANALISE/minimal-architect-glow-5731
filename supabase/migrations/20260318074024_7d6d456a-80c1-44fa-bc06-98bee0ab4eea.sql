ALTER TABLE blogger_faculdade 
  ADD COLUMN IF NOT EXISTS conteudo_descomplicado text,
  ADD COLUMN IF NOT EXISTS url_audio_descomplicado text;

ALTER TABLE blogger_stf 
  ADD COLUMN IF NOT EXISTS conteudo_descomplicado text,
  ADD COLUMN IF NOT EXISTS url_audio_descomplicado text;

ALTER TABLE blogger_senado 
  ADD COLUMN IF NOT EXISTS conteudo_descomplicado text,
  ADD COLUMN IF NOT EXISTS url_audio_descomplicado text;

ALTER TABLE blogger_camara 
  ADD COLUMN IF NOT EXISTS conteudo_descomplicado text,
  ADD COLUMN IF NOT EXISTS url_audio_descomplicado text;

ALTER TABLE blogger_constitucional 
  ADD COLUMN IF NOT EXISTS conteudo_descomplicado text,
  ADD COLUMN IF NOT EXISTS url_audio_descomplicado text;

ALTER TABLE blogger_tribunais 
  ADD COLUMN IF NOT EXISTS conteudo_descomplicado text,
  ADD COLUMN IF NOT EXISTS url_audio_descomplicado text;

ALTER TABLE "BLOGGER_JURIDICO" 
  ADD COLUMN IF NOT EXISTS conteudo_descomplicado text,
  ADD COLUMN IF NOT EXISTS url_audio_descomplicado text;

ALTER TABLE oab_carreira_blog 
  ADD COLUMN IF NOT EXISTS conteudo_descomplicado text,
  ADD COLUMN IF NOT EXISTS url_audio_descomplicado text;