import { memo } from "react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { BookOpen } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BLOGGER_TEMAS, type BloggerTema } from "@/components/blogger/bloggerTemas";

const ANALISES_CATEGORIAS = [
  { label: "Direito Constitucional", temaIds: ["constitucional", "stf"] },
  { label: "Direito Penal", temaIds: ["penal", "processo-penal"] },
  { label: "Direito Civil", temaIds: ["civil", "familia", "sucessoes"] },
  { label: "Direito do Trabalho", temaIds: ["trabalho", "processo-trabalho"] },
  { label: "Direito Administrativo", temaIds: ["administrativo", "tributario"] },
];

export const AnaliseJuridicaSection = memo(() => {
  const navigate = useTransitionNavigate();

  const analisesTemas = ANALISES_CATEGORIAS.map(cat => ({
    ...cat,
    temas: cat.temaIds
      .map(id => BLOGGER_TEMAS.find(t => t.id === id))
      .filter(Boolean) as BloggerTema[],
  })).filter(cat => cat.temas.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <div className="p-1.5 rounded-lg bg-violet-500/20">
          <BookOpen className="w-4 h-4 text-violet-300" />
        </div>
        <h3 className="text-base font-bold text-foreground tracking-tight">Análises Jurídicas</h3>
      </div>

      {analisesTemas.map((categoria) => (
        <div key={categoria.label} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground px-3 uppercase tracking-wider">{categoria.label}</p>
          <ScrollArea className="w-full">
            <div className="flex gap-3 px-2 pb-2">
              {categoria.temas.map(tema => (
                <button
                  key={tema.id}
                  onClick={() => navigate(`/vade-mecum/blogger/${tema.id}`)}
                  className="w-[140px] sm:w-[160px] shrink-0 group"
                >
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-lg group-hover:shadow-2xl group-hover:ring-white/30 transition-all duration-300 group-hover:scale-[1.03]">
                    <img
                      src={tema.capa}
                      alt={tema.titulo}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="font-bold text-white text-[13px] leading-tight mb-0.5" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
                        {tema.titulo}
                      </h4>
                      <p className="text-white/60 text-[10px] line-clamp-2 leading-snug">{tema.descricao}</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: tema.cor }} />
                  </div>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      ))}
    </div>
  );
});

AnaliseJuridicaSection.displayName = "AnaliseJuridicaSection";
