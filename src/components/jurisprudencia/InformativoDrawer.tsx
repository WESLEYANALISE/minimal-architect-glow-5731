import { ArrowLeft, Scale, Loader2, FileText, User, Headphones, Video, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Informativo {
  id: number;
  tribunal: string;
  numero_edicao: number;
  data_publicacao: string | null;
  titulo_edicao: string | null;
}

interface Nota {
  id: number;
  orgao_julgador: string | null;
  ramo_direito: string | null;
  tema: string | null;
  destaque: string | null;
  inteiro_teor: string | null;
  processo: string | null;
  relator: string | null;
  link_processo: string | null;
  link_audio: string | null;
  link_video: string | null;
  ordem: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  informativo: Informativo | null;
  notas: Nota[];
  loading: boolean;
  ramoFiltro: string;
  onRamoChange: (ramo: string) => void;
}

const RAMOS_CORES: Record<string, string> = {
  'DIREITO PENAL': 'bg-red-500/15 text-red-400',
  'DIREITO CIVIL': 'bg-blue-500/15 text-blue-400',
  'DIREITO CONSTITUCIONAL': 'bg-amber-500/15 text-amber-400',
  'DIREITO ADMINISTRATIVO': 'bg-purple-500/15 text-purple-400',
  'DIREITO TRIBUTÁRIO': 'bg-emerald-500/15 text-emerald-400',
  'DIREITO PROCESSUAL CIVIL': 'bg-cyan-500/15 text-cyan-400',
  'DIREITO PROCESSUAL PENAL': 'bg-orange-500/15 text-orange-400',
  'DIREITO DO TRABALHO': 'bg-teal-500/15 text-teal-400',
  'DIREITO EMPRESARIAL': 'bg-indigo-500/15 text-indigo-400',
  'DIREITO DO CONSUMIDOR': 'bg-pink-500/15 text-pink-400',
  'DIREITO AMBIENTAL': 'bg-lime-500/15 text-lime-400',
  'DIREITO PREVIDENCIÁRIO': 'bg-violet-500/15 text-violet-400',
  'DIREITO ELEITORAL': 'bg-sky-500/15 text-sky-400',
};

function getRamoCor(ramo: string | null): string {
  if (!ramo) return 'bg-muted/50 text-muted-foreground';
  for (const [key, value] of Object.entries(RAMOS_CORES)) {
    if (ramo.toUpperCase().includes(key)) return value;
  }
  return 'bg-muted/50 text-muted-foreground';
}

export function InformativoDrawer({ open, onOpenChange, informativo, notas, loading }: Props) {
  if (!informativo) return null;

  const isSTF = informativo.tribunal === 'STF';
  const formatDate = (date: string | null) => {
    if (!date) return '';
    try {
      const d = new Date(date + 'T00:00:00');
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return date;
    }
  };

  const groupedNotas: Record<string, Nota[]> = {};
  notas.forEach(nota => {
    const key = nota.orgao_julgador || 'Outros';
    if (!groupedNotas[key]) groupedNotas[key] = [];
    groupedNotas[key].push(nota);
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header fixo */}
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border/50">
            <div className="flex items-center gap-3 px-4 py-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isSTF ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {informativo.tribunal}
                  </span>
                  <span className="text-sm font-bold text-foreground truncate">
                    nº {informativo.numero_edicao}
                  </span>
                </div>
                {informativo.data_publicacao && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDate(informativo.data_publicacao)} • {notas.length} {notas.length === 1 ? 'nota' : 'notas'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4 pb-24 space-y-3">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : notas.length === 0 ? (
                <div className="text-center py-20">
                  <Scale className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma nota encontrada</p>
                </div>
              ) : (
                Object.entries(groupedNotas).map(([orgao, orgaoNotas]) => (
                  <div key={orgao}>
                    {orgao !== 'Outros' && (
                      <div className="flex items-center gap-2 my-4">
                        <div className="h-px flex-1 bg-border/30" />
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          {orgao}
                        </span>
                        <div className="h-px flex-1 bg-border/30" />
                      </div>
                    )}

                    {orgaoNotas.map((nota, idx) => (
                      <motion.div
                        key={nota.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-card/80 rounded-2xl p-4 border border-border/30 mb-3"
                      >
                        {nota.ramo_direito && (
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${getRamoCor(nota.ramo_direito)} inline-block mb-2.5`}>
                            {nota.ramo_direito}
                          </span>
                        )}

                        {nota.tema && (
                          <h3 className="text-[15px] font-bold text-foreground mb-2 leading-snug">
                            {nota.tema}
                          </h3>
                        )}

                        {nota.destaque && nota.destaque !== nota.tema && (
                          <div className="bg-amber-500/5 border-l-2 border-amber-500/40 pl-3 py-2.5 mb-3 rounded-r-xl">
                            <p className="text-[13px] text-foreground/80 leading-relaxed italic">
                              {nota.destaque}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                          {nota.processo && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 shrink-0" />
                              {nota.processo}
                            </span>
                          )}
                          {nota.relator && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 shrink-0" />
                              {nota.relator}
                            </span>
                          )}
                        </div>

                        {nota.inteiro_teor && (
                          <details className="mt-3">
                            <summary className="text-[12px] text-primary cursor-pointer font-medium">
                              Ver inteiro teor
                            </summary>
                            <p className="text-[12px] text-foreground/70 leading-relaxed mt-2 whitespace-pre-line">
                              {nota.inteiro_teor.substring(0, 2000)}
                              {nota.inteiro_teor.length > 2000 && '...'}
                            </p>
                          </details>
                        )}

                        {(nota.link_processo || nota.link_audio || nota.link_video) && (
                          <div className="flex gap-2 mt-3">
                            {nota.link_processo && (
                              <a href={nota.link_processo} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg">
                                  <ExternalLink className="w-3 h-3 mr-1" /> Processo
                                </Button>
                              </a>
                            )}
                            {nota.link_audio && (
                              <a href={nota.link_audio} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg">
                                  <Headphones className="w-3 h-3 mr-1" /> Áudio
                                </Button>
                              </a>
                            )}
                            {nota.link_video && (
                              <a href={nota.link_video} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg">
                                  <Video className="w-3 h-3 mr-1" /> Vídeo
                                </Button>
                              </a>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
