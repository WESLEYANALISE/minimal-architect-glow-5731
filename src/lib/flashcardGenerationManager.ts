import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Global Flashcard Generation Manager
 * 
 * Roda fora do ciclo de vida dos componentes React.
 * Processa TODOS os temas pendentes em paralelo (até 5 simultâneos).
 * Continua gerando mesmo se o usuário sair da página.
 * Usa Supabase Realtime para notificar a UI sobre novos flashcards gerados.
 */

interface GenerationJob {
  area: string;
  tema: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

interface AreaGenerationState {
  area: string;
  jobs: GenerationJob[];
  totalGerados: number;
  isRunning: boolean;
  startedAt: number;
}

type Listener = (state: AreaGenerationState | null) => void;

const MAX_CONCURRENT = 5; // 5 temas simultâneos

class FlashcardGenerationManager {
  private activeGenerations: Map<string, AreaGenerationState> = new Map();
  private listeners: Map<string, Set<Listener>> = new Map();
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  /** Subscribe to generation updates for an area */
  subscribe(area: string, listener: Listener): () => void {
    if (!this.listeners.has(area)) {
      this.listeners.set(area, new Set());
    }
    this.listeners.get(area)!.add(listener);
    
    // Emit current state immediately
    listener(this.activeGenerations.get(area) || null);
    
    return () => {
      this.listeners.get(area)?.delete(listener);
    };
  }

  private notify(area: string) {
    const state = this.activeGenerations.get(area) || null;
    this.listeners.get(area)?.forEach(fn => fn(state));
  }

  /** Check if generation is already running for an area */
  isRunning(area: string): boolean {
    return this.activeGenerations.get(area)?.isRunning || false;
  }

  /** Get current state for an area */
  getState(area: string): AreaGenerationState | null {
    return this.activeGenerations.get(area) || null;
  }

  /** Start generating ALL pending themes for an area */
  async startArea(area: string, temasPendentes: { tema: string; resumos?: any[] }[]) {
    if (this.isRunning(area)) {
      console.log(`⏩ [GenManager] Geração já em andamento para ${area}`);
      return;
    }

    if (temasPendentes.length === 0) {
      console.log(`✅ [GenManager] Nenhum tema pendente para ${area}`);
      return;
    }

    const jobs: GenerationJob[] = temasPendentes.map(t => ({
      area,
      tema: t.tema,
      status: 'pending' as const,
    }));

    const state: AreaGenerationState = {
      area,
      jobs,
      totalGerados: 0,
      isRunning: true,
      startedAt: Date.now(),
    };

    this.activeGenerations.set(area, state);
    this.notify(area);

    // Subscribe to Realtime for instant UI updates on new flashcards
    this.subscribeRealtime(area);

    console.log(`🚀 [GenManager] Iniciando geração paralela: ${jobs.length} temas para ${area}`);

    // Process in parallel batches
    await this.processParallel(area);

    // Done
    state.isRunning = false;
    this.notify(area);
    
    // Unsubscribe from Realtime after completion
    this.unsubscribeRealtime(area);
    
    const elapsed = ((Date.now() - state.startedAt) / 1000).toFixed(0);
    console.log(`🎉 [GenManager] Geração completa para ${area}: ${state.totalGerados} flashcards em ${elapsed}s`);
  }

  /** Subscribe to Realtime INSERT events on FLASHCARDS_GERADOS for this area */
  private subscribeRealtime(area: string) {
    if (this.realtimeChannels.has(area)) return;

    const channel = supabase
      .channel(`flashcards-gen-${area}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'FLASHCARDS_GERADOS',
          filter: `area=eq.${area}`,
        },
        (payload) => {
          // Notify listeners about new flashcard inserted
          const state = this.activeGenerations.get(area);
          if (state) {
            this.notify(area);
          }
        }
      )
      .subscribe();

    this.realtimeChannels.set(area, channel);
  }

  /** Unsubscribe from Realtime channel */
  private unsubscribeRealtime(area: string) {
    const channel = this.realtimeChannels.get(area);
    if (channel) {
      supabase.removeChannel(channel);
      this.realtimeChannels.delete(area);
    }
  }

  private async processParallel(area: string) {
    const state = this.activeGenerations.get(area);
    if (!state) return;

    const runNext = async (): Promise<void> => {
      const nextJob = state.jobs.find(j => j.status === 'pending');
      if (!nextJob) return;

      nextJob.status = 'running';
      this.notify(area);

      try {
        const gerados = await this.generateForTema(area, nextJob.tema);
        nextJob.status = 'done';
        state.totalGerados += gerados;
      } catch (err) {
        console.error(`❌ [GenManager] Erro em ${nextJob.tema}:`, err);
        nextJob.status = 'error';
      }

      this.notify(area);

      // Continue with next pending
      await runNext();
    };

    // Launch MAX_CONCURRENT workers
    const workers = Array.from({ length: MAX_CONCURRENT }, () => runNext());
    await Promise.all(workers);
  }

  private async generateForTema(area: string, tema: string): Promise<number> {
    let totalGerados = 0;
    let hasMore = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (hasMore && attempts < MAX_ATTEMPTS) {
      attempts++;
      // Fetch resumos for this tema
      const { data: resumos, error: resumosError } = await supabase
        .from('RESUMO')
        .select('id, tema, subtema, conteudo')
        .ilike('area', area)
        .ilike('tema', tema);

      if (resumosError || !resumos || resumos.length === 0) {
        console.error(`❌ [GenManager] Sem resumos para ${tema}`);
        return totalGerados;
      }

      const { data, error } = await supabase.functions.invoke('gerar-flashcards-tema', {
        body: { area, tema, resumos }
      });

      if (error) {
        console.error(`❌ [GenManager] Erro na geração de ${tema}:`, error);
        return totalGerados;
      }

      // Se retornou 0 e completo, não há conteúdo — parar
      if (data?.flashcards_gerados === 0 && data?.geracao_completa) {
        console.log(`⏭️ [GenManager] ${tema}: sem conteúdo para gerar, pulando`);
        return 0;
      }

      totalGerados += data?.flashcards_gerados || 0;
      hasMore = !data?.geracao_completa;

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    console.log(`✅ [GenManager] ${tema}: ${totalGerados} flashcards gerados`);
    return totalGerados;
  }
}

// Singleton instance — persists across navigation
export const flashcardGenManager = new FlashcardGenerationManager();
