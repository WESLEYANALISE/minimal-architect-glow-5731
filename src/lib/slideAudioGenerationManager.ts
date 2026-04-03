import { supabase } from '@/integrations/supabase/client';

/**
 * Global Slide Audio Generation Manager
 * 
 * Singleton que persiste fora do ciclo de vida React.
 * Gera áudio para TODOS os slides de um tópico, 3 simultâneos.
 * Continua gerando mesmo se o usuário sair da página/aula.
 */

interface AudioJob {
  topicoId: number | string;
  secaoIndex: number;
  slideIndex: number;
  status: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  narracaoUrl?: string;
}

interface TopicGenerationState {
  topicoId: number | string;
  tabelaAlvo: string;
  campoJson: string;
  jobs: AudioJob[];
  totalGerados: number;
  totalSkipped: number;
  isRunning: boolean;
  startedAt: number;
}

type Listener = (state: TopicGenerationState | null) => void;

const MAX_CONCURRENT = 3;
const DELAY_BETWEEN_MS = 2000;

class SlideAudioGenerationManager {
  private activeGenerations: Map<string, TopicGenerationState> = new Map();
  private listeners: Map<string, Set<Listener>> = new Map();

  private key(topicoId: number | string): string {
    return String(topicoId);
  }

  subscribe(topicoId: number | string, listener: Listener): () => void {
    const k = this.key(topicoId);
    if (!this.listeners.has(k)) this.listeners.set(k, new Set());
    this.listeners.get(k)!.add(listener);
    listener(this.activeGenerations.get(k) || null);
    return () => { this.listeners.get(k)?.delete(listener); };
  }

  private notify(topicoId: number | string) {
    const k = this.key(topicoId);
    const state = this.activeGenerations.get(k) || null;
    this.listeners.get(k)?.forEach(fn => fn(state));
  }

  isRunning(topicoId: number | string): boolean {
    return this.activeGenerations.get(this.key(topicoId))?.isRunning || false;
  }

  getState(topicoId: number | string): TopicGenerationState | null {
    return this.activeGenerations.get(this.key(topicoId)) || null;
  }

  /**
   * Inicia geração de áudio para todos os slides sem narração de um tópico.
   * Recebe as seções com slides para mapear quais precisam de áudio.
   */
  async startTopic(
    topicoId: number | string,
    secoes: Array<{ slides: Array<{ tipo?: string; narracaoUrl?: string }> }>,
    tabelaAlvo = 'categorias_topicos',
    campoJson = 'conteudo_gerado'
  ) {
    const k = this.key(topicoId);
    if (this.isRunning(topicoId)) {
      console.log(`⏩ [SlideAudioGen] Já em andamento para tópico ${topicoId}`);
      return;
    }

    // Build jobs for slides that need audio
    const jobs: AudioJob[] = [];
    secoes.forEach((secao, si) => {
      secao.slides.forEach((slide, pi) => {
        if (slide.tipo === 'quickcheck') return; // Skip quiz slides
        if (slide.narracaoUrl) return; // Already has audio
        jobs.push({
          topicoId,
          secaoIndex: si,
          slideIndex: pi,
          status: 'pending',
        });
      });
    });

    if (jobs.length === 0) {
      console.log(`✅ [SlideAudioGen] Tópico ${topicoId}: todos os slides já têm áudio`);
      return;
    }

    const state: TopicGenerationState = {
      topicoId,
      tabelaAlvo,
      campoJson,
      jobs,
      totalGerados: 0,
      totalSkipped: 0,
      isRunning: true,
      startedAt: Date.now(),
    };

    this.activeGenerations.set(k, state);
    this.notify(topicoId);

    console.log(`🎙️ [SlideAudioGen] Iniciando: ${jobs.length} slides pendentes para tópico ${topicoId} (${MAX_CONCURRENT} simultâneos)`);

    await this.processParallel(topicoId);

    state.isRunning = false;
    this.notify(topicoId);

    const elapsed = ((Date.now() - state.startedAt) / 1000).toFixed(0);
    console.log(`🎉 [SlideAudioGen] Tópico ${topicoId} completo: ${state.totalGerados} áudios gerados, ${state.totalSkipped} pulados em ${elapsed}s`);
  }

  private async processParallel(topicoId: number | string) {
    const k = this.key(topicoId);
    const state = this.activeGenerations.get(k);
    if (!state) return;

    const runNext = async (): Promise<void> => {
      const nextJob = state.jobs.find(j => j.status === 'pending');
      if (!nextJob) return;

      nextJob.status = 'running';
      this.notify(topicoId);

      try {
        const result = await this.generateAudioForSlide(
          topicoId,
          nextJob.secaoIndex,
          nextJob.slideIndex,
          state.tabelaAlvo,
          state.campoJson
        );

        if (result.narracaoUrl) {
          nextJob.status = 'done';
          nextJob.narracaoUrl = result.narracaoUrl;
          state.totalGerados++;
        } else {
          nextJob.status = 'skipped';
          state.totalSkipped++;
        }
      } catch (err: any) {
        const isQuota = err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('Quota');
        console.error(`❌ [SlideAudioGen] Erro s${nextJob.secaoIndex}_p${nextJob.slideIndex}:`, err);
        nextJob.status = 'error';
        
        // If quota exhausted, mark all pending jobs as skipped to stop hammering the API
        if (isQuota) {
          console.warn(`⚠️ [SlideAudioGen] Quota esgotada, cancelando ${state.jobs.filter(j => j.status === 'pending').length} jobs restantes`);
          state.jobs.filter(j => j.status === 'pending').forEach(j => { j.status = 'skipped'; state.totalSkipped++; });
          this.notify(topicoId);
          return;
        }
      }

      this.notify(topicoId);

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MS));

      // Continue with next
      await runNext();
    };

    const workers = Array.from({ length: MAX_CONCURRENT }, () => runNext());
    await Promise.all(workers);
  }

  private async generateAudioForSlide(
    topicoId: number | string,
    secaoIndex: number,
    slideIndex: number,
    tabelaAlvo: string,
    campoJson: string
  ): Promise<{ narracaoUrl: string | null }> {
    const { data, error } = await supabase.functions.invoke('narrar-slide', {
      body: {
        topico_id: topicoId,
        secao_index: secaoIndex,
        slide_index: slideIndex,
        tabela_alvo: tabelaAlvo,
        campo_json: campoJson,
      },
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message || JSON.stringify(error)}`);
    }

    return { narracaoUrl: data?.narracaoUrl || null };
  }
}

// Singleton — persists across navigation
export const slideAudioGenManager = new SlideAudioGenerationManager();
