import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getFromUnifiedCache, saveToUnifiedCache } from './useUnifiedCache';

// Mapa de dados para prefetch - COLUNAS VERIFICADAS NO SCHEMA REAL
const ROUTE_DATA_PREFETCH: Record<string, { 
  queryKey: string; 
  table: string; 
  select: string; 
  limit: number;
  order?: string;
}> = {
  '/noticias-juridicas': { 
    queryKey: 'noticias_juridicas', 
    table: 'noticias_juridicas_cache', 
    select: 'id,titulo,data_publicacao,fonte,imagem,descricao', 
    limit: 30,
    order: 'data_publicacao'
  },
  '/cursos': { 
    queryKey: 'cursos', 
    table: 'CURSOS-APP', 
    select: 'id,tema,ordem,"capa-aula","descricao-aula",area,conteudo', 
    limit: 50,
    order: 'ordem'
  },
  '/blogger-juridico': { 
    queryKey: 'blogger_juridico', 
    table: 'BLOGGER_JURIDICO', 
    select: 'id,titulo,categoria,url_capa,descricao_curta,ordem,conteudo_gerado', 
    limit: 50,
    order: 'ordem'
  },
  '/audioaulas': { 
    queryKey: 'audioaulas', 
    table: 'AUDIO-AULA', 
    select: 'id,titulo,area,tema,sequencia,imagem_miniatura,url_audio', 
    limit: 50,
    order: 'sequencia'
  },
  '/politica': { 
    queryKey: 'noticias_politicas', 
    table: 'blogger_politico', 
    select: 'id,titulo,categoria,url_capa,descricao_curta,conteudo_gerado', 
    limit: 50,
    order: 'id'
  },
  '/vade-mecum': {
    queryKey: 'vade_mecum_codigos',
    table: 'codigos_disponiveis',
    select: 'id,nome,sigla,descricao,icone',
    limit: 50,
    order: 'nome'
  },
  '/sumulas': {
    queryKey: 'sumulas_vinculantes',
    table: 'SUMULAS-VINCULANTES',
    select: 'id,"Número","Conteúdo",Tema',
    limit: 100,
    order: 'id'
  },
  '/camara-deputados': {
    queryKey: 'deputados_lista',
    table: 'deputados_cache',
    select: 'id,nome,sigla_partido,sigla_uf,url_foto,email',
    limit: 100,
    order: 'nome'
  },
  '/camara-votacoes': {
    queryKey: 'votacoes_camara',
    table: 'votacoes_cache',
    select: 'id,descricao,data,aprovacao,resultado',
    limit: 50,
    order: 'data'
  },
  '/bibliotecas': {
    queryKey: 'capas_biblioteca',
    table: 'CAPA-BIBILIOTECA',
    select: 'id,Biblioteca,capa',
    limit: 20,
    order: 'id'
  },
  '/flashcards': {
    queryKey: 'flashcards_areas',
    table: 'flashcards_areas',
    select: 'id,area,icone,cor',
    limit: 30,
    order: 'ordem'
  },
  '/carreiras': {
    queryKey: 'carreiras_capas',
    table: 'carreiras_capas',
    select: 'id,carreira,url_capa,descricao',
    limit: 20,
    order: 'id'
  },
};

// Mapa de chunks JS para prefetch (lazy imports)
const CHUNK_PREFETCH_MAP: Record<string, () => Promise<any>> = {
  '/bibliotecas': () => import('../pages/Bibliotecas'),
  '/estudos': () => import('../pages/Estudos'),
  '/vade-mecum': () => import('../pages/VadeMecumTodas'),
  '/cursos': () => import('../pages/Cursos'),
  '/flashcards': () => import('../pages/FlashcardsAreas'),
  '/audioaulas': () => import('../pages/AudioaulasSpotify'),
  '/ferramentas': () => import('../pages/Ferramentas'),
  '/noticias-juridicas': () => import('../pages/NoticiasJuridicas'),
  '/juriflix': () => import('../pages/JuriFlix'),
  '/politica': () => import('../pages/Politica'),
  '/blogger-juridico': () => import('../pages/BloggerJuridico'),
  '/pesquisar': () => import('../pages/Pesquisar'),
  '/mapa-mental': () => import('../pages/MapaMentalAreas'),
  '/simulados': () => import('../pages/ferramentas/SimuladosHub'),
  '/jogos-juridicos': () => import('../pages/JogosJuridicos'),
  '/videoaulas': () => import('../pages/TelaHub'),
  '/codigos': () => import('../pages/Codigos'),
  '/codigo': () => import('../pages/CodigoView'),
  '/peticoes': () => import('../pages/PeticoesContratosHub'),
  // Questões, Flashcards e Resumos
  '/ferramentas/questoes': () => import('../pages/ferramentas/QuestoesHub'),
  '/resumos-juridicos': () => import('../pages/ResumosJuridicosTrilhas'),
  '/resumos-juridicos/prontos': () => import('../pages/ResumosProntos'),
  '/flashcards-hub': () => import('../pages/FlashcardsHub'),
  '/aulas': () => import('../pages/AulasPage'),
  '/assinatura': () => import('../pages/Assinatura'),
};

// Mapa de contexto - quais dados/chunks prefetch baseado na rota atual
const CONTEXTUAL_PREFETCH: Record<string, string[]> = {
  '/': ['/bibliotecas', '/estudos', '/vade-mecum', '/noticias-juridicas', '/cursos', '/flashcards', '/politica', '/peticoes', '/ferramentas/questoes', '/resumos-juridicos', '/flashcards-hub', '/aulas', '/assinatura'],
  '/inicio': ['/bibliotecas', '/estudos', '/vade-mecum', '/noticias-juridicas', '/cursos', '/flashcards', '/politica', '/peticoes', '/ferramentas/questoes', '/resumos-juridicos', '/flashcards-hub', '/aulas', '/assinatura'],
  '/bibliotecas': ['/cursos', '/blogger-juridico'],
  '/cursos': ['/cursos', '/audioaulas'],
  '/politica': ['/politica', '/camara-deputados', '/camara-votacoes'],
  '/vade-mecum': ['/vade-mecum', '/sumulas', '/cursos', '/codigos', '/codigo'],
  '/codigos': ['/codigo'],
  '/flashcards': ['/flashcards', '/cursos', '/flashcards-hub'],
  '/camara-deputados': ['/camara-deputados', '/camara-votacoes'],
  '/estudos': ['/cursos', '/audioaulas', '/flashcards', '/ferramentas/questoes', '/resumos-juridicos'],
};

/**
 * Hook para prefetch de dados E chunks JS
 */
export const useRoutePrefetch = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const prefetchedDataRef = useRef<Set<string>>(new Set());
  const prefetchedChunksRef = useRef<Set<string>>(new Set());
  const hasPrefetchedInitial = useRef(false);

  // Prefetch de dados da rota
  const prefetchRouteData = useCallback(async (route: string) => {
    if (prefetchedDataRef.current.has(route)) return;
    
    const dataConfig = ROUTE_DATA_PREFETCH[route];
    if (!dataConfig) return;

    prefetchedDataRef.current.add(route);

    try {
      const cached = await getFromUnifiedCache(dataConfig.queryKey);
      if (cached) {
        queryClient.setQueryData([dataConfig.queryKey], cached);
        return;
      }

      const query = supabase
        .from(dataConfig.table as any)
        .select(dataConfig.select)
        .limit(dataConfig.limit);

      if (dataConfig.order) {
        query.order(dataConfig.order as any, { ascending: dataConfig.order === 'ordem' || dataConfig.order === 'sequencia' });
      }

      const { data, error } = await query;

      if (!error && data) {
        await saveToUnifiedCache(dataConfig.queryKey, data);
        queryClient.setQueryData([dataConfig.queryKey], data);
      }
    } catch (e) {
      // Silent fail
    }
  }, [queryClient]);

  // Prefetch de chunk JS da rota
  const prefetchChunk = useCallback((route: string) => {
    if (prefetchedChunksRef.current.has(route)) return;
    
    const loader = CHUNK_PREFETCH_MAP[route];
    if (!loader) return;

    prefetchedChunksRef.current.add(route);
    loader().catch(() => {
      // Silent fail - chunk will load when user navigates
    });
  }, []);

  // Prefetch em lote com delay entre cada
  const prefetchBatch = useCallback((routes: string[], delayBetween = 100) => {
    routes.forEach((route, index) => {
      setTimeout(() => {
        prefetchRouteData(route);
        prefetchChunk(route);
      }, index * delayBetween);
    });
  }, [prefetchRouteData, prefetchChunk]);

  // Prefetch ao hover em links
  const handleLinkHover = useCallback((route: string) => {
    prefetchRouteData(route);
    prefetchChunk(route);
  }, [prefetchRouteData, prefetchChunk]);

  // Mobile: prefetch imediato no toque
  const handleLinkTouch = useCallback((route: string) => {
    prefetchRouteData(route);
    prefetchChunk(route);
  }, [prefetchRouteData, prefetchChunk]);

  return { handleLinkHover, handleLinkTouch, prefetchChunk, prefetchBatch, prefetchRouteData };
};

/**
 * Hook para prefetch on hover/touch em links específicos
 */
export const usePrefetchOnHover = (route: string) => {
  const { handleLinkHover, handleLinkTouch } = useRoutePrefetch();
  
  return {
    onMouseEnter: () => handleLinkHover(route),
    onFocus: () => handleLinkHover(route),
    onTouchStart: () => handleLinkTouch(route),
    onPointerDown: () => handleLinkTouch(route),
  };
};

export default useRoutePrefetch;
