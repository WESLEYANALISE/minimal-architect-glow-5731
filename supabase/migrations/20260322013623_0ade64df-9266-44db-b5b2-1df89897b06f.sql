UPDATE simulados_questoes SET materia = CASE
  WHEN UPPER(TRIM(materia)) IN ('LÍNGUA PORTUGUESA', 'PORTUGUÊS', 'LINGUA PORTUGUESA') THEN 'Língua Portuguesa'
  WHEN UPPER(TRIM(materia)) = 'INFORMÁTICA' THEN 'Informática'
  WHEN UPPER(TRIM(materia)) IN ('MATEMÁTICA', 'RACIOCÍNIO LÓGICO') THEN 'Raciocínio Lógico'
  WHEN UPPER(TRIM(materia)) = 'ATUALIDADES' THEN 'Atualidades'
  WHEN UPPER(TRIM(materia)) = 'DIREITO CONSTITUCIONAL' THEN 'Direito Constitucional'
  WHEN UPPER(TRIM(materia)) IN ('DIREITO PENAL') THEN 'Direito Penal'
  WHEN UPPER(TRIM(materia)) = 'DIREITO PROCESSUAL CIVIL' THEN 'Direito Processual Civil'
  WHEN UPPER(TRIM(materia)) = 'DIREITO PROCESSUAL PENAL' THEN 'Direito Processual Penal'
  WHEN TRIM(materia) ILIKE '%administrativo%' OR TRIM(materia) ILIKE '%dirito administrativo%' THEN 'Direito Administrativo'
  WHEN TRIM(materia) ILIKE '%processual%regimento%' THEN 'Direito Processual Civil'
  WHEN TRIM(materia) ILIKE '%legislação interna%' OR TRIM(materia) ILIKE '%resolução%' THEN 'Legislação Específica'
  ELSE INITCAP(TRIM(materia))
END
WHERE simulado_id = '70990036-c638-4339-8154-45a1ecb85f9b';