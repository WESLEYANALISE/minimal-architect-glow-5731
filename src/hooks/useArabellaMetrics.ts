import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserTrialMetrics } from './useUserTrialMetrics';

export interface ArabellaMetrics {
  // Trial metrics
  tempoTelaMinutos: number;
  diasAtivos: number;
  topFuncoes: string[];
  // Aulas
  aulasAcessadas: number;
  aulasConcluidasCount: number;
  aulasEmAndamento: number;
  melhorArea: string;
  notaMedia: number;
  areasEstudadas: string[];
  progressoMedio: number;
  streak: number;
  // Loading
  loading: boolean;
}

const METRICS_CACHE_KEY = 'arabella_metrics_cache';

function getCachedMetrics(): Omit<ArabellaMetrics, 'loading'> | null {
  try {
    const raw = localStorage.getItem(METRICS_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveCachedMetrics(m: Omit<ArabellaMetrics, 'loading'>) {
  try {
    localStorage.setItem(METRICS_CACHE_KEY, JSON.stringify(m));
  } catch {}
}

export function useArabellaMetrics(): ArabellaMetrics {
  const { user } = useAuth();
  const trialMetrics = useUserTrialMetrics();
  const [aulasData, setAulasData] = useState({
    aulasAcessadas: 0,
    aulasConcluidasCount: 0,
    aulasEmAndamento: 0,
    melhorArea: '',
    notaMedia: 0,
    areasEstudadas: [] as string[],
    progressoMedio: 0,
    streak: 0,
  });
  const [aulasLoading, setAulasLoading] = useState(true);

  const cached = useMemo(() => getCachedMetrics(), []);

  useEffect(() => {
    if (!user) { setAulasLoading(false); return; }

    const fetchAulasStats = async () => {
      try {
        // Fetch aulas_progresso for the user
        const { data: progresso } = await supabase
          .from('aulas_progresso')
          .select('*, aulas_interativas(titulo, area)')
          .eq('user_id', user.id);

        const items = (progresso || []) as any[];
        const concluidas = items.filter(i => i.concluida === true);
        const emAndamento = items.filter(i => !i.concluida && (i.progresso_percentual || 0) > 0);

        // Areas studied
        const areasSet = new Set<string>();
        const areaProgress: Record<string, { total: number; count: number; notas: number[] }> = {};
        
        items.forEach((item: any) => {
          const area = item.aulas_interativas?.area || 'Geral';
          areasSet.add(area);
          if (!areaProgress[area]) areaProgress[area] = { total: 0, count: 0, notas: [] };
          areaProgress[area].total += (item.progresso_percentual || 0);
          areaProgress[area].count += 1;
          if (item.nota_prova_final != null) areaProgress[area].notas.push(item.nota_prova_final);
        });

        // Best area (highest average progress)
        let melhorArea = '';
        let melhorMedia = 0;
        Object.entries(areaProgress).forEach(([area, data]) => {
          const media = data.total / data.count;
          if (media > melhorMedia) { melhorMedia = media; melhorArea = area; }
        });

        // Average score across all completed aulas with notas
        const todasNotas = items.filter(i => i.nota_prova_final != null).map(i => i.nota_prova_final as number);
        const notaMedia = todasNotas.length > 0 ? Math.round(todasNotas.reduce((a, b) => a + b, 0) / todasNotas.length) : 0;

        // Average progress
        const progressoMedio = items.length > 0
          ? Math.round(items.reduce((acc, i) => acc + (i.progresso_percentual || 0), 0) / items.length)
          : 0;

        // Also check conceitos progress
        const { data: conceitosP } = await supabase
          .from('oab_trilhas_estudo_progresso')
          .select('id, leitura_completa, progresso_leitura')
          .eq('user_id', user.id);

        const conceitosItems = (conceitosP || []) as any[];
        const conceitosAcessados = conceitosItems.filter(c => (c.progresso_leitura || 0) > 0).length;
        const conceitosConcluidos = conceitosItems.filter(c => c.leitura_completa === true).length;

        // Calculate streak from trial metrics
        const streakVal = trialMetrics.diasAtivos >= 2 ? trialMetrics.diasAtivos : 0;

        setAulasData({
          aulasAcessadas: items.length + conceitosAcessados,
          aulasConcluidasCount: concluidas.length + conceitosConcluidos,
          aulasEmAndamento: emAndamento.length + (conceitosAcessados - conceitosConcluidos),
          melhorArea,
          notaMedia,
          areasEstudadas: Array.from(areasSet),
          progressoMedio,
          streak: streakVal,
        });
      } catch {
        // fallback
      } finally {
        setAulasLoading(false);
      }
    };

    fetchAulasStats();
  }, [user, trialMetrics.diasAtivos]);

  const queriesLoading = trialMetrics.loading || aulasLoading;
  const loading = cached ? false : queriesLoading;

  const result: ArabellaMetrics = queriesLoading && cached
    ? { ...cached, loading: false }
    : {
        tempoTelaMinutos: trialMetrics.tempoTelaMinutos,
        diasAtivos: trialMetrics.diasAtivos,
        topFuncoes: trialMetrics.topFuncoes,
        ...aulasData,
        loading,
      };

  useEffect(() => {
    if (!queriesLoading) {
      const { loading: _, ...toCache } = result;
      saveCachedMetrics(toCache);
    }
  }, [queriesLoading]);

  return result;
}

export function gerarMensagemArabella(m: ArabellaMetrics, nome?: string | null): string {
  const hora = new Date().getHours();
  const saudacao = hora >= 5 && hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  if (m.loading) return `${saudacao}${nome ? ', <b>' + nome + '</b>' : ''}! Carregando seus dados...`;

  const parts: string[] = [`${saudacao}${nome ? ', <b>' + nome + '</b>' : ''}!`];

  if (m.aulasAcessadas > 0) {
    parts.push(`Você acessou <b>${m.aulasAcessadas}</b> aula${m.aulasAcessadas !== 1 ? 's' : ''} no total.`);
    
    if (m.aulasConcluidasCount > 0) {
      parts.push(`Concluiu <b>${m.aulasConcluidasCount}</b> e tem <b>${m.aulasEmAndamento}</b> em andamento.`);
    }
  }

  if (m.melhorArea) {
    parts.push(`Sua área mais forte: <b>${m.melhorArea}</b>.`);
  }

  if (m.notaMedia > 0) {
    parts.push(`Nota média nas provas: <b>${m.notaMedia}%</b>.`);
  }

  if (m.progressoMedio > 0 && m.aulasAcessadas > 0) {
    parts.push(`Progresso médio: <b>${m.progressoMedio}%</b>.`);
  }

  if (m.tempoTelaMinutos > 0) {
    const horas = Math.floor(m.tempoTelaMinutos / 60);
    const min = m.tempoTelaMinutos % 60;
    const tempo = horas > 0 ? `${horas}h${min > 0 ? min + 'min' : ''}` : `${min}min`;
    parts.push(`Tempo de estudo: <b>${tempo}</b> em <b>${m.diasAtivos}</b> dia${m.diasAtivos !== 1 ? 's' : ''}.`);
  }

  if (m.streak > 1) {
    parts.push(`Sequência de <b>${m.streak} dias</b> seguidos estudando 🔥`);
  }

  if (parts.length === 1) {
    parts.push('Comece suas aulas hoje e eu vou acompanhar seu progresso! Explore as áreas do Direito e avance na sua jornada.');
  } else {
    if (m.progressoMedio >= 70) {
      parts.push('Excelente progresso! Continue assim 💪');
    } else if (m.aulasConcluidasCount > 0) {
      parts.push('Bom ritmo! Continue avançando nas aulas.');
    }
  }

  return parts.join(' ');
}

export function gerarFeedbackCompletoArabella(m: ArabellaMetrics, nome?: string | null): string {
  const hora = new Date().getHours();
  const saudacao = hora >= 5 && hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const nomeTag = nome ? `, <b>${nome}</b>` : '';

  if (m.loading) return '';

  const paragraphs: string[] = [];

  // P1: Overview
  let p1 = `${saudacao}${nomeTag}! Aqui está seu relatório completo de progresso nas aulas.`;
  if (m.diasAtivos > 0) {
    p1 += ` Você esteve ativo por <b>${m.diasAtivos} dia${m.diasAtivos !== 1 ? 's' : ''}</b>.`;
  }
  if (m.tempoTelaMinutos > 0) {
    const horas = Math.floor(m.tempoTelaMinutos / 60);
    const min = m.tempoTelaMinutos % 60;
    const tempo = horas > 0 ? `${horas}h${min > 0 ? min + 'min' : ''}` : `${min}min`;
    p1 += ` Tempo total de estudo: <b>${tempo}</b>.`;
  }
  if (m.streak > 1) {
    p1 += ` Sequência de <b>${m.streak} dias</b> seguidos! 🔥`;
  }
  paragraphs.push(p1);

  // P2: Aulas details
  let p2 = '';
  if (m.aulasAcessadas > 0) {
    p2 += `<b>Aulas:</b> Você acessou <b>${m.aulasAcessadas}</b> aula${m.aulasAcessadas !== 1 ? 's' : ''}, concluiu <b>${m.aulasConcluidasCount}</b> e tem <b>${m.aulasEmAndamento}</b> em andamento. `;
    p2 += `Seu progresso médio está em <b>${m.progressoMedio}%</b>.`;
    if (m.notaMedia > 0) {
      p2 += ` Nota média nas avaliações: <b>${m.notaMedia}%</b>.`;
      if (m.notaMedia >= 80) {
        p2 += ' Excelente desempenho nas provas!';
      } else if (m.notaMedia >= 60) {
        p2 += ' Bom desempenho, continue revisando.';
      } else {
        p2 += ' Revise o conteúdo antes de avançar para novas aulas.';
      }
    }
  } else {
    p2 += 'Você ainda não iniciou nenhuma aula. Comece pela Jornada de Estudos para trilhar seu caminho no Direito!';
  }
  paragraphs.push(p2);

  // P3: Areas
  let p3 = '';
  if ((m.areasEstudadas || []).length > 0) {
    p3 += `<b>Áreas estudadas:</b> ${(m.areasEstudadas || []).join(', ')}. `;
    if (m.melhorArea) {
      p3 += `Sua área mais forte é <b>${m.melhorArea}</b>. `;
    }
    p3 += 'Diversificar as áreas de estudo fortalece sua base jurídica.';
  } else {
    p3 += 'Explore as diversas áreas do Direito disponíveis: Constitucional, Civil, Penal, Administrativo e muito mais.';
  }
  paragraphs.push(p3);

  // P4: Recommendation
  let p4 = '<b>Recomendação:</b> ';
  if (m.aulasAcessadas === 0) {
    p4 += 'Comece pela Trilha de Conceitos para construir uma base sólida, depois avance para as Áreas do Direito. Consistência é a chave!';
  } else if (m.aulasEmAndamento > 3) {
    p4 += `Você tem <b>${m.aulasEmAndamento}</b> aulas em andamento. Considere concluir algumas antes de iniciar novas para consolidar o aprendizado.`;
  } else if (m.progressoMedio < 40) {
    p4 += 'Seu progresso médio está baixo. Dedique mais tempo a cada aula antes de avançar para a próxima.';
  } else if (m.streak >= 5) {
    p4 += 'Sua constância é admirável! Mantenha esse ritmo e considere explorar novas áreas do Direito.';
  } else {
    p4 += 'Tente manter uma rotina diária de estudo, mesmo que breve. Estudar um pouco todos os dias é mais eficaz. 💪';
  }
  paragraphs.push(p4);

  return paragraphs.map(p => `<p style="margin-bottom: 8px">${p}</p>`).join('');
}
