import { useEffect, useRef } from 'react';

// ========== FASE 1: Top 4 rotas mais acessadas (imediato) ==========
const PHASE1_CRITICAL = [
  () => import('../pages/Bibliotecas'),
  () => import('../pages/VadeMecumTodas'),
  () => import('../pages/Cursos'),
  () => import('../pages/FlashcardsAreas'),
  () => import('../pages/FlashcardsTemas'),
  () => import('../pages/CodigoView'),
];

// ========== FASE 2: rotas populares + simulados (após delay) ==========
const PHASE2_IMPORTANT = [
  () => import('../pages/Ferramentas'),
  () => import('../pages/NoticiasJuridicas'),
  () => import('../pages/ferramentas/QuestoesHubNovo'),
  () => import('../pages/ResumosJuridicosTrilhas'),
  () => import('../pages/JuriFlix'),
  () => import('../pages/BloggerJuridico'),
  () => import('../pages/Pesquisar'),
  () => import('../pages/JogosJuridicos'),
  () => import('../pages/TelaHub'),
  () => import('../pages/Codigos'),
  () => import('../pages/AudioaulasSpotify'),
  () => import('../pages/AulasPage'),
  () => import('../pages/ferramentas/SimuladosHub'),
  () => import('../pages/ferramentas/SimuladosCargolista'),
  () => import('../pages/ferramentas/SimuladoEscreventeResolver'),
  () => import('../pages/ferramentas/SimuladoDinamicoResolver'),
  () => import('../pages/ferramentas/SimuladoConcursoResolver'),
  () => import('../pages/SimuladosRealizar'),
];

function loadBatch(loaders: (() => Promise<any>)[], batchSize = 2, delayMs = 100) {
  let index = 0;
  
  function loadNext() {
    if (index >= loaders.length) return;
    
    const batch = loaders.slice(index, index + batchSize);
    index += batchSize;
    
    Promise.all(batch.map(loader => loader().catch(() => {}))).then(() => {
      setTimeout(loadNext, delayMs);
    });
  }
  
  loadNext();
}

let hasStarted = false;

/**
 * Hook que pré-carrega chunks JS críticos de forma progressiva.
 * Mobile: timings agressivos (2s / 6s) para toque rápido.
 * Desktop: timings moderados (4s / 12s).
 */
export const useAggressiveChunkPreloader = () => {
  const started = useRef(false);

  useEffect(() => {
    if (started.current || hasStarted) return;
    started.current = true;
    hasStarted = true;

    const isDesktop = window.innerWidth >= 1024;
    const phase1Delay = isDesktop ? 4000 : 2000;
    const phase2Delay = isDesktop ? 12000 : 6000;
    const batchSize = 2;
    const batchDelay = 100;

    // Fase 1: chunks críticos
    setTimeout(() => {
      loadBatch(PHASE1_CRITICAL, batchSize, batchDelay);
    }, phase1Delay);

    // Fase 2: chunks importantes
    setTimeout(() => {
      loadBatch(PHASE2_IMPORTANT, batchSize, batchDelay);
    }, phase2Delay);
  }, []);
};

export default useAggressiveChunkPreloader;
