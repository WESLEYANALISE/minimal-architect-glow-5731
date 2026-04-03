import { useAggressiveChunkPreloader } from '@/hooks/useAggressiveChunkPreloader';
import { useProgressiveImagePreloader } from '@/hooks/useProgressiveImagePreloader';
import { useHomePreloader } from '@/hooks/useHomePreloader';

/**
 * Componente que ativa todos os sistemas de preload agressivo:
 * 1. Chunks JS (todas as rotas em 3 fases progressivas)
 * 2. Imagens progressivas (conforme navegação)
 * 3. Dados da home (tabelas do Supabase)
 */
export const AggressivePreloader = () => {
  useAggressiveChunkPreloader();
  useProgressiveImagePreloader();
  useHomePreloader();
  return null;
};

export default AggressivePreloader;
