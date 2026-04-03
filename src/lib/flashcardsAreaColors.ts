export const AREA_GRADIENTS: Record<string, string> = {
  "Direito Penal": "from-red-600 to-red-800",
  "Direito Civil": "from-blue-600 to-blue-800",
  "Direito Constitucional": "from-purple-600 to-purple-800",
  "Direito Processual Civil": "from-teal-600 to-teal-800",
  "Direito do Trabalho": "from-orange-500 to-orange-700",
  "Direito Tributário": "from-emerald-600 to-emerald-800",
  "Direito Administrativo": "from-indigo-500 to-indigo-700",
  "Direito Processual Penal": "from-pink-600 to-pink-800",
  "Direito Empresarial": "from-amber-500 to-amber-700",
  "Direitos Humanos": "from-cyan-600 to-cyan-800",
  "Filosofia do Direito": "from-violet-500 to-violet-700",
  "Direito Ambiental": "from-lime-600 to-lime-800",
  "Direito do Consumidor": "from-yellow-600 to-yellow-800",
  "Direito Eleitoral": "from-sky-600 to-sky-800",
  "Direito Previdenciário": "from-fuchsia-600 to-fuchsia-800",
  "Direito Internacional": "from-slate-500 to-slate-700",
  "Direito Processual do Trabalho": "from-orange-600 to-orange-800",
  "Direito Desportivo": "from-gray-500 to-gray-700",
  "Direito Financeiro": "from-green-600 to-green-800",
  "Direito Internacional Privado": "from-blue-500 to-blue-700",
  "Direito Internacional Público": "from-blue-700 to-blue-900",
  "Direito Urbanistico": "from-stone-500 to-stone-700",
  "Direito Urbanístico": "from-stone-500 to-stone-700",
  "Sociologia do Direito": "from-rose-500 to-rose-700",
  "Teoria e Filosofia do Direito": "from-violet-500 to-violet-700",
  "Formação Complementar": "from-slate-500 to-slate-700",
  "Pratica Profissional": "from-amber-500 to-amber-700",
  "Pesquisa Científica": "from-cyan-500 to-cyan-700",
  "Politicas Publicas": "from-rose-500 to-rose-700",
  "Lei Penal Especial": "from-red-700 to-red-900",
  "Direito Concorrencial": "from-stone-500 to-stone-700",
  "Direito Previndenciário": "from-fuchsia-600 to-fuchsia-800",
  "Direito Tributario": "from-emerald-600 to-emerald-800",
};

export const AREA_HEX_COLORS: Record<string, string> = {
  "Direito Penal": "#dc2626",
  "Direito Civil": "#2563eb",
  "Direito Constitucional": "#9333ea",
  "Direito Processual Civil": "#0d9488",
  "Direito do Trabalho": "#f97316",
  "Direito Tributário": "#059669",
  "Direito Administrativo": "#6366f1",
  "Direito Processual Penal": "#db2777",
  "Direito Empresarial": "#f59e0b",
  "Direitos Humanos": "#0891b2",
  "Filosofia do Direito": "#8b5cf6",
  "Direito Ambiental": "#65a30d",
  "Direito do Consumidor": "#ca8a04",
  "Direito Eleitoral": "#0284c7",
  "Direito Previdenciário": "#c026d3",
  "Direito Internacional": "#64748b",
  "Direito Processual do Trabalho": "#ea580c",
  "Direito Desportivo": "#6b7280",
  "Direito Financeiro": "#16a34a",
  "Direito Internacional Privado": "#3b82f6",
  "Direito Internacional Público": "#1d4ed8",
  "Direito Urbanistico": "#78716c",
  "Direito Urbanístico": "#78716c",
  "Sociologia do Direito": "#f43f5e",
  "Teoria e Filosofia do Direito": "#8b5cf6",
  "Formação Complementar": "#64748b",
  "Pratica Profissional": "#f59e0b",
  "Pesquisa Científica": "#06b6d4",
  "Politicas Publicas": "#f43f5e",
  "Lei Penal Especial": "#b91c1c",
  "Direito Concorrencial": "#78716c",
  "Direito Previndenciário": "#c026d3",
  "Direito Tributario": "#059669",
};

const normalizar = (str: string) =>
  str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const getAreaGradient = (area: string): string => {
  // Try exact match first
  if (AREA_GRADIENTS[area]) return AREA_GRADIENTS[area];
  // Normalized match
  const norm = normalizar(area);
  const entry = Object.entries(AREA_GRADIENTS).find(([k]) => normalizar(k) === norm);
  return entry?.[1] || "from-slate-500 to-slate-700";
};

export const getAreaHex = (area: string): string => {
  if (AREA_HEX_COLORS[area]) return AREA_HEX_COLORS[area];
  const norm = normalizar(area);
  const entry = Object.entries(AREA_HEX_COLORS).find(([k]) => normalizar(k) === norm);
  return entry?.[1] || "#64748b";
};
