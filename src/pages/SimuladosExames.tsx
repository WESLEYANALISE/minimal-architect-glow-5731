import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, ChevronRight, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import OABWelcomeCard from "@/components/OABWelcomeCard";
import { useGenericCache } from "@/hooks/useGenericCache";
import { DotPattern } from "@/components/ui/dot-pattern";

const GOLD = "hsl(40, 80%, 55%)";

interface Exame {
  exame: string;
  ano: number;
  banca: string;
  count: number;
}

const SimuladosExames = () => {
  const navigate = useNavigate();
  
  const { data: exames, isLoading } = useGenericCache<Exame[]>({
    cacheKey: 'simulados-exames-oab',
    fetchFn: async () => {
      const { data, error } = await supabase
        .from("SIMULADO-OAB" as any)
        .select("Exame, Ano, Banca")
        .not("Exame", "is", null)
        .not("Ano", "is", null);
      
      if (error) throw error;

      const exameMap = new Map<string, { exame: string; ano: number; banca: string; count: number }>();
      
      (data || []).forEach((item: any) => {
        const key = `${item.Exame}-${item.Ano}`;
        if (!exameMap.has(key)) {
          exameMap.set(key, { exame: item.Exame || "", ano: item.Ano || 0, banca: item.Banca || "N/A", count: 0 });
        }
        exameMap.get(key)!.count++;
      });
      
      return Array.from(exameMap.values()).sort((a, b) => b.ano - a.ano || a.exame.localeCompare(b.exame));
    },
  });

  return (
    <div className="min-h-screen relative overflow-hidden pb-24" style={{ background: 'linear-gradient(to bottom, hsl(345, 65%, 28%), hsl(350, 40%, 12%))' }}>
      <DotPattern className="opacity-[0.15]" />

      <div className="relative z-10 px-3 py-6 max-w-4xl mx-auto">
        <OABWelcomeCard />

        <div className="mb-6 flex items-center gap-3">
          <Crown className="w-6 h-6" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(40, 60%, 85%)' }}>
              Exames da OAB
            </h1>
            <p className="text-sm" style={{ color: 'hsl(40, 30%, 70%)' }}>
              Escolha um exame completo para praticar
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(exames || []).map((exame) => (
              <Card 
                key={`${exame.exame}-${exame.ano}`} 
                className="cursor-pointer hover:scale-[1.02] transition-all group min-h-[120px] animate-fade-in backdrop-blur-sm"
                style={{ background: 'hsla(345, 30%, 18%, 0.7)', borderColor: 'hsla(40, 60%, 50%, 0.15)' }}
                onClick={() => navigate(`/simulados/realizar?exame=${encodeURIComponent(exame.exame)}&ano=${exame.ano}`)}
              >
                <CardContent className="p-4 flex items-center gap-3 h-full">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0" style={{ background: 'linear-gradient(135deg, hsl(345, 65%, 30%), hsl(350, 40%, 20%))' }}>
                    <Gavel className="w-6 h-6" style={{ color: GOLD }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: 'hsl(40, 60%, 90%)' }}>
                      {exame.exame} - {exame.ano}
                    </h3>
                    <p className="text-xs truncate" style={{ color: 'hsl(40, 20%, 55%)' }}>
                      Banca: {exame.banca} • {exame.count} questões
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0" style={{ color: GOLD }} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimuladosExames;
