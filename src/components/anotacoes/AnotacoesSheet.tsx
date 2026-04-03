import { useState, useMemo } from 'react';
import { X, Plus, ChevronLeft, ChevronRight, Star, Trash2, Edit3, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserAnotacoes, useAnotacoesMes, type Anotacao } from '@/hooks/useUserAnotacoes';
import { AnotacaoEditor } from './AnotacaoEditor';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { sanitizeHtml } from '@/lib/sanitize';
import { CATEGORIAS_ANOTACOES, getCategoriaColor, getCategoriaCurta } from '@/lib/anotacoesCategorias';

const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface AnotacoesSheetProps {
  open: boolean;
  onClose: () => void;
}

export const AnotacoesSheet = ({ open, onClose }: AnotacoesSheetProps) => {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [diaSel, setDiaSel] = useState<string>(now.toISOString().split('T')[0]);
  const [editando, setEditando] = useState<Anotacao | null>(null);
  const [criando, setCriando] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);

  const { isPremium } = useSubscription();
  const navigate = useNavigate();

  const { anotacoes, isLoading, createAnotacao, updateAnotacao, deleteAnotacao, isCreating, isUpdating } = useUserAnotacoes(diaSel);
  const { data: anotacoesMes = [] } = useAnotacoesMes(ano, mes);

  const anotacoesFiltradas = useMemo(() => {
    if (!filtroCategoria) return anotacoes;
    return anotacoes.filter(a => a.categoria === filtroCategoria);
  }, [anotacoes, filtroCategoria]);

  const diasComAnotacao = useMemo(() => {
    const map = new Map<string, { cor: string; importante: boolean }>();
    anotacoesMes.forEach((a: any) => {
      if (!map.has(a.data_referencia) || a.importante) {
        map.set(a.data_referencia, { cor: a.cor, importante: a.importante });
      }
    });
    return map;
  }, [anotacoesMes]);

  const navigateMes = (dir: number) => {
    let m = mes + dir, a = ano;
    if (m < 1) { m = 12; a--; } else if (m > 12) { m = 1; a++; }
    setMes(m); setAno(a);
  };

  const diasDoMes = useMemo(() => {
    const firstDay = new Date(ano, mes - 1, 1).getDay();
    const daysInMonth = new Date(ano, mes, 0).getDate();
    const dias: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) dias.push(d);
    return dias;
  }, [ano, mes]);

  const [showPremiumCard, setShowPremiumCard] = useState(false);

  const checkPremium = () => {
    if (!isPremium) {
      setShowPremiumCard(true);
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!checkPremium()) return;
    setCriando(true);
  };

  const handleEdit = (a: Anotacao) => {
    if (!checkPremium()) return;
    setEditando(a);
  };

  const handleSaveNew = async (data: any) => {
    await createAnotacao(data);
    setCriando(false);
  };

  const handleSaveEdit = async (data: any) => {
    if (!editando) return;
    await updateAnotacao({ id: editando.id, ...data });
    setEditando(null);
  };

  const handleDelete = async (id: string) => {
    await deleteAnotacao(id);
  };

  if (!open) return null;

  const showEditor = criando || editando;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[60] bg-neutral-950 flex flex-col"
    >
      {showEditor ? (
        <AnotacaoEditor
          initialTitulo={editando?.titulo}
          initialConteudo={editando?.conteudo}
          initialCor={editando?.cor}
          initialImportante={editando?.importante}
          initialDataReferencia={editando?.data_referencia || diaSel}
          initialCategoria={editando?.categoria}
          onSave={editando ? handleSaveEdit : handleSaveNew}
          onCancel={() => { setCriando(false); setEditando(null); }}
          isSaving={isCreating || isUpdating}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white/70" />
            </button>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-400" />
              Anotações
            </h2>
            <div className="w-9" />
          </div>

          {/* Calendar */}
          <div className="px-4 py-3">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => navigateMes(-1)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-white/70" />
                </button>
                <span className="text-sm font-semibold text-white">{MESES_NOME[mes - 1]} {ano}</span>
                <button onClick={() => navigateMes(1)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                  <ChevronRight className="w-4 h-4 text-white/70" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DIAS_SEMANA.map((d, i) => (
                  <div key={i} className="text-center text-[10px] text-white/40 font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {diasDoMes.map((dia, i) => {
                  if (dia === null) return <div key={`e-${i}`} />;
                  const dateStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                  const info = diasComAnotacao.get(dateStr);
                  const selected = dateStr === diaSel;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setDiaSel(dateStr)}
                      className={`relative aspect-square flex items-center justify-center rounded-lg text-xs transition-all ${
                        selected
                          ? 'bg-amber-500 text-black font-bold'
                          : info
                          ? 'text-white hover:bg-white/10'
                          : 'text-white/50 hover:bg-white/5'
                      }`}
                    >
                      {dia}
                      {info && !selected && (
                        <span
                          className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: info.importante ? '#F59E0B' : info.cor || '#FEF7CD' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Category filter chips */}
          <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5 min-w-max">
              <button
                onClick={() => setFiltroCategoria(null)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap border ${
                  !filtroCategoria ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 text-white/50 border-white/10'
                }`}
              >
                Todas
              </button>
              {CATEGORIAS_ANOTACOES.map((cat) => {
                const color = getCategoriaColor(cat);
                const selected = filtroCategoria === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFiltroCategoria(selected ? null : cat)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap border ${
                      selected ? 'text-white' : 'text-white/60'
                    }`}
                    style={{
                      backgroundColor: selected ? color + '30' : 'transparent',
                      borderColor: selected ? color + '60' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    {getCategoriaCurta(cat)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto px-4 pb-24">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80">
                {diaSel ? new Date(diaSel + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) : 'Anotações'}
              </h3>
              <span className="text-xs text-white/40">{anotacoesFiltradas.length} nota{anotacoesFiltradas.length !== 1 ? 's' : ''}</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : anotacoesFiltradas.length === 0 ? (
              <div className="text-center py-8">
                <StickyNote className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">Nenhuma anotação {filtroCategoria ? 'nesta categoria' : 'neste dia'}</p>
                <button onClick={handleCreate} className="mt-3 text-amber-400 text-xs font-medium hover:text-amber-300">
                  + Criar anotação
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {anotacoesFiltradas.map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-xl p-3 border border-white/10 group"
                    style={{ borderLeftColor: a.cor, borderLeftWidth: 3 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {a.importante && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                          <h4 className="text-sm font-semibold text-white truncate">{a.titulo || 'Sem título'}</h4>
                          {a.categoria && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                              style={{
                                backgroundColor: getCategoriaColor(a.categoria) + '25',
                                color: getCategoriaColor(a.categoria),
                              }}
                            >
                              {getCategoriaCurta(a.categoria)}
                            </span>
                          )}
                        </div>
                        <div
                          className="text-xs text-white/50 line-clamp-2 mt-1 [&_mark]:bg-yellow-400/30 [&_mark]:text-white"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.conteudo) }}
                        />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* FAB */}
          <motion.button
            onClick={handleCreate}
            className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-400 text-black rounded-full shadow-xl shadow-amber-500/30 flex items-center justify-center z-10"
            whileTap={{ scale: 0.9 }}
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </>
      )}
    </motion.div>
  );
};
