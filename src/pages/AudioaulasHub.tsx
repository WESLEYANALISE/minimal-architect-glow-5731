import { useMemo } from "react";
import { useDeviceType } from "@/hooks/use-device-type";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Headphones, Brain, BookOpen, Crown } from "lucide-react";
import { useInstantCache } from "@/hooks/useInstantCache";
import { DotPattern } from "@/components/ui/dot-pattern";
import { NumberTicker } from "@/components/ui/number-ticker";

const GOLD = "hsl(40, 80%, 55%)";

interface AudioaulasContagens {
  audioaulas: number;
  flashcards: number;
  resumos: number;
}

const AudioaulasHub = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();

  const { data: contagens } = useInstantCache<AudioaulasContagens>({
    cacheKey: "audioaulas-hub-contagens",
    queryFn: async () => {
      const [audioaulasRes, flashcardsRes, resumosRes] = await Promise.all([
        supabase.from("AUDIO-AULA" as any).select("*", { count: "exact", head: true }).not("url_audio", "is", null),
        supabase.from("FLASHCARDS - ARTIGOS LEI" as any).select("*", { count: "exact", head: true }).not('"audio-pergunta"', "is", null),
        supabase.from("RESUMO" as any).select("*", { count: "exact", head: true }).not("url_audio_resumo", "is", null),
      ]);
      return {
        audioaulas: audioaulasRes.count || 0,
        flashcards: flashcardsRes.count || 0,
        resumos: resumosRes.count || 0,
      };
    },
  });

  const categories = useMemo(() => [
    { id: "audioaulas", title: "Estudos", description: "Aulas narradas", icon: Headphones, count: contagens?.audioaulas || 0 },
    { id: "flashcards", title: "Artigos", description: "Flashcards", icon: Brain, count: contagens?.flashcards || 0 },
    { id: "resumos", title: "Resumos", description: "Práticos", icon: BookOpen, count: contagens?.resumos || 0 },
  ], [contagens]);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/audioaulas/categoria/${categoryId}`);
  };

  // ─── DESKTOP ───
  if (isDesktop) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <div className="max-w-4xl w-full px-8">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Crown className="w-7 h-7" style={{ color: GOLD }} />
            <h1 className="text-2xl font-bold text-foreground">Escolha uma categoria</h1>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300 p-8 flex flex-col items-center text-center"
                  style={{ background: 'linear-gradient(135deg, hsl(345, 65%, 30%), hsl(350, 40%, 15%))', border: '1px solid hsla(40, 60%, 50%, 0.15)' }}
                >
                  <DotPattern className="opacity-[0.1]" />
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 relative z-10" style={{ background: 'hsla(40, 80%, 55%, 0.15)' }}>
                    <Icon className="w-8 h-8" style={{ color: GOLD }} />
                  </div>
                  <h3 className="text-lg font-bold relative z-10" style={{ color: 'hsl(40, 60%, 90%)' }}>{category.title}</h3>
                  <p className="text-sm mt-1 relative z-10" style={{ color: 'hsl(40, 20%, 60%)' }}>{category.description}</p>
                  <span className="text-sm font-semibold px-3 py-1 rounded-full mt-3 relative z-10" style={{ background: 'hsla(40, 80%, 55%, 0.15)', color: GOLD }}>
                    <NumberTicker value={category.count} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── MOBILE ───
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, hsl(345, 65%, 28%), hsl(350, 40%, 12%))' }}>
      <DotPattern className="opacity-[0.15]" />

      <div className="relative z-10 px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Crown className="w-6 h-6" style={{ color: GOLD }} />
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(40, 60%, 85%)' }}>
            Escolha uma categoria
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="relative overflow-hidden rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300 animate-fade-in"
                style={{ background: 'hsla(345, 30%, 18%, 0.7)', border: '1px solid hsla(40, 60%, 50%, 0.15)', animationDelay: `${index * 0.1}s`, animationFillMode: 'backwards' }}
              >
                <div className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'hsla(40, 80%, 55%, 0.12)' }}>
                    <Icon className="w-6 h-6" style={{ color: GOLD }} />
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: 'hsl(40, 60%, 90%)' }}>{category.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(40, 20%, 60%)' }}>{category.description}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-2" style={{ background: 'hsla(40, 80%, 55%, 0.15)', color: GOLD }}>
                    <NumberTicker value={category.count} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AudioaulasHub;
