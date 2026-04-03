import { useState } from 'react';
import { StickyNote, Star, ArrowRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserAnotacoes } from '@/hooks/useUserAnotacoes';
import { AnotacoesSheet } from './AnotacoesSheet';
import { sanitizeHtml } from '@/lib/sanitize';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoriaColor, getCategoriaCurta } from '@/lib/anotacoesCategorias';

export const AnotacoesResumo = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { anotacoesRecentes, isLoading } = useUserAnotacoes();
  const { user } = useAuth();

  return (
    <>
      <div className="space-y-3">
        {!user ? (
          <div className="text-center py-6">
            <StickyNote className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/50 text-xs">Faça login para ver suas anotações</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : anotacoesRecentes.length === 0 ? (
          <div className="text-center py-6">
            <StickyNote className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/50 text-xs mb-3">Nenhuma anotação ainda</p>
            <button
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-full text-xs font-medium hover:bg-amber-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar primeira anotação
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {anotacoesRecentes.slice(0, 3).map((a) => (
                <motion.button
                  key={a.id}
                  onClick={() => setSheetOpen(true)}
                  className="w-full bg-white/10 rounded-xl p-3 text-left transition-all hover:bg-white/15 border border-white/5"
                  style={{ borderLeftColor: a.cor, borderLeftWidth: 3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {a.importante && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    <span className="text-xs font-semibold text-white truncate">{a.titulo || 'Sem título'}</span>
                    {a.categoria && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium ml-auto"
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
                    className="text-[10px] text-white/40 line-clamp-1 [&_mark]:bg-yellow-400/30 [&_mark]:text-white"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.conteudo) }}
                  />
                </motion.button>
              ))}
            </div>
            <motion.button
              onClick={() => setSheetOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-full text-xs font-semibold transition-colors"
              whileTap={{ scale: 0.97 }}
            >
              <StickyNote className="w-3.5 h-3.5" />
              Abrir anotações
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </>
        )}
      </div>

      <AnimatePresence>
        {sheetOpen && <AnotacoesSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />}
      </AnimatePresence>
    </>
  );
};
