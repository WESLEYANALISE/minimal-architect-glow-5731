import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar, ArrowRight, Loader2, CalendarX, X, ExternalLink, Volume2, Pause } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import brasaoRepublica from "@/assets/brasao-republica.png?format=webp&quality=80";

interface LeiRecente {
  id: string;
  tipo: string;
  numero: string;
  data_publicacao: string;
  ementa: string;
  areas_direito?: string[] | null;
}

// Gerar tags automáticas baseadas no tipo e ementa
const gerarTags = (lei: LeiRecente): string[] => {
  const tags: string[] = [];
  const ementa = lei.ementa.toLowerCase();
  const tipo = lei.tipo.toLowerCase();
  
  if (tipo.includes('decreto')) tags.push('Decreto');
  else if (tipo.includes('complementar')) tags.push('LC');
  else if (tipo.includes('ordinária') || tipo.includes('lei')) tags.push('Lei');
  else if (tipo.includes('medida')) tags.push('MP');
  else tags.push(lei.tipo.split(' ')[0]);
  
  if (ementa.includes('tribut') || ementa.includes('fiscal') || ementa.includes('imposto')) tags.push('Tributário');
  else if (ementa.includes('penal') || ementa.includes('crime') || ementa.includes('pena')) tags.push('Penal');
  else if (ementa.includes('trabalh') || ementa.includes('emprego') || ementa.includes('clt')) tags.push('Trabalhista');
  else if (ementa.includes('civil') || ementa.includes('contrato')) tags.push('Civil');
  else if (ementa.includes('constituc')) tags.push('Constitucional');
  else if (ementa.includes('ambiente') || ementa.includes('ambiental')) tags.push('Ambiental');
  else if (ementa.includes('saúde') || ementa.includes('sus')) tags.push('Saúde');
  else if (ementa.includes('educação') || ementa.includes('ensino')) tags.push('Educação');
  else if (ementa.includes('previdên') || ementa.includes('aposentad')) tags.push('Previdência');
  else if (ementa.includes('consumidor')) tags.push('Consumidor');
  else if (ementa.includes('denomina') || ementa.includes('rodovia') || ementa.includes('homenagem')) tags.push('Honorífico');
  else if (ementa.includes('crédito') || ementa.includes('orçament')) tags.push('Orçamentário');
  else tags.push('Geral');
  
  if (ementa.includes('altera') || ementa.includes('alteração')) tags.push('Alteração');
  else if (ementa.includes('revoga')) tags.push('Revogação');
  else if (ementa.includes('institui') || ementa.includes('cria')) tags.push('Novo');
  else if (ementa.includes('regulament')) tags.push('Regulamenta');
  else tags.push('Publicado');
  
  return tags.slice(0, 3);
};

// Obter data/hora atual no fuso de Brasília (UTC-3)
const getDataHoraSaoPaulo = (): { year: number; month: number; day: number } => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brasiliaTime = new Date(utc - (3 * 60 * 60 * 1000));
  
  return {
    year: brasiliaTime.getFullYear(),
    month: brasiliaTime.getMonth() + 1,
    day: brasiliaTime.getDate()
  };
};

const getHojeSaoPaulo = (): string => {
  const { year, month, day } = getDataHoraSaoPaulo();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

export default function ResenhaDiariaCarousel({ desktopListMode = false }: { desktopListMode?: boolean } = {}) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showNoDataToast, setShowNoDataToast] = useState(false);
  const [showSobre, setShowSobre] = useState(false);
  const [isPlayingNarration, setIsPlayingNarration] = useState(false);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Gerar últimos 5 dias
  const diasDisponiveis = useMemo(() => {
    const dias: { dataStr: string; diaSemana: string; diaNum: string; mes: string }[] = [];
    const hojeSP = getHojeSaoPaulo();
    const [year, month, day] = hojeSP.split('-').map(Number);
    const hojeDate = new Date(year, month - 1, day);
    
    for (let i = 0; i < 5; i++) {
      const date = subDays(hojeDate, i);
      const dataStr = format(date, 'yyyy-MM-dd');
      const diaSemana = format(date, 'EEE', { locale: ptBR }).toUpperCase();
      
      dias.push({
        dataStr,
        diaSemana: i === 0 ? "HOJE" : diaSemana,
        diaNum: format(date, 'dd'),
        mes: format(date, 'MMM', { locale: ptBR }).toUpperCase()
      });
    }
    return dias;
  }, []);

  // Buscar quais datas têm leis disponíveis
  const { data: datasComLeis } = useQuery({
    queryKey: ['datas-com-leis'],
    queryFn: async () => {
      const datas = diasDisponiveis.map(d => d.dataStr);
      const { data, error } = await supabase
        .from('leis_push_2025')
        .select('data_publicacao')
        .in('data_publicacao', datas);

      if (error) throw error;
      const datasUnicas = [...new Set((data || []).map(d => d.data_publicacao).filter(Boolean))];
      return datasUnicas as string[];
    },
    staleTime: 1000 * 60 * 5
  });

  // Selecionar automaticamente a primeira data que tem leis
  useEffect(() => {
    if (datasComLeis && datasComLeis.length > 0 && !selectedDate) {
      const datasOrdenadas = [...datasComLeis].sort((a, b) => b.localeCompare(a));
      setSelectedDate(datasOrdenadas[0]);
    } else if (datasComLeis && datasComLeis.length === 0 && !selectedDate) {
      setSelectedDate(getHojeSaoPaulo());
    }
  }, [datasComLeis, selectedDate]);

  // Esconder footer quando modal Sobre está aberto
  useEffect(() => {
    const footers = document.querySelectorAll('nav[class*="fixed"][class*="bottom"], div[class*="fixed"][class*="bottom-0"][class*="z-"]');
    footers.forEach((el) => {
      (el as HTMLElement).style.display = showSobre ? 'none' : '';
    });
    return () => {
      footers.forEach((el) => {
        (el as HTMLElement).style.display = '';
      });
    };
  }, [showSobre]);

  const ensureNarrationAudioElement = (): HTMLAudioElement => {
    if (!narrationAudioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.onended = () => setIsPlayingNarration(false);
      audio.onerror = () => setIsPlayingNarration(false);
      narrationAudioRef.current = audio;
    }
    return narrationAudioRef.current;
  };

  // Iniciar narração com gesto do usuário para evitar bloqueio de autoplay
  const startNarration = async (fromUserGesture = false) => {
    const audio = ensureNarrationAudioElement();
    setIsPlayingNarration(true);

    try {
      if (fromUserGesture && !audio.src) {
        audio.play().catch(() => {});
        audio.pause();
        audio.currentTime = 0;
      }

      if (!audio.src) {
        const textoNarracao = "O Vade Mecum é a coletânea completa da legislação brasileira: Constituição, Códigos, Estatutos e Leis Ordinárias, reunida em um só lugar para consulta rápida e estudo. As Leis do Dia trazem automaticamente todas as novas leis, decretos, medidas provisórias e leis complementares publicadas no Diário Oficial da União, direto do portal oficial do Governo Federal.";
        const { data, error } = await supabase.functions.invoke('gerar-audio-feedback', {
          body: { tipo: 'leis-do-dia-sobre', texto: textoNarracao, voz: 'Kore' }
        });

        if (error) throw error;
        const audioUrl = data?.url_audio;
        if (!audioUrl) throw new Error('Sem URL de áudio');

        audio.src = audioUrl;
        audio.load();
      } else {
        audio.currentTime = 0;
      }

      await audio.play();
    } catch (err) {
      console.error('Erro na narração TTS:', err);
      setIsPlayingNarration(false);
    }
  };

  const handleOpenSobre = () => {
    setShowSobre(true);
    void startNarration(true);
  };

  // Buscar leis recentes para a data selecionada
  const { data: leisRecentes, isLoading } = useQuery({
    queryKey: ['leis-recentes-resenha', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const { data, error } = await (supabase as any)
        .from('leis_push_2025')
        .select('id, numero_lei, data_publicacao, ementa, areas_direito, tipo_ato, status')
        .eq('data_publicacao', selectedDate)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []).map((lei: any) => ({
        id: lei.id,
        tipo: lei.tipo_ato || 'Lei',
        numero: lei.numero_lei || '',
        data_publicacao: lei.data_publicacao,
        ementa: lei.ementa || '',
        areas_direito: lei.areas_direito || []
      })) as LeiRecente[];
    },
    enabled: !!selectedDate,
    staleTime: 1000 * 60 * 5
  });

  const handleDateSelect = (dataStr: string) => {
    setSelectedDate(dataStr);
    
    // Se a data não tem leis, mostrar toast
    if (datasComLeis && !datasComLeis.includes(dataStr)) {
      setShowNoDataToast(true);
      setTimeout(() => setShowNoDataToast(false), 3000);
    }
  };

  // Verificar se uma data tem leis
  const dataTemLeis = (dataStr: string) => {
    return datasComLeis?.includes(dataStr) ?? false;
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden">
        <div className="relative py-2">
          
          {/* Toast flutuante para data sem leis */}
          {showNoDataToast && (
            <div
              className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 animate-fade-in"
            >
              <div className="p-2 bg-red-500/20 rounded-full">
                <CalendarX className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Sem atualizações</p>
                <p className="text-xs text-muted-foreground">Nenhuma lei publicada nesta data</p>
              </div>
            </div>
          )}

          {/* Card flutuante "Sobre" */}
          <AnimatePresence>
            {showSobre && (
              <>
                {/* Backdrop ofuscado */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm"
                  onClick={() => {
                    setShowSobre(false);
                    if (narrationAudioRef.current) {
                      narrationAudioRef.current.pause();
                      narrationAudioRef.current.currentTime = 0;
                      setIsPlayingNarration(false);
                    }
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none"
                >
                  <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto w-full max-w-[420px] pointer-events-auto relative">
                  {/* Linha decorativa dourada no topo */}
                  <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                  
                  <div className="p-5">
                    {/* Fechar - botão visível */}
                    <button 
                      onClick={() => {
                        setShowSobre(false);
                        if (narrationAudioRef.current) {
                          narrationAudioRef.current.pause();
                          narrationAudioRef.current.currentTime = 0;
                          setIsPlayingNarration(false);
                        }
                      }}
                      className="absolute top-3 right-3 z-10 p-2 rounded-full bg-muted/80 hover:bg-muted border border-border/50 transition-colors shadow-sm"
                    >
                      <X className="w-4 h-4 text-foreground" />
                    </button>

                    {/* Brasão + Título */}
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src={brasaoRepublica} 
                        alt="Brasão da República" 
                        className="w-12 h-12 object-contain drop-shadow-lg" 
                      />
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Leis do Dia</h3>
                        <p className="text-xs text-muted-foreground">Vade Mecum atualizado diariamente</p>
                      </div>
                    </div>

                    {/* Conteúdo explicativo */}
                    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                      <p>
                        O <span className="text-foreground font-semibold">Vade Mecum</span> é a coletânea completa da 
                        legislação brasileira: Constituição, Códigos, Estatutos e Leis Ordinárias, reunida em um só lugar 
                        para consulta rápida e estudo.
                      </p>
                      <p>
                        As <span className="text-foreground font-semibold">Leis do Dia</span> trazem automaticamente todas as 
                        novas leis, decretos, medidas provisórias e leis complementares publicadas no 
                        <span className="text-amber-500 font-semibold"> Diário Oficial da União</span>, 
                        direto do portal oficial do Governo Federal.
                      </p>
                    </div>

                    {/* Botão de narração */}
                    <button
                      onClick={async () => {
                        if (isPlayingNarration && narrationAudioRef.current) {
                          narrationAudioRef.current.pause();
                          narrationAudioRef.current.currentTime = 0;
                          setIsPlayingNarration(false);
                          return;
                        }
                        void startNarration(true);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 transition-colors"
                    >
                      {isPlayingNarration ? (
                        <>
                          <Pause className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-semibold text-amber-500">Pausar narração</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-semibold text-amber-500">Ouvir narração</span>
                        </>
                      )}
                    </button>

                    {/* Fonte oficial */}
                    <div className="mt-4 p-3 bg-muted/50 rounded-xl border border-border/50 flex items-center gap-3">
                      <img 
                        src={brasaoRepublica} 
                        alt="Brasão" 
                        className="w-8 h-8 object-contain opacity-60" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">Fonte Oficial</p>
                        <p className="text-[10px] text-muted-foreground truncate">planalto.gov.br — Presidência da República</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>

                    {/* Botão ver mais */}
                    <Button
                      size="sm"
                      onClick={() => { setShowSobre(false); navigate('/vade-mecum/resenha-diaria'); }}
                      className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white rounded-xl h-10 text-sm font-semibold gap-2"
                    >
                      Ver todas as leis
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* === CONTAINER ÚNICO === */}
          <div className="bg-gradient-to-b from-red-950 via-red-900/95 to-red-950 backdrop-blur-sm sm:rounded-2xl border-y sm:border border-red-800/30 overflow-hidden h-full flex flex-col">

            {/* Linha decorativa animada no topo */}
            <div className="relative h-7 flex items-center justify-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-red-800/40 to-transparent" />
              <div className="absolute inset-x-0 top-1/2 h-px overflow-hidden">
                <div 
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent"
                  style={{ animation: 'shimmerLine 3s ease-in-out infinite' }}
                />
              </div>
              <div className="relative z-10 px-3 bg-red-950 rounded">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" />
                  <span className="text-[9px] text-white/90 uppercase tracking-widest font-medium">Publicações do Diário Oficial</span>
                  <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Header: ícone + título + botão sobre */}
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-red-900/30 rounded-2xl p-2 shadow-lg ring-1 ring-red-800/30">
                    <img src={brasaoRepublica} alt="Brasão da República" className="w-11 h-11 md:w-9 md:h-9 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-lg font-bold text-foreground tracking-tight">Leis do Dia</h3>
                    <p className="text-muted-foreground text-xs">Novas leis publicadas no Diário Oficial</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/vade-mecum/resenha-diaria')}
                  className="h-7 bg-red-600 hover:bg-red-500 text-white border-0 rounded-full px-3 text-[10px] font-semibold flex items-center gap-1 shadow-md"
                >
                  Sobre
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Seletor de datas */}
            <div className="mx-4 mb-3 bg-red-950/90 rounded-xl p-3 border border-red-800/30">
              
              {/* Datas em linha */}
              <div className="flex gap-1.5 justify-between">
                {diasDisponiveis.map((dia, index) => {
                  const isSelected = dia.dataStr === selectedDate;
                  const temLeis = dataTemLeis(dia.dataStr);
                  
                  return (
                    <button
                      key={dia.dataStr}
                      onClick={() => handleDateSelect(dia.dataStr)}
                      className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-lg transition-colors duration-150 relative ${
                        isSelected 
                          ? 'bg-white text-red-900 shadow-md' 
                          : temLeis
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <span className={`text-[8px] font-medium uppercase tracking-wide ${
                        isSelected ? 'text-red-600' : 'opacity-80'
                      }`}>
                        {dia.diaSemana}
                      </span>
                      <span className={`text-base font-bold leading-none ${
                        isSelected ? 'text-red-900' : ''
                      }`}>{dia.diaNum}</span>
                      <span className={`text-[8px] uppercase ${
                        isSelected ? 'text-red-600' : 'opacity-60'
                      }`}>{dia.mes}</span>
                      
                      {/* Indicador de que tem leis */}
                      {temLeis && !isSelected && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Lista de leis */}
            <div className="px-4 pb-4">
              {isLoading || !selectedDate ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : leisRecentes && leisRecentes.length > 0 ? (
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    {leisRecentes.slice(0, 10).map((lei, index) => {
                      const tags = gerarTags(lei);
                      
                        return (
                        <button
                          key={lei.id}
                          onClick={() => navigate(`/vade-mecum/resenha/push-${lei.id}`)}
                          className="flex-shrink-0 w-56 bg-muted/50 border border-border/50 rounded-lg p-2.5 text-left hover:border-primary/50 transition-colors group relative overflow-hidden shine-effect"
                        >
                          {/* Tags no topo */}
                          <div className="flex gap-1 mb-1.5 flex-wrap">
                            {tags.map((tag, i) => (
                              <span 
                                key={i}
                                className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                                  i === 0 
                                    ? 'bg-primary/20 text-primary' 
                                    : i === 1 
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : 'bg-amber-500/20 text-amber-500'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          {/* Número */}
                          <p className="text-[10px] text-muted-foreground font-medium mb-1 truncate">
                            {lei.numero}
                          </p>
                          
                          {/* Ementa */}
                          <p className="text-[11px] text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {lei.ementa}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                  <p className="text-xs">Nenhuma lei publicada nesta data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmerLine {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(300%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
