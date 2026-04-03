import { supabase } from '@/integrations/supabase/client';

/**
 * Global Metodologia Generation Manager
 * 
 * Similar to flashcardGenManager but for Cornell/Feynman methodologies.
 * Processes ALL pending temas in parallel (up to 3 simultaneous).
 */

interface GenerationJob {
  area: string;
  tema: string;
  metodo: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

interface AreaGenerationState {
  area: string;
  metodo: string;
  jobs: GenerationJob[];
  totalGerados: number;
  isRunning: boolean;
  startedAt: number;
}

type Listener = (state: AreaGenerationState | null) => void;

const MAX_CONCURRENT = 3;

class MetodologiaGenerationManager {
  private activeGenerations: Map<string, AreaGenerationState> = new Map();
  private listeners: Map<string, Set<Listener>> = new Map();

  private getKey(metodo: string, area: string) {
    return `${metodo}::${area}`;
  }

  subscribe(metodo: string, area: string, listener: Listener): () => void {
    const key = this.getKey(metodo, area);
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);
    listener(this.activeGenerations.get(key) || null);
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  private notify(metodo: string, area: string) {
    const key = this.getKey(metodo, area);
    const state = this.activeGenerations.get(key) || null;
    this.listeners.get(key)?.forEach(fn => fn(state));
  }

  isRunning(metodo: string, area: string): boolean {
    return this.activeGenerations.get(this.getKey(metodo, area))?.isRunning || false;
  }

  async startArea(metodo: string, area: string, temasPendentes: { tema: string }[]) {
    const key = this.getKey(metodo, area);
    if (this.isRunning(metodo, area)) return;
    if (temasPendentes.length === 0) return;

    const jobs: GenerationJob[] = temasPendentes.map(t => ({
      area,
      tema: t.tema,
      metodo,
      status: 'pending' as const,
    }));

    const state: AreaGenerationState = {
      area,
      metodo,
      jobs,
      totalGerados: 0,
      isRunning: true,
      startedAt: Date.now(),
    };

    this.activeGenerations.set(key, state);
    this.notify(metodo, area);

    console.log(`🚀 [MetodologiaGen] Iniciando ${metodo}: ${jobs.length} temas para ${area}`);

    await this.processParallel(metodo, area);

    state.isRunning = false;
    this.notify(metodo, area);

    const elapsed = ((Date.now() - state.startedAt) / 1000).toFixed(0);
    console.log(`🎉 [MetodologiaGen] Completo ${metodo} para ${area}: ${state.totalGerados} gerados em ${elapsed}s`);
  }

  private async processParallel(metodo: string, area: string) {
    const key = this.getKey(metodo, area);
    const state = this.activeGenerations.get(key);
    if (!state) return;

    const runNext = async (): Promise<void> => {
      const nextJob = state.jobs.find(j => j.status === 'pending');
      if (!nextJob) return;

      nextJob.status = 'running';
      this.notify(metodo, area);

      try {
        const gerados = await this.generateForTema(metodo, area, nextJob.tema);
        nextJob.status = 'done';
        state.totalGerados += gerados;
      } catch (err) {
        console.error(`❌ [MetodologiaGen] Erro em ${nextJob.tema}:`, err);
        nextJob.status = 'error';
      }

      this.notify(metodo, area);
      await runNext();
    };

    const workers = Array.from({ length: MAX_CONCURRENT }, () => runNext());
    await Promise.all(workers);
  }

  private async generateForTema(metodo: string, area: string, tema: string): Promise<number> {
    // Fetch subtemas for this tema
    const { data: resumos, error } = await supabase
      .from('RESUMO')
      .select('subtema')
      .ilike('area', area)
      .ilike('tema', tema)
      .not('subtema', 'is', null);

    if (error || !resumos) {
      console.error(`❌ [MetodologiaGen] Sem resumos para ${tema}`);
      return 0;
    }

    const subtemas = [...new Set(resumos.map(r => r.subtema).filter(Boolean))];
    
    // Check which are already generated
    const { data: gerados } = await supabase
      .from('METODOLOGIAS_GERADAS')
      .select('subtema')
      .eq('area', area)
      .eq('tema', tema)
      .eq('metodo', metodo);

    const geradosSet = new Set((gerados || []).map(g => g.subtema));
    const pendentes = subtemas.filter(s => !geradosSet.has(s));

    if (pendentes.length === 0) {
      // Generate tema-level if no subtemas or all done
      const { data: temaGerado } = await supabase
        .from('METODOLOGIAS_GERADAS')
        .select('id')
        .eq('area', area)
        .eq('tema', tema)
        .eq('metodo', metodo)
        .eq('subtema', '')
        .maybeSingle();

      if (!temaGerado) {
        const { error: genError } = await supabase.functions.invoke('gerar-metodologia', {
          body: { area, tema, metodo }
        });
        if (genError) throw genError;
        return 1;
      }
      return 0;
    }

    let count = 0;
    for (const subtema of pendentes) {
      try {
        const { error: genError } = await supabase.functions.invoke('gerar-metodologia', {
          body: { area, tema, metodo, subtema }
        });
        if (!genError) count++;
        // Small delay between calls
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`❌ [MetodologiaGen] Erro subtema ${subtema}:`, err);
      }
    }

    return count;
  }
}

export const metodologiaGenManager = new MetodologiaGenerationManager();
