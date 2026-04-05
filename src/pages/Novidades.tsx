import { Sparkles, Calendar as CalendarIcon, Rocket, Wrench, Zap } from "lucide-react";
import { useDeviceType } from "@/hooks/use-device-type";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parse, isSameDay, isValid } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useGenericCache } from "@/hooks/useGenericCache";

interface Novidade {
  id: number;
  "Atualização": string;
  "Área": string;
  "Dia": string;
  created_at: string;
}

// Cores alternadas para os grupos de data
const dateGroupColors = [
  "border-l-red-500",
  "border-l-amber-500",
  "border-l-emerald-500",
  "border-l-sky-500",
  "border-l-violet-500",
  "border-l-rose-500",
];

const badgeColors: Record<string, string> = {
  "Sistema": "bg-sky-500/20 text-sky-300 border-sky-500/30",
  "Vade Mecum": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Biblioteca": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Estudos": "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "OAB": "bg-red-500/20 text-red-300 border-red-500/30",
  "IA": "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  "Design": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "JuriFlix": "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

const getAreaEmoji = (area: string) => {
  const map: Record<string, string> = {
    "Sistema": "⚙️",
    "Vade Mecum": "📜",
    "Biblioteca": "📚",
    "Estudos": "🎓",
    "OAB": "⚖️",
    "IA": "🤖",
    "Design": "🎨",
    "JuriFlix": "🎬",
  };
  return map[area] || "✨";
};

const Novidades = () => {
  const { isDesktop } = useDeviceType();
  const { data: novidades, isLoading: loading } = useGenericCache<Novidade[]>({
    cacheKey: 'novidades-list',
    fetchFn: async () => {
      const { data, error } = await (supabase as any).from("NOVIDADES").select("*");
      if (error) throw error;

      return (data || []).sort((a: Novidade, b: Novidade) => {
        try {
          const dateA = parse(a.Dia, "dd/MM/yyyy", new Date());
          const dateB = parse(b.Dia, "dd/MM/yyyy", new Date());
          if (!isValid(dateA) || !isValid(dateB)) return 0;
          return dateB.getTime() - dateA.getTime();
        } catch {
          return 0;
        }
      });
    },
  });

  // Agrupar por data
  const groupedByDate = (novidades || []).reduce<Record<string, Novidade[]>>((acc, nov) => {
    const key = nov.Dia;
    if (!acc[key]) acc[key] = [];
    acc[key].push(nov);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    try {
      const dateA = parse(a, "dd/MM/yyyy", new Date());
      const dateB = parse(b, "dd/MM/yyyy", new Date());
      return dateB.getTime() - dateA.getTime();
    } catch {
      return 0;
    }
  });

  return (
    <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-4xl lg:max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/20">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Novidades</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Acompanhe todas as atualizações e melhorias
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 sm:py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
        </div>
      ) : (novidades || []).length === 0 ? (
        <div className="text-center py-16 sm:py-20">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-secondary mb-3">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Nenhuma novidade no momento
          </p>
        </div>
      ) : (
        <div className={`${isDesktop ? 'grid grid-cols-2 gap-5' : 'space-y-5'}`}>
          {sortedDates.map((dateStr, dateIndex) => {
            const items = groupedByDate[dateStr];
            const colorClass = dateGroupColors[dateIndex % dateGroupColors.length];

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date header */}
                <div className="flex items-center gap-2 mb-1">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">{dateStr}</span>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {items.length} {items.length === 1 ? 'atualização' : 'atualizações'}
                  </span>
                </div>

                {/* Items for this date */}
                <div className="space-y-2">
                  {items.map((novidade) => {
                    const badgeClass = badgeColors[novidade["Área"]] || "bg-secondary text-muted-foreground border-border";
                    const emoji = getAreaEmoji(novidade["Área"]);

                    return (
                      <div
                        key={novidade.id}
                        className={`rounded-xl bg-card border border-border/40 p-3.5 sm:p-4 border-l-[3px] ${colorClass} hover:bg-accent/30 transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] sm:text-xs px-2 py-0.5 ${badgeClass}`}
                          >
                            {novidade["Área"]}
                          </Badge>
                        </div>
                        <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
                          {emoji} {novidade["Atualização"]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Novidades;
