import { useState } from "react";
import { Eye, BookmarkPlus, Star, X, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useMinhaAvaliacao, useSalvarAvaliacao, useResumoAvaliacoes } from "@/hooks/useAvaliacaoRecomendacao";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  tipo: 'filme' | 'livro';
  itemData: string;
}

const COMENTARIOS_FILME = [
  "Incrível! 🎬",
  "Muito relevante para o Direito ⚖️",
  "Me fez refletir 🤔",
  "Recomendo demais! 🌟",
  "Obra-prima 🏆",
];

const COMENTARIOS_LIVRO = [
  "Leitura essencial! 📚",
  "Muito relevante para o Direito ⚖️",
  "Me fez refletir 🤔",
  "Recomendo demais! 🌟",
  "Transformador 💡",
];

export default function AvaliacaoButtons({ tipo, itemData }: Props) {
  const [showCard, setShowCard] = useState(false);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [hoverStar, setHoverStar] = useState(0);

  const { data: minhaAvaliacao } = useMinhaAvaliacao(tipo, itemData);
  const { media, total, comentarios } = useResumoAvaliacoes(tipo, itemData);
  const salvar = useSalvarAvaliacao();

  const jaLabel = tipo === 'filme' ? 'Já assisti' : 'Já li';
  const pretendoLabel = tipo === 'filme' ? 'Pretendo assistir' : 'Pretendo ler';
  const statusJa = tipo === 'filme' ? 'assistido' : 'lido';
  const statusPretendo = tipo === 'filme' ? 'pretendo_assistir' : 'pretendo_ler';
  const comentariosPreProntos = tipo === 'filme' ? COMENTARIOS_FILME : COMENTARIOS_LIVRO;

  const handleJa = () => {
    if (minhaAvaliacao?.status === statusJa) {
      toast.info("Você já avaliou!");
      return;
    }
    setShowCard(true);
  };

  const handlePretendo = async () => {
    try {
      await salvar.mutateAsync({ tipo, itemData, status: statusPretendo });
      toast.success(tipo === 'filme' ? "Adicionado à sua lista! 🎬" : "Adicionado à sua lista! 📚");
    } catch {
      toast.error("Faça login para avaliar");
    }
  };

  const handleSalvar = async () => {
    if (nota === 0) { toast.error("Selecione uma nota"); return; }
    try {
      await salvar.mutateAsync({ tipo, itemData, status: statusJa, nota, comentario: comentario || undefined });
      toast.success("Avaliação salva! ⭐");
      setShowCard(false);
      setNota(0);
      setComentario("");
    } catch {
      toast.error("Faça login para avaliar");
    }
  };

  const isJa = minhaAvaliacao?.status === statusJa;
  const isPretendo = minhaAvaliacao?.status === statusPretendo;

  return (
    <div className="space-y-3">
      {/* Botões */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className={cn(
            "flex-1 gap-2 text-xs py-2.5 rounded-xl border-white/10 transition-all",
            isJa ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-white/5 text-white/70 hover:bg-white/10"
          )}
          onClick={handleJa}
        >
          <Eye className="w-4 h-4" />
          {isJa ? "✓ " + jaLabel : jaLabel}
        </Button>
        <Button
          variant="outline"
          className={cn(
            "flex-1 gap-2 text-xs py-2.5 rounded-xl border-white/10 transition-all",
            isPretendo ? "bg-blue-500/20 border-blue-500/40 text-blue-300" : "bg-white/5 text-white/70 hover:bg-white/10"
          )}
          onClick={handlePretendo}
          disabled={salvar.isPending}
        >
          <BookmarkPlus className="w-4 h-4" />
          {isPretendo ? "✓ " + pretendoLabel : pretendoLabel}
        </Button>
      </div>

      {/* Resumo de avaliações */}
      {total > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={cn("w-3.5 h-3.5", s <= Math.round(media) ? "text-yellow-400 fill-yellow-400" : "text-white/20")} />
            ))}
          </div>
          <span className="text-xs text-white/50">{media.toFixed(1)} · {total} {total === 1 ? 'avaliação' : 'avaliações'}</span>
        </div>
      )}

      {/* Últimos comentários */}
      {comentarios.length > 0 && (
        <div className="space-y-1.5 px-1">
          {comentarios.slice(0, 3).map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <MessageSquare className="w-3 h-3 text-white/30 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/50 leading-relaxed">{c.comentario}</p>
            </div>
          ))}
        </div>
      )}

      {/* Card flutuante de avaliação */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
          >
            <Card className="p-4 border-white/15 bg-white/5 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Sua avaliação</h4>
                <button onClick={() => setShowCard(false)} className="text-white/40 hover:text-white/80">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Estrelas */}
              <div className="flex items-center gap-1 justify-center">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onMouseEnter={() => setHoverStar(s)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setNota(s)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star className={cn(
                      "w-7 h-7 transition-colors",
                      s <= (hoverStar || nota) ? "text-yellow-400 fill-yellow-400" : "text-white/20"
                    )} />
                  </button>
                ))}
              </div>

              {/* Comentários pré-prontos */}
              <div className="flex flex-wrap gap-1.5">
                {comentariosPreProntos.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setComentario(c)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] border transition-all",
                      comentario === c
                        ? "bg-white/15 border-white/30 text-white"
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Campo personalizado */}
              <input
                type="text"
                value={comentariosPreProntos.includes(comentario) ? "" : comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Ou escreva seu comentário..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />

              <Button
                onClick={handleSalvar}
                disabled={salvar.isPending}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send className="w-4 h-4" />
                Salvar avaliação
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
