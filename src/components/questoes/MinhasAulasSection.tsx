import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AulaHistorico {
  id: string;
  tema: string;
  area: string | null;
  aula_id: string | null;
  origem: string | null;
  created_at: string;
}

export const MinhasAulasSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aulas, setAulas] = useState<AulaHistorico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_aulas_historico")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setAulas(data as AulaHistorico[]);
        setLoading(false);
      });
  }, [user]);

  if (loading || aulas.length === 0) return null;

  const handleOpen = (aula: AulaHistorico) => {
    sessionStorage.setItem("aulaGeradaChat", JSON.stringify({
      tema: aula.tema,
      fromReforco: true,
    }));
    navigate("/aula-interativa");
  };

  const shortName = (area: string) =>
    area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '');

  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        Minhas Aulas
      </h3>
      <div className="space-y-2">
        {aulas.map(aula => (
          <button
            key={aula.id}
            onClick={() => handleOpen(aula)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 text-left hover:border-primary/30 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {aula.area ? shortName(aula.area) : aula.tema}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(aula.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
