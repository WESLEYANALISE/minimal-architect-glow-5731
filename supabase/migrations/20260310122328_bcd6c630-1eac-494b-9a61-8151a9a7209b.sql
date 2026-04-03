
-- Delete duplicates keeping the one with smallest id
DELETE FROM "FLASHCARDS_LACUNAS" a
USING "FLASHCARDS_LACUNAS" b
WHERE a.id > b.id
  AND a.area = b.area
  AND a.tema = b.tema
  AND a.subtema = b.subtema
  AND a.frase = b.frase
  AND a.palavra_correta = b.palavra_correta;

-- Add unique constraint
ALTER TABLE "FLASHCARDS_LACUNAS" 
ADD CONSTRAINT flashcards_lacunas_unique 
UNIQUE (area, tema, subtema, frase, palavra_correta);
