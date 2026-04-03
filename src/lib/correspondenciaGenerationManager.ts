import { supabase } from '@/integrations/supabase/client';

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

const MAX_CONCURRENT = 3;
const MAX_ATTEMPTS_PER_TEMA = 10;

class CorrespondenciaGenerationManager {
  private activeGenerations: Map<string, AreaGenerationState> = new Map();
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(area: string, listener: Listener): () => void {
    if (!this.listeners.has(area)) {
      this.listeners.set(area, new Set());
    }
    this.listeners.get(area)!.add(listener);
    listener(this.activeGenerations.get(area) || null);
    return () => { this.listeners.get(area)?.delete(listener); };
  }

  private notify(area: string) {
    const state = this.activeGenerations.get(area) || null;
    this.listeners.get(area)?.forEach((listener) => listener(state));
  }

  isRunning(area: string): boolean {
    return this.activeGenerations.get(area)?.isRunning || false;
  }

  async startArea(area: string, temasPendentes: { tema: string }[]) {
    if (this.isRunning(area) || temasPendentes.length === 0) return;

    const jobs: GenerationJob[] = temasPendentes.map((t) => ({
      area, tema: t.tema, status: 'pending',
    }));

    const state: AreaGenerationState = {
      area, jobs, totalGerados: 0, isRunning: true, startedAt: Date.now(),
    };

    this.activeGenerations.set(area, state);
    this.notify(area);
    await this.processParallel(area);
    state.isRunning = false;
    this.notify(area);
  }

  private async processParallel(area: string) {
    const state = this.activeGenerations.get(area);
    if (!state) return;

    const runNext = async (): Promise<void> => {
      const nextJob = state.jobs.find((job) => job.status === 'pending');
      if (!nextJob) return;

      nextJob.status = 'running';
      this.notify(area);

      try {
        const gerados = await this.generateForTema(area, nextJob.tema);
        nextJob.status = 'done';
        state.totalGerados += gerados;
      } catch (error) {
        console.error(`❌ [CorrespGen] Erro em ${nextJob.tema}:`, error);
        nextJob.status = 'error';
      }

      this.notify(area);
      await runNext();
    };

    const workers = Array.from({ length: MAX_CONCURRENT }, () => runNext());
    await Promise.all(workers);
  }

  private async generateForTema(area: string, tema: string): Promise<number> {
    let totalGerados = 0;
    let hasMore = true;
    let attempts = 0;

    while (hasMore && attempts < MAX_ATTEMPTS_PER_TEMA) {
      attempts++;

      const { data, error } = await supabase.functions.invoke('gerar-questoes-correspondencia', {
        body: { area, tema },
      });

      if (error) throw error;

      totalGerados += data?.questoes_geradas || 0;
      hasMore = !data?.geracao_completa;

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    return totalGerados;
  }
}

export const correspondenciaGenManager = new CorrespondenciaGenerationManager();
