import { Quote } from "lucide-react";

interface FilosofoCitacoesProps {
  citacoes: string[];
}

export const FilosofoCitacoes = ({ citacoes }: FilosofoCitacoesProps) => {
  if (!citacoes?.length) return null;

  return (
    <div className="bg-neutral-800/50 rounded-2xl p-4 border border-white/5 space-y-3">
      <div className="flex items-center gap-2">
        <Quote className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-foreground">Citações Famosas</h3>
      </div>
      <div className="space-y-3">
        {citacoes.map((citacao, i) => (
          <blockquote
            key={i}
            className="border-l-2 border-amber-500/50 pl-3 text-sm text-muted-foreground italic animate-[fadeSlideUp_300ms_ease-out_both]"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            "{citacao}"
          </blockquote>
        ))}
      </div>
    </div>
  );
};
