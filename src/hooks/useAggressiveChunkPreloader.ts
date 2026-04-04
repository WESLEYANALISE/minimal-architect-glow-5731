import { useEffect, useRef } from 'react';

// ========== FASE 1: Top 4 rotas mais acessadas (imediato) ==========
const PHASE1_CRITICAL = [
  () => import('../pages/Bibliotecas'),
  () => import('../pages/VadeMecumTodas'),
  () => import('../pages/Cursos'),
  () => import('../pages/FlashcardsAreas'),
];

// ========== FASE 2: rotas populares + simulados (após 3s) ==========
const PHASE2_IMPORTANT = [
  () => import('../pages/Ferramentas'),
  () => import('../pages/NoticiasJuridicas'),
  () => import('../pages/ferramentas/QuestoesHub'),
  () => import('../pages/ResumosJuridicosTrilhas'),
  () => import('../pages/JuriFlix'),
  () => import('../pages/BloggerJuridico'),
  () => import('../pages/Pesquisar'),
  () => import('../pages/JogosJuridicos'),
  () => import('../pages/TelaHub'),
  () => import('../pages/Codigos'),
  // Simulados — chunks críticos
  () => import('../pages/ferramentas/SimuladosHub'),
  () => import('../pages/ferramentas/SimuladosCargolista'),
  () => import('../pages/ferramentas/SimuladoEscreventeResolver'),
  () => import('../pages/ferramentas/SimuladoDinamicoResolver'),
  () => import('../pages/ferramentas/SimuladoConcursoResolver'),
  () => import('../pages/SimuladosRealizar'),
];

// FASE 3 REMOVIDA — todas as demais rotas carregam sob demanda

function loadBatch(loaders: (() => Promise<any>)[], batchSize = 2, delayMs = 200) {
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
 * Desktop usa timings mais conservadores para não competir com rendering pesado.
 */
export const useAggressiveChunkPreloader = () => {
  const started = useRef(false);

  useEffect(() => {
    if (started.current || hasStarted) return;
    started.current = true;
    hasStarted = true;

    // Detect desktop (wider viewport = heavier rendering = more conservative preload)
    const isDesktop = window.innerWidth >= 1024;
    const phase1Delay = isDesktop ? 8000 : 5000;
    const phase2Delay = isDesktop ? 25000 : 15000;
    const batchSize = isDesktop ? 1 : 2;
    const batchDelay = isDesktop ? 400 : 200;

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
