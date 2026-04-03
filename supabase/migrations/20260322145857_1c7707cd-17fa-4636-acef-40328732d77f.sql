-- Fix semicolon area (id:35) - Direito Ambiental
UPDATE "SIMULADO-OAB" SET area = 'Direito Ambiental' WHERE id = 35;

-- Ética Profissional (ids 1-8)
UPDATE "SIMULADO-OAB" SET area = 'Ética Profissional' WHERE id IN (1,2,3,4,5,6,7,8) AND area IS NULL;

-- Filosofia do Direito (ids 9-10)
UPDATE "SIMULADO-OAB" SET area = 'Filosofia do Direito' WHERE id IN (9,10) AND area IS NULL;

-- Direito Constitucional (ids 11-16)
UPDATE "SIMULADO-OAB" SET area = 'Direito Constitucional' WHERE id IN (11,12,13,14,15,16) AND area IS NULL;

-- Direitos Humanos (ids 17-18)
UPDATE "SIMULADO-OAB" SET area = 'Direitos Humanos' WHERE id IN (17,18) AND area IS NULL;

-- Direito Eleitoral (ids 19-20)
UPDATE "SIMULADO-OAB" SET area = 'Direito Eleitoral' WHERE id IN (19,20) AND area IS NULL;

-- Direito Civil (ids 21, 37-44)
UPDATE "SIMULADO-OAB" SET area = 'Direito Civil' WHERE id IN (21,37,38,39,40,41,42,43,44) AND area IS NULL;

-- Direito Internacional (id 22)
UPDATE "SIMULADO-OAB" SET area = 'Direito Internacional' WHERE id = 22 AND area IS NULL;

-- Direito Financeiro (ids 23-24)
UPDATE "SIMULADO-OAB" SET area = 'Direito Financeiro' WHERE id IN (23,24) AND area IS NULL;

-- Direito Tributário (ids 25-29)
UPDATE "SIMULADO-OAB" SET area = 'Direito Tributário' WHERE id IN (25,26,27,28,29) AND area IS NULL;

-- Direito Administrativo (ids 30-34)
UPDATE "SIMULADO-OAB" SET area = 'Direito Administrativo' WHERE id IN (30,31,32,33,34) AND area IS NULL;

-- Direito Ambiental (id 36)
UPDATE "SIMULADO-OAB" SET area = 'Direito Ambiental' WHERE id = 36 AND area IS NULL;

-- Direito do Consumidor (ids 45-46)
UPDATE "SIMULADO-OAB" SET area = 'Direito do Consumidor' WHERE id IN (45,46) AND area IS NULL;

-- Direito Empresarial (ids 47-51)
UPDATE "SIMULADO-OAB" SET area = 'Direito Empresarial' WHERE id IN (47,48,49,50,51) AND area IS NULL;

-- Direito Processual Civil (ids 52-56)
UPDATE "SIMULADO-OAB" SET area = 'Direito Processual Civil' WHERE id IN (52,53,54,55,56) AND area IS NULL;

-- Direito Penal (ids 57-63)
UPDATE "SIMULADO-OAB" SET area = 'Direito Penal' WHERE id IN (57,58,59,60,61,62,63) AND area IS NULL;

-- Direito Processual Penal (ids 64-65, 68)
UPDATE "SIMULADO-OAB" SET area = 'Direito Processual Penal' WHERE id IN (64,65,68) AND area IS NULL;

-- Direito do Trabalho (ids 66-67, 71-78)
UPDATE "SIMULADO-OAB" SET area = 'Direito do Trabalho' WHERE id IN (66,67,71,72,73,74,75,76,77,78) AND area IS NULL;

-- Direito Processual do Trabalho (ids 79-80)
UPDATE "SIMULADO-OAB" SET area = 'Direito Processual do Trabalho' WHERE id IN (79,80) AND area IS NULL;

-- Direito Previdenciário (ids 69-70)
UPDATE "SIMULADO-OAB" SET area = 'Direito Previdenciário' WHERE id IN (69,70) AND area IS NULL;