-- Fix "Delegado de PolíCia" → "Delegado de Polícia"
UPDATE simulados_concursos SET cargo = 'Delegado de Polícia' WHERE id = 'eb2e8494-c535-4eb6-9b3a-f35f088a3203';

-- Fix NULL cargo → "Agente de Polícia Federal"
UPDATE simulados_concursos SET cargo = 'Agente de Polícia Federal' WHERE id = '575ca0d6-f0f2-443d-b7d7-a96da9cc2feb';

-- Update salaries
UPDATE simulados_concursos SET salario_inicial = 14710 WHERE id = '575ca0d6-f0f2-443d-b7d7-a96da9cc2feb';
UPDATE simulados_concursos SET salario_inicial = 26838 WHERE id = 'eb2e8494-c535-4eb6-9b3a-f35f088a3203';