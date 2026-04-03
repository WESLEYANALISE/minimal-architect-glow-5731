import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const leis = [
  { id: "lep", title: "Lei de Execução Penal", sigla: "LEP", cor: "rgb(239, 68, 68)" },
  { id: "lcp", title: "Contravenções Penais", sigla: "LCP", cor: "rgb(168, 85, 247)" },
  { id: "drogas", title: "Lei de Drogas", sigla: "DROGAS", cor: "rgb(34, 197, 94)" },
  { id: "maria-da-penha", title: "Maria da Penha", sigla: "MARIA", cor: "rgb(236, 72, 153)" },
  { id: "crimes-hediondos", title: "Crimes Hediondos", sigla: "HED", cor: "rgb(220, 38, 38)" },
  { id: "tortura", title: "Lei de Tortura", sigla: "TORT", cor: "rgb(249, 115, 22)" },
  { id: "organizacoes-criminosas", title: "Organizações Criminosas", sigla: "ORCRIM", cor: "rgb(99, 102, 241)" },
  { id: "lavagem-dinheiro", title: "Lavagem de Dinheiro", sigla: "LAV", cor: "rgb(16, 185, 129)" },
  { id: "interceptacao-telefonica", title: "Interceptação Telefônica", sigla: "INTER", cor: "rgb(6, 182, 212)" },
  { id: "abuso-autoridade", title: "Abuso de Autoridade", sigla: "ABUSO", cor: "rgb(245, 158, 11)" },
  { id: "juizados-especiais-criminais", title: "Juizados Especiais", sigla: "JECRIM", cor: "rgb(59, 130, 246)" },
  { id: "estatuto-desarmamento", title: "Desarmamento", sigla: "ARMAS", cor: "rgb(107, 114, 128)" },
];

const ResumosArtigosLeiLegislacao = () => {
  const navigate = useNavigate();

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/resumos-juridicos/artigos-lei')}
            className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-600/50">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Legislação Penal</h1>
            <p className="text-sm text-muted-foreground">Leis Penais Especiais</p>
          </div>
        </div>
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {leis.map((lei, index) => (
          <div
            key={lei.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
          >
            <button
              onClick={() => navigate(`/resumos-juridicos/artigos-lei/temas?codigo=${lei.id}&cor=${encodeURIComponent(lei.cor)}`)}
              className="group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-lg h-[100px] w-full border backdrop-blur-sm"
              style={{ 
                background: `linear-gradient(135deg, ${lei.cor}55, ${lei.cor}30)`,
                borderColor: `${lei.cor}88`
              }}
            >
              <div className="absolute -right-3 -bottom-3 opacity-10">
                <Shield className="w-20 h-20" style={{ color: lei.cor }} />
              </div>
              <div className="rounded-xl p-2 w-fit mb-2" style={{ backgroundColor: `${lei.cor}30` }}>
                <Shield className="w-5 h-5" style={{ color: lei.cor }} />
              </div>
              <h3 className="font-semibold text-foreground text-sm leading-tight pr-6">
                {lei.sigla}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{lei.title}</p>
              <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumosArtigosLeiLegislacao;
