import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Target, DollarSign, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSimuladoFreeLimit } from "@/hooks/useSimuladoFreeLimit";
import { SimuladoFreeConfirmDialog } from "@/components/simulados/SimuladoFreeConfirmDialog";
import { PremiumBadge } from "@/components/PremiumBadge";

import capaEscrevente from "@/assets/capa-escrevente.webp";
import capaJuizSubstituto from "@/assets/capa-juiz-substituto.webp";
import capaAgentePF from "@/assets/capa-agente-pf.webp";
import capaDelegado from "@/assets/capa-delegado-policia.webp";
import capaOab from "@/assets/capa-oab-simulado.webp";

const CAPAS_CARGO: Record<string, string> = {
  "escrevente técnico judiciário": capaEscrevente,
  "juiz(a) substituto(a)": capaJuizSubstituto,
  "juiz substituto": capaJuizSubstituto,
  "agente de polícia federal": capaAgentePF,
  "delegado de polícia": capaDelegado,
  "oab": capaOab,
};

const SALARIOS_CARGO: Record<string, string> = {
  "escrevente técnico judiciário": "R$ 6.043",
  "juiz(a) substituto(a)": "R$ 32.350",
  "juiz substituto": "R$ 32.350",
  "agente de polícia federal": "R$ 14.710",
  "delegado de polícia": "R$ 26.838",
  "oab": "Advocacia",
};

function matchCargo<T>(cargo: string, map: Record<string, T>): T | null {
  const key = cargo.toLowerCase().trim();
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k) || k.includes(key)) return v as T;
  }
  return null;
}

interface CargoItem {
  cargo: string;
  capa: string;
  salario: string;
}

const STATIC_ITEMS: CargoItem[] = [
  { cargo: "OAB - Exame da Ordem", capa: capaOab, salario: "Advocacia" },
  { cargo: "Escrevente Técnico Judiciário", capa: capaEscrevente, salario: "R$ 6.043" },
  { cargo: "Juiz(a) Substituto(a)", capa: capaJuizSubstituto, salario: "R$ 32.350" },
  { cargo: "Delegado de Polícia", capa: capaDelegado, salario: "R$ 26.838" },
  { cargo: "Agente de Polícia Federal", capa: capaAgentePF, salario: "R$ 14.710" },
];

export const SimuladosCarousel = () => {
  const navigate = useNavigate();
  const [isTouching, setIsTouching] = useState(false);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const { isLocked, handleSimuladoClick, showConfirmation, confirmAndStart, cancelConfirmation } = useSimuladoFreeLimit();

  const handleTouchStart = useCallback(() => {
    setIsTouching(true);
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => setIsTouching(false), 3000);
  }, []);

  const { data: items = STATIC_ITEMS } = useQuery<CargoItem[]>({
    queryKey: ["simulados-carousel-home"],
    staleTime: 1000 * 60 * 30,
    placeholderData: STATIC_ITEMS,
    queryFn: async () => {
      const result: CargoItem[] = [];

      result.push({ cargo: "OAB - Exame da Ordem", capa: capaOab, salario: "Advocacia" });
      result.push({ cargo: "Escrevente Técnico Judiciário", capa: capaEscrevente, salario: "R$ 6.043" });

      const { data: concursos } = await supabase
        .from("simulados_concursos")
        .select("cargo")
        .order("created_at", { ascending: false });

      if (concursos) {
        const seen = new Set<string>();
        for (const c of concursos) {
          const cargo = c.cargo;
          if (!cargo) continue;
          const key = cargo.toLowerCase().trim();
          if (seen.has(key)) continue;
          seen.add(key);

          const capa = matchCargo(cargo, CAPAS_CARGO);
          const salario = matchCargo(cargo, SALARIOS_CARGO);
          if (capa) {
            result.push({ cargo, capa, salario: salario || "" });
          }
        }
      }

      const unique = new Map<string, CargoItem>();
      for (const item of result) {
        const k = item.cargo.toLowerCase().trim();
        if (!unique.has(k)) unique.set(k, item);
      }
      return Array.from(unique.values());
    },
  });

  const loopItems = useMemo(() => [...items, ...items], [items]);

  if (items.length === 0) return null;

  return (
    <div className="px-0 pb-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-red-500/20 rounded-xl">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Simulados</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Concursos e provas</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/ferramentas/simulados")}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-red-500/20 text-red-200 text-[10px] sm:text-xs font-medium"
        >
          Ver todos
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Carousel with infinite scroll animation */}
      <div
        className="w-full overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <div
          className={`flex gap-3 pl-4 ${isTouching ? '' : 'animate-[scrollLeft_50s_linear_infinite]'}`}
          style={{ width: "max-content", willChange: isTouching ? 'auto' : 'transform' }}
        >
          {loopItems.map((item, index) => (
            <button
              key={`${item.cargo}-${index}`}
              onClick={() => {
                const slug = item.cargo.toLowerCase().includes("oab")
                  ? "oab"
                  : encodeURIComponent(item.cargo);
                const navFn = () => navigate(`/ferramentas/simulados/cargo/${slug}`);
                const result = handleSimuladoClick(navFn);
                if (result === 'blocked') {
                  navigate('/assinatura');
                }
              }}
              className="flex-shrink-0 w-[130px] sm:w-[155px] md:w-[170px] overflow-hidden rounded-2xl text-left shadow-[0_8px_30px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.4)] group outline-none focus:outline-none relative"
              style={{ transform: 'translateZ(0)' }}
            >
              <div className="relative h-[170px] sm:h-[200px] overflow-hidden rounded-2xl">
                <img
                  src={item.capa}
                  alt={item.cargo}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-[1]" />
                {/* Animated shine sweep */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2] rounded-2xl">
                  <div
                    className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.12] to-transparent skew-x-[-20deg]"
                    style={{ animation: `shinePratique 4s ease-in-out infinite ${index * 0.7 + 1}s` }}
                  />
                </div>
                {/* Crown for locked or arrow */}
                {isLocked ? (
                  <PremiumBadge size="sm" position="top-right" />
                ) : (
                  <div className="absolute top-2 right-2 z-[12] w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
                    <ChevronRight className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                {/* Content over image */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-0.5 z-[2]">
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight whitespace-normal">
                    {item.cargo}
                  </p>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="text-amber-400 font-bold text-[11px] sm:text-xs">{item.salario}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <SimuladoFreeConfirmDialog
        open={showConfirmation}
        onConfirm={confirmAndStart}
        onCancel={cancelConfirmation}
      />
    </div>
  );
};
