import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Scale, ArrowRight, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import brasaoRepublica from "@/assets/brasao-republica.png?format=webp&quality=80";

interface LeiPreview {
  id: string;
  numero_lei: string;
  tipo_ato: string | null;
  ementa: string | null;
}

export const LeisNovosNotification = () => {
  const navigate = useNavigate();
  const [leis, setLeis] = useState<LeiPreview[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    checkLeisHoje();
  }, []);

  const checkLeisHoje = async () => {
    try {
      const jaViu = localStorage.getItem("leis-dia-vistas-permanente");
      if (jaViu === "true") return;

      const dataKey = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await (supabase as any)
        .from("leis_push_2025")
        .select("id, numero_lei, tipo_ato, ementa")
        .eq("data_publicacao", dataKey)
        .order("ordem_dou", { ascending: true })
        .limit(10);

      if (error) {
        console.error("Erro ao buscar leis do dia:", error);
        return;
      }

      if (data && data.length > 0) {
        setLeis(data);
        setShowNotification(true);
      }
    } catch (error) {
      console.error("Erro ao verificar leis do dia:", error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowNotification(false);
      setIsClosing(false);
      localStorage.setItem("leis-dia-vistas-permanente", "true");
    }, 300);
  };

  const handleVerLeis = () => {
    handleClose();
    setTimeout(() => navigate("/vade-mecum/resenha-diaria"), 350);
  };

  const handleLeiClick = (lei: LeiPreview) => {
    handleClose();
    setTimeout(() => navigate(`/vade-mecum/resenha/push-${lei.id}`), 350);
  };

  if (!showNotification || leis.length === 0) return null;

  const count = leis.length;

  // Badge de tipo de ato
  const getTipoColor = (tipo: string | null) => {
    if (!tipo) return "bg-white/15 text-white/70 border-white/20";
    const t = tipo.toLowerCase();
    if (t.includes("decreto")) return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    if (t.includes("lei complementar")) return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    if (t.includes("lei")) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    return "bg-white/15 text-white/70 border-white/20";
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 ${
        isClosing ? "animate-fade-out" : "animate-fade-in"
      }`}
      onClick={handleClose}
    >
      <Card
        className={`max-w-md w-full shadow-2xl relative pt-12 ${
          isClosing ? "animate-scale-out" : "animate-scale-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brasão no topo */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
          <div className="w-22 h-22 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-amber-500/30"
               style={{ width: '5.5rem', height: '5.5rem' }}>
            <img src={brasaoRepublica} alt="Brasão" className="w-12 h-12 object-contain" />
          </div>
        </div>

        <CardHeader className="text-center pb-3">
          <CardTitle className="text-2xl">
            ⚖️ Leis do Dia
          </CardTitle>
          <Badge variant="outline" className="mx-auto mt-2 bg-red-500/10 text-red-400 border-red-500/30">
            {count} {count === 1 ? "nova lei publicada" : "novas leis publicadas"}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-white text-center leading-relaxed">
            {count === 1
              ? "Uma nova lei foi publicada hoje no Diário Oficial da União, com explicação completa."
              : `${count} novas leis foram publicadas hoje no Diário Oficial da União, com explicações completas.`}
          </p>

          {/* Carrossel horizontal de leis */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {leis.map((lei) => (
              <button
                key={lei.id}
                onClick={() => handleLeiClick(lei)}
                className="flex-shrink-0 w-[200px] snap-start bg-white/10 hover:bg-white/15 rounded-xl p-3 text-left transition-all group border border-white/10 hover:border-amber-400/30"
              >
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {lei.tipo_ato && (
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${getTipoColor(lei.tipo_ato)}`}>
                      {lei.tipo_ato}
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-white text-xs group-hover:text-amber-100 transition-colors">
                  {lei.numero_lei}
                </h4>
                {lei.ementa && (
                  <p className="text-white/50 text-[10px] leading-snug line-clamp-2 mt-1">
                    {lei.ementa}
                  </p>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleVerLeis}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white gap-2"
              size="lg"
            >
              <Scale className="w-4 h-4" />
              Ver leis
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              size="lg"
            >
              Entendi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
