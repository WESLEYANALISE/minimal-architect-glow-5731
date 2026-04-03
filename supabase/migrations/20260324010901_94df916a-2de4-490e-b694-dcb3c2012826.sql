
-- Primeiro, tornar codigo nullable para novas universidades
ALTER TABLE faculdade_disciplinas ALTER COLUMN codigo DROP NOT NULL;
