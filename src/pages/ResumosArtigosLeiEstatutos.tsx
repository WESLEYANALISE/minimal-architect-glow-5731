import { useNavigate } from "react-router-dom";
import { Gavel, ArrowLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const estatutos = [
  { id: "eca", title: "Criança e Adolescente", sigla: "ECA", cor: "rgb(59, 130, 246)" },
  { id: "estatuto-idoso", title: "Estatuto do Idoso", sigla: "IDOSO", cor: "rgb(168, 85, 247)" },
  { id: "estatuto-oab", title: "Estatuto da OAB", sigla: "OAB", cor: "rgb(239, 68, 68)" },
  { id: "estatuto-pcd", title: "Pessoa com Deficiência", sigla: "PCD", cor: "rgb(34, 197, 94)" },
  { id: "estatuto-igualdade", title: "Igualdade Racial", sigla: "IGUALD", cor: "rgb(245, 158, 11)" },
  { id: "estatuto-cidade", title: "Estatuto da Cidade", sigla: "CIDADE", cor: "rgb(6, 182, 212)" },
  { id: "estatuto-torcedor", title: "Torcedor e Desporto", sigla: "TORC", cor: "rgb(16, 185, 129)" },
];

const ResumosArtigosLeiEstatutos = () => {
  const navigate = useNavigate();

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/resumos-juridicos/artigos-lei')}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50">
            <Gavel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Estatutos</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um estatuto para ver resumos dos artigos
            </p>
          </div>
        </div>
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {estatutos.map((estatuto, index) => (
          <div
            key={estatuto.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
          >
            <button
              onClick={() => navigate(`/resumos-juridicos/artigos-lei/temas?codigo=${estatuto.id}&cor=${encodeURIComponent(estatuto.cor)}`)}
               className="group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-lg h-[100px] w-full border backdrop-blur-sm"
               style={{ 
                 background: `linear-gradient(135deg, ${estatuto.cor}55, ${estatuto.cor}30)`,
                 borderColor: `${estatuto.cor}88`
               }}
            >
              <div className="absolute -right-3 -bottom-3 opacity-10">
                <FileText className="w-20 h-20" style={{ color: estatuto.cor }} />
              </div>
              <div className="rounded-xl p-2 w-fit mb-2" style={{ backgroundColor: `${estatuto.cor}30` }}>
                <FileText className="w-5 h-5" style={{ color: estatuto.cor }} />
              </div>
              <h3 className="font-semibold text-foreground text-sm leading-tight pr-6">
                {estatuto.sigla}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{estatuto.title}</p>
              <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumosArtigosLeiEstatutos;
