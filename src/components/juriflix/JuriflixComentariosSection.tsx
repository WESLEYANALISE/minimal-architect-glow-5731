import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useJuriflixComentarios } from "@/hooks/useJuriflixComentarios";
import { JuriflixComentarioForm } from "./JuriflixComentarioForm";
import { JuriflixComentarioItem } from "./JuriflixComentarioItem";
import { MessageCircle, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface JuriflixComentariosSectionProps {
  juriflixId: number;
}

type SortOption = 'recent' | 'popular';

export const JuriflixComentariosSection = ({ juriflixId }: JuriflixComentariosSectionProps) => {
  const { data: comentarios, isLoading } = useJuriflixComentarios(juriflixId);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const sortedComentarios = [...(comentarios || [])].sort((a, b) => {
    if (sortBy === 'popular') return b.likes_count - a.likes_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalComentarios = (comentarios || []).reduce((acc, c) => {
    return acc + 1 + (c.respostas?.length || 0);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="font-semibold">Discussão</span>
          {totalComentarios > 0 && (
            <span className="text-sm text-muted-foreground">
              ({totalComentarios} {totalComentarios === 1 ? 'comentário' : 'comentários'})
            </span>
          )}
        </div>

        {totalComentarios > 1 && (
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Mais recentes
                </span>
              </SelectItem>
              <SelectItem value="popular">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Mais curtidos
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <JuriflixComentarioForm juriflixId={juriflixId} />

      {totalComentarios > 0 && <div className="border-t border-border/50" />}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedComentarios.length > 0 ? (
        <div className="space-y-6">
          {sortedComentarios.map((comentario) => (
            <JuriflixComentarioItem
              key={comentario.id}
              comentario={comentario}
              juriflixId={juriflixId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Seja o primeiro a comentar!</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Compartilhe sua opinião sobre este título
          </p>
        </div>
      )}
    </motion.div>
  );
};
