import { useWikipediaPT } from "@/hooks/useWikipediaPT";
import { BookOpen, Loader2 } from "lucide-react";

interface FilosofoBioProps {
  nomeWikipedia: string;
}

export const FilosofoBio = ({ nomeWikipedia }: FilosofoBioProps) => {
  const { data, isLoading } = useWikipediaPT(nomeWikipedia);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando biografia...
      </div>
    );
  }

  if (!data?.resumo) return null;

  return (
    <div className="bg-neutral-800/50 rounded-2xl p-4 border border-white/5 space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-foreground">Biografia</h3>
      </div>
      {data.descricao && (
        <p className="text-xs text-amber-400/80 italic">{data.descricao}</p>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed">{data.resumo}</p>
    </div>
  );
};
