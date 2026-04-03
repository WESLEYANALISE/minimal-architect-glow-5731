import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Volume2, Loader2, CheckCircle2, Circle, Play, Pause, Headphones, ChevronRight, Search, CheckSquare, Square, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface Topico {
  id: number;
  titulo: string;
  url_narracao: string | null;
  conteudo_gerado: any;
}

interface Materia {
  id: number;
  nome: string;
  categoria: string;
}

const AVG_SECONDS_PER_NARRATION = 25; // estimated time per narration

export default function AdminAulasAudio() {
  const navigate = useNavigate();
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Batch progress
  const [batchQueue, setBatchQueue] = useState<Topico[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [isBatching, setIsBatching] = useState(false);
  const [batchStartTime, setBatchStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const batchAbortRef = useRef(false);

  // Timer
  useEffect(() => {
    if (!isBatching || !batchStartTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - batchStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isBatching, batchStartTime]);

  // Fetch materias
  const { data: materias, isLoading: loadingMaterias } = useQuery({
    queryKey: ['admin-aulas-audio-materias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_materias')
        .select('id, nome, categoria')
        .order('categoria')
        .order('nome');
      if (error) throw error;
      return data as Materia[];
    },
  });

  // Fetch topicos
  const { data: topicos, isLoading: loadingTopicos, refetch: refetchTopicos } = useQuery({
    queryKey: ['admin-aulas-audio-topicos', selectedMateria?.id],
    queryFn: async () => {
      if (!selectedMateria) return [];
      const { data, error } = await supabase
        .from('categorias_topicos')
        .select('id, titulo, url_narracao, conteudo_gerado')
        .eq('materia_id', selectedMateria.id)
        .order('ordem');
      if (error) throw error;
      return data as Topico[];
    },
    enabled: !!selectedMateria,
  });

  const narrarTopico = useCallback(async (topicoId: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('narrar-aula', {
        body: { topico_id: topicoId },
      });
      if (error) return false;
      return !!data?.success;
    } catch {
      return false;
    }
  }, []);

  const narrarUm = useCallback(async (topico: Topico) => {
    setGeneratingId(topico.id);
    const ok = await narrarTopico(topico.id);
    setGeneratingId(null);
    if (ok) {
      toast.success(`✅ ${topico.titulo}`);
      refetchTopicos();
    } else {
      toast.error(`Erro: ${topico.titulo}`);
    }
  }, [narrarTopico, refetchTopicos]);

  // Batch narration
  const startBatch = useCallback(async (ids: Set<number>) => {
    if (!topicos) return;
    const queue = topicos.filter(t => ids.has(t.id) && !t.url_narracao && t.conteudo_gerado);
    if (queue.length === 0) {
      toast.info('Nenhuma aula pendente selecionada');
      return;
    }

    batchAbortRef.current = false;
    setBatchQueue(queue);
    setBatchIndex(0);
    setIsBatching(true);
    setBatchStartTime(Date.now());
    setElapsed(0);
    setSelectMode(false);
    setSelectedIds(new Set());

    let successCount = 0;
    for (let i = 0; i < queue.length; i++) {
      if (batchAbortRef.current) break;
      setBatchIndex(i);
      setGeneratingId(queue[i].id);
      const ok = await narrarTopico(queue[i].id);
      if (ok) successCount++;
      // Rate limit pause between requests
      if (i < queue.length - 1 && !batchAbortRef.current) {
        await new Promise(r => setTimeout(r, 4000));
      }
    }

    setGeneratingId(null);
    setIsBatching(false);
    setBatchQueue([]);
    setBatchStartTime(null);
    toast.success(`${successCount}/${queue.length} narrações geradas`);
    refetchTopicos();
  }, [topicos, narrarTopico, refetchTopicos]);

  const cancelBatch = () => {
    batchAbortRef.current = true;
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPending = () => {
    if (!topicos) return;
    const pending = topicos.filter(t => !t.url_narracao && t.conteudo_gerado).map(t => t.id);
    setSelectedIds(new Set(pending));
  };

  const togglePlay = (url: string) => {
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      setPlayingUrl(url);
      audio.onended = () => setPlayingUrl(null);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filteredMaterias = materias?.filter(m =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const narrados = topicos?.filter(t => t.url_narracao).length || 0;
  const total = topicos?.length || 0;

  // Estimated time remaining for batch
  const batchRemaining = isBatching
    ? Math.max(0, (batchQueue.length - batchIndex - 1) * AVG_SECONDS_PER_NARRATION)
    : 0;

  // --- TOPICOS VIEW ---
  if (selectedMateria) {
    const pendingCount = topicos?.filter(t => !t.url_narracao && t.conteudo_gerado).length || 0;

    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { setSelectedMateria(null); setSelectMode(false); setSelectedIds(new Set()); }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{selectedMateria.nome}</h1>
              <p className="text-xs text-muted-foreground">
                {selectedMateria.categoria} • {narrados}/{total} narradas
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {total > 0 && <Progress value={(narrados / total) * 100} className="h-2" />}

          {/* Batch progress card */}
          {isBatching && (
            <Card className="border-amber-700/30 bg-gradient-to-r from-amber-900/30 to-amber-800/20">
              <CardContent className="py-3 px-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span className="text-sm font-medium text-amber-300">
                      Narrando {batchIndex + 1}/{batchQueue.length}
                    </span>
                  </div>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={cancelBatch}>
                    Cancelar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {batchQueue[batchIndex]?.titulo}
                </p>
                <Progress value={((batchIndex + 1) / batchQueue.length) * 100} className="h-1.5" />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Decorrido: {formatTime(elapsed)}
                  </span>
                  <span>~{formatTime(batchRemaining)} restante</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action bar */}
          {!isBatching && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={selectMode ? "default" : "outline"}
                className="text-xs"
                onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1" />
                {selectMode ? "Cancelar" : "Selecionar"}
              </Button>
              {selectMode && (
                <>
                  <Button size="sm" variant="outline" className="text-xs" onClick={selectAllPending}>
                    Todas ({pendingCount})
                  </Button>
                  {selectedIds.size > 0 && (
                    <Button size="sm" className="text-xs ml-auto" onClick={() => startBatch(selectedIds)}>
                      <Volume2 className="w-3.5 h-3.5 mr-1" />
                      Narrar {selectedIds.size}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Loading */}
          {loadingTopicos && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Topicos list */}
          <div className="space-y-0.5">
            {topicos?.map(topico => {
              const isGenerating = generatingId === topico.id;
              const isSelected = selectedIds.has(topico.id);
              const isPending = !topico.url_narracao && topico.conteudo_gerado;

              return (
                <div
                  key={topico.id}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  onClick={selectMode && isPending ? () => toggleSelect(topico.id) : undefined}
                >
                  {/* Checkbox / Status */}
                  {selectMode && isPending ? (
                    <button onClick={() => toggleSelect(topico.id)} className="shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </button>
                  ) : topico.url_narracao ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                  )}

                  {/* Title */}
                  <span className="text-sm flex-1 leading-snug">{topico.titulo}</span>

                  {/* Action button */}
                  {!selectMode && (
                    isGenerating ? (
                      <Loader2 className="w-5 h-5 animate-spin text-amber-400 shrink-0" />
                    ) : topico.url_narracao ? (
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => togglePlay(topico.url_narracao!)}>
                        {playingUrl === topico.url_narracao ? (
                          <Pause className="w-4 h-4 text-primary" />
                        ) : (
                          <Play className="w-4 h-4 text-primary" />
                        )}
                      </Button>
                    ) : isPending ? (
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => narrarUm(topico)} disabled={isBatching}>
                        <Volume2 className="w-4 h-4 text-amber-400" />
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40 shrink-0">s/ conteúdo</span>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {topicos?.length === 0 && !loadingTopicos && (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhum tópico nesta matéria.</p>
          )}
        </div>
      </div>
    );
  }

  // --- MATERIAS LIST ---
  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Headphones className="w-6 h-6 text-primary" />
              Aulas Áudio
            </h1>
            <p className="text-sm text-muted-foreground">Selecione uma matéria</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar matéria..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>

        {loadingMaterias && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {(() => {
          const grouped = new Map<string, Materia[]>();
          filteredMaterias?.forEach(m => {
            const list = grouped.get(m.categoria) || [];
            list.push(m);
            grouped.set(m.categoria, list);
          });

          return Array.from(grouped.entries()).map(([categoria, mats]) => (
            <div key={categoria} className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 px-1 pt-2">
                {categoria}
              </p>
              {mats.map(materia => (
                <button
                  key={materia.id}
                  onClick={() => setSelectedMateria(materia)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm flex-1">{materia.nome}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </button>
              ))}
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
