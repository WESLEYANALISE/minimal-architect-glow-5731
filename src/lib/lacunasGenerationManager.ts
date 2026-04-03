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

const MAX_CONCURRENT = 5;
const MAX_ATTEMPTS = 3;

class LacunasGenerationManager {
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
    this.listeners.get(area)?.forEach(fn => fn(state));
  }

  isRunning(area: string): boolean {
    return this.activeGenerations.get(area)?.isRunning || false;
  }

  getState(area: string): AreaGenerationState | null {
    return this.activeGenerations.get(area) || null;
  }

  async startArea(area: string, temasPendentes: { tema: string }[]) {
    if (this.isRunning(area)) return;
    // Filter out empty/null temas
    const temasValidos = temasPendentes.filter(t => t.tema && t.tema.trim() !== '');
    if (temasValidos.length === 0) return;

    const jobs: GenerationJob[] = temasValidos.map(t => ({
      area, tema: t.tema, status: 'pending' as const,
    }));

    const state: AreaGenerationState = {
      area, jobs, totalGerados: 0, isRunning: true, startedAt: Date.now(),
    };

    this.activeGenerations.set(area, state);
    this.notify(area);

    console.log(`🚀 [LacunasGen] Iniciando: ${jobs.length} temas para ${area}`);
    await this.processParallel(area);

    state.isRunning = false;
    this.notify(area);
    console.log(`🎉 [LacunasGen] Completo para ${area}: ${state.totalGerados} lacunas`);
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
        console.error(`❌ [LacunasGen] Erro em ${nextJob.tema}:`, err);
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

    while (hasMore && attempts < MAX_ATTEMPTS) {
      attempts++;
      const { data: resumos, error: resumosError } = await supabase
        .from('RESUMO')
        .select('id, tema, subtema, conteudo')
        .ilike('area', area)
        .ilike('tema', tema)
        .not('conteudo', 'is', null);

      if (resumosError || !resumos || resumos.length === 0) {
        console.log(`⚠️ [LacunasGen] Nenhum resumo encontrado para ${area} > ${tema}, pulando...`);
        return totalGerados;
      }

      const { data, error } = await supabase.functions.invoke('gerar-flashcards-lacunas', {
        body: { area, tema, resumos }
      });

      if (error) return totalGerados;

      const geradosNestaChamada = data?.flashcards_gerados || 0;
      totalGerados += geradosNestaChamada;
      hasMore = !data?.geracao_completa;

      // Guard: if 0 cards generated, stop to avoid infinite loop
      if (geradosNestaChamada === 0) {
        console.log(`🛑 [LacunasGen] 0 lacunas geradas para ${tema}, parando loop.`);
        break;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    return totalGerados;
  }
}

export const lacunasGenManager = new LacunasGenerationManager();
