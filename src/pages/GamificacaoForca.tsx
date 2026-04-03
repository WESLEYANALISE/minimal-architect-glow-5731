import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useProgressoMateria } from "@/hooks/useGamificacao";
import { ForcaJogoNivel } from "@/components/gamificacao/ForcaJogoNivel";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const MATERIAS_MAP: Record<string, string> = {
  "direito-penal": "Direito Penal",
  "direito-civil": "Direito Civil",
  "direito-constitucional": "Direito Constitucional",
  "direito-processual-civil": "Direito Processual Civil",
  "direito-do-trabalho": "Direito do Trabalho",
  "direito-tributario": "Direito Tributário",
  "direito-administrativo": "Direito Administrativo",
  "direito-processual-penal": "Direito Processual Penal",
  "direito-empresarial": "Direito Empresarial",
  "direitos-humanos": "Direitos Humanos",
};

const GamificacaoForca = () => {
  const { materia, nivel } = useParams<{ materia: string; nivel: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const materiaNome = MATERIAS_MAP[materia || ""] || materia || "";
  const nivelNum = parseInt(nivel || "1");

  const { data: progresso = [] } = useProgressoMateria(materiaNome);
  const progressoNivel = progresso.find(p => p.nivel === nivelNum) || null;

  useEffect(() => {
    if (user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-20">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-background to-background" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/gamificacao/${materia}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">{materiaNome}</h1>
          <p className="text-xs text-muted-foreground">Nível {nivelNum}</p>
        </div>
      </div>

      <div className="relative z-10">
        <ForcaJogoNivel
          materia={materiaNome}
          nivel={nivelNum}
          materiaSlug={materia || ""}
          onComplete={() => navigate(`/gamificacao/${materia}`)}
          progressoExistente={progressoNivel}
        />
      </div>
    </div>
  );
};

export default GamificacaoForca;
