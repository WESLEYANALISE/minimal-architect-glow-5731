import { getAreaHex } from './flashcardsAreaColors';

export const CATEGORIAS_ANOTACOES = [
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Penal',
  'Direito Processual Penal',
  'Direito Civil',
  'Direito Processual Civil',
  'Direito do Trabalho',
  'Direito Tributário',
  'Direito Empresarial',
  'Direitos Humanos',
  'Direito Ambiental',
  'Direito do Consumidor',
  'Direito Eleitoral',
  'Direito Previdenciário',
  'Direito Internacional',
] as const;

export const getCategoriaColor = (categoria: string | null): string => {
  if (!categoria) return '#64748b';
  return getAreaHex(categoria);
};

export const getCategoriaCurta = (categoria: string): string => {
  return categoria
    .replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '')
    .replace(/^Direitos\s+/i, '');
};
