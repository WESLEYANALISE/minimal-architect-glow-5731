-- Remove "Art. " prefix and add ordinal "º" for articles 1-9
-- Step 1: Remove "Art. " prefix from all articles
UPDATE "CF - Constituição Federal" 
SET "Número do Artigo" = TRIM(REPLACE("Número do Artigo", 'Art. ', ''))
WHERE "Número do Artigo" LIKE 'Art. %';

-- Step 2: Add ordinal "º" for single-digit articles (1-9) without suffix
UPDATE "CF - Constituição Federal" 
SET "Número do Artigo" = "Número do Artigo" || 'º'
WHERE "Número do Artigo" ~ '^[1-9]$';

-- Step 3: Add ordinal "º" for single-digit articles with letter suffix (e.g., "5-A" → "5º-A")
UPDATE "CF - Constituição Federal" 
SET "Número do Artigo" = SUBSTRING("Número do Artigo" FROM 1 FOR 1) || 'º' || SUBSTRING("Número do Artigo" FROM 2)
WHERE "Número do Artigo" ~ '^[1-9]-[A-Z]$';