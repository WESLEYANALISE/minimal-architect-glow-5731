import { useNavigate } from "react-router-dom";
import { useWikipediaPT } from "@/hooks/useWikipediaPT";
import type { FilosofoConfig } from "@/lib/filosofia-config";
import { BookOpen } from "lucide-react";

interface FilosofoCardProps {
  filosofo: FilosofoConfig;
  index: number;
}

export const FilosofoCard = ({ filosofo, index }: FilosofoCardProps) => {
  const navigate = useNavigate();
  const { data: wiki } = useWikipediaPT(filosofo.nomeWikipedia);

  return (
    <button
      onClick={() => navigate(`/galeria-filosofia/${filosofo.slug}`)}
      className="group bg-neutral-800/70 hover:bg-neutral-700/80 rounded-2xl overflow-hidden text-left transition-all duration-300 shadow-lg border border-white/5 hover:border-amber-500/30 hover:shadow-amber-900/20 hover:shadow-xl animate-[fadeSlideUp_400ms_ease-out_both]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Image */}
      <div className="aspect-[3/4] bg-neutral-900 relative overflow-hidden">
        {wiki?.imagem ? (
          <img
            src={wiki.imagem}
            alt={filosofo.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900/30 to-neutral-900">
            <BookOpen className="w-12 h-12 text-amber-500/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <h3 className="font-bold text-sm text-foreground group-hover:text-amber-400 transition-colors line-clamp-1">
          {filosofo.nome}
        </h3>
        <p className="text-[11px] text-muted-foreground">{filosofo.periodo}</p>
        <div className="flex flex-wrap gap-1 pt-1">
          {filosofo.categorias.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-900/30 text-amber-400/80"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};
