import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, BookOpen, Clock, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import capaFaculdade from "@/assets/capa-faculdade.jpg";

import logoUsp from "@/assets/logo-usp.png";
import logoUnip from "@/assets/logo-unip.png";
import logoAnhanguera from "@/assets/logo-anhanguera.png";
import logoEstacio from "@/assets/logo-estacio.png";
import logoUninove from "@/assets/logo-uninove.png";
import logoUnopar from "@/assets/logo-unopar.png";
import logoPucsp from "@/assets/logo-pucsp.png";
import logoMackenzie from "@/assets/logo-mackenzie.png";
import logoUfmg from "@/assets/logo-ufmg.png";
import logoUerj from "@/assets/logo-uerj.png";

const LOGOS: Record<string, string> = {
  "usp": logoUsp,
  "unip": logoUnip,
  "anhanguera": logoAnhanguera,
  "estácio": logoEstacio,
  "estacio": logoEstacio,
  "uninove": logoUninove,
  "unopar": logoUnopar,
  "puc-sp": logoPucsp,
  "mackenzie": logoMackenzie,
  "ufmg": logoUfmg,
  "uerj": logoUerj,
};

function getLogoForUni(nome: string): string | null {
  const key = nome.toLowerCase().trim();
  for (const [k, v] of Object.entries(LOGOS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

const FaculdadeUniversidades = () => {
  const navigate = useNavigate();

  const { data: universidades, isLoading } = useQuery({
    queryKey: ["faculdade-universidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculdade_universidades")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-background to-background pointer-events-none" />

      <div className="flex-1 px-4 md:px-6 py-5 md:py-8 space-y-4 relative">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-lg font-bold text-foreground leading-tight">Trilhas da Faculdade</h1>
        </div>

        {/* Cover Image */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl animate-fade-in">
          <img
            src={capaFaculdade}
            alt="Faculdade de Direito"
            className="w-full h-[180px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>Plano de Estudos</span>
            </div>
            <p className="text-white font-bold text-base">Grade Curricular Completa</p>
            <p className="text-white/60 text-xs mt-0.5">
              {universidades?.filter(u => u.ativo).length || 0} universidades disponíveis
            </p>
          </div>
        </div>

        {/* University List */}
        <div className="space-y-2.5 animate-fade-in">
          {universidades?.map((uni) => {
            const logo = getLogoForUni(uni.nome);
            return (
              <Card
                key={uni.id}
                className={`overflow-hidden transition-all border-l-4 ${
                  uni.ativo
                    ? "cursor-pointer hover:scale-[1.01] hover:shadow-md border-l-red-500/60 border-border/40"
                    : "opacity-50 border-l-muted border-border/20"
                }`}
                onClick={() => uni.ativo && navigate(`/faculdade/universidade/${uni.id}/trilhas`)}
              >
                <CardContent className="p-0 flex items-stretch">
                  {/* Logo */}
                  <div className="w-16 flex-shrink-0 flex items-center justify-center bg-muted/30 p-2">
                    {logo ? (
                      <img
                        src={logo}
                        alt={uni.nome}
                        className="w-10 h-10 object-contain rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-red-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-3 flex items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-red-400">{uni.nome}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{uni.nome_completo}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {uni.total_semestres} semestres
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {uni.duracao_anos} anos
                        </span>
                      </div>
                    </div>
                    {uni.ativo ? (
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">Em breve</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FaculdadeUniversidades;
