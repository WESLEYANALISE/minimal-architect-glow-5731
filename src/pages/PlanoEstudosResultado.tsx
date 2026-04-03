import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, FileDown, Clock, BookOpen, Target, Lightbulb, CheckSquare, RefreshCw, GraduationCap, Book, Video, FileText, HelpCircle, Layers, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { processarPlanoEstudos, PlanoEstudosData } from "@/lib/planoEstudosParser";
import { PlanoEstudosAccordion } from "@/components/PlanoEstudosAccordion";
import { exportarPlanoPDF } from "@/lib/exportarPlanoPDF";
import { Badge } from "@/components/ui/badge";

const PlanoEstudosResultado = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plano, materia, totalHoras } = location.state || {};
  const [isExporting, setIsExporting] = useState(false);

  const planoData: PlanoEstudosData = processarPlanoEstudos(plano || {});

  if (!plano) {
    navigate("/plano-estudos");
    return null;
  }

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const url = await exportarPlanoPDF({
        plano: planoData,
        materia,
        totalHoras,
        dataGeracao: new Date().toLocaleDateString('pt-BR'),
      });
      
      if (url) {
        toast({ title: "PDF aberto!", description: "O PDF foi aberto em uma nova aba." });
      } else {
        throw new Error("Falha ao gerar URL");
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast({ title: "Erro ao exportar", description: "Tente novamente em alguns instantes.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const getMaterialIcon = (tipo: string) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('livro')) return Book;
    if (tipoLower.includes('vídeo') || tipoLower.includes('video')) return Video;
    return FileText;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Fixo */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/plano-estudos")} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold truncate">Plano de Estudos</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Seu cronograma personalizado</p>
            </div>
          </div>
          <Button onClick={handleExportPDF} size="sm" className="shrink-0 gap-2" disabled={isExporting}>
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="px-4 py-6 max-w-4xl mx-auto space-y-4 pb-24 md:pb-6">
        {/* Card de Informações */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-primary to-primary/80 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-primary-foreground/70 uppercase tracking-wider font-medium">Matéria</p>
                <p className="font-bold text-lg text-primary-foreground truncate">{materia}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-foreground/70" />
                  <span className="text-xs text-primary-foreground/70">Carga Total</span>
                </div>
                <p className="font-bold text-xl text-primary-foreground mt-1">{planoData.visaoGeral.cargaTotal || `${totalHoras}h`}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary-foreground/70" />
                  <span className="text-xs text-primary-foreground/70">Semanas</span>
                </div>
                <p className="font-bold text-xl text-primary-foreground mt-1">{planoData.cronograma.length || '-'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hidden md:block">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-foreground/70" />
                  <span className="text-xs text-primary-foreground/70">Frequência</span>
                </div>
                <p className="font-bold text-lg text-primary-foreground mt-1">{planoData.visaoGeral.frequencia || '-'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hidden md:block">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-foreground/70" />
                  <span className="text-xs text-primary-foreground/70">Intensidade</span>
                </div>
                <p className="font-bold text-lg text-primary-foreground mt-1">{planoData.visaoGeral.intensidade || '-'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Objetivo */}
        {planoData.objetivo && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10">
                  <Target className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-lg font-bold">Objetivo</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{planoData.objetivo}</p>
            </CardContent>
          </Card>
        )}

        {/* Visão Geral */}
        {planoData.visaoGeral.descricao && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 md:p-6 bg-muted/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-bold">Visão Geral</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{planoData.visaoGeral.descricao}</p>
            </CardContent>
          </Card>
        )}

        {/* Cronograma Semanal */}
        {planoData.cronograma.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold">Cronograma Semanal</h2>
              <Badge variant="secondary" className="ml-auto">{planoData.cronograma.length} semanas</Badge>
            </div>
            <PlanoEstudosAccordion semanas={planoData.cronograma} />
          </div>
        )}

        {/* Livros Recomendados no App */}
        {planoData.livrosRecomendados.length > 0 && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10">
                  <Book className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Livros Recomendados no App</h2>
                  <p className="text-xs text-muted-foreground">Disponíveis na biblioteca do Direito Premium</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {planoData.livrosRecomendados.map((livro, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate("/biblioteca-estudos")}
                    className="flex items-center gap-3 p-3 bg-muted/40 hover:bg-muted/60 rounded-lg border border-border/30 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 shrink-0">
                      <Book className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{livro.titulo}</p>
                      <p className="text-xs text-muted-foreground">{livro.area}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pratique Questões e Flashcards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card
            className="border-0 shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/questoes")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 shrink-0">
                <HelpCircle className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">Pratique Questões</p>
                <p className="text-xs text-muted-foreground">Teste seus conhecimentos sobre {materia}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/flashcards")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 shrink-0">
                <Layers className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">Flashcards</p>
                <p className="text-xs text-muted-foreground">Revise com flashcards de {materia}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </div>

        {/* Materiais de Estudo */}
        {planoData.materiais.length > 0 && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold">Materiais de Estudo</h2>
              </div>
              <div className="space-y-3">
                {planoData.materiais.map((material, idx) => {
                  const IconComponent = getMaterialIcon(material.tipo);
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 shrink-0">
                        <IconComponent className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{material.tipo}</Badge>
                          <span className="font-medium text-foreground">{material.titulo}</span>
                        </div>
                        {material.autor && <p className="text-xs text-muted-foreground mt-1">Por: {material.autor}</p>}
                        {material.detalhes && <p className="text-sm text-muted-foreground mt-1">{material.detalhes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estratégias */}
        {planoData.estrategias.length > 0 && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                  <Lightbulb className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-lg font-bold">Estratégias de Estudo</h2>
              </div>
              <div className="space-y-3">
                {planoData.estrategias.map((estrategia, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-foreground mb-1">{idx + 1}. {estrategia.titulo}</p>
                    <p className="text-sm text-muted-foreground">{estrategia.descricao}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checklist */}
        {planoData.checklist.length > 0 && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-lg font-bold">Checklist de Metas</h2>
              </div>
              <div className="space-y-2">
                {planoData.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-600">{item.semana}</span>
                    </div>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">Semana {item.semana}:</span>{' '}
                      <span className="text-muted-foreground">{item.meta}</span>
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revisão Final */}
        {planoData.revisaoFinal.descricao && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
                  <RefreshCw className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold">Revisão Final</h2>
              </div>
              <p className="text-muted-foreground mb-3">{planoData.revisaoFinal.descricao}</p>
              {planoData.revisaoFinal.simulado && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="font-medium text-foreground mb-2">📝 Simulado Final</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Duração:</strong> {planoData.revisaoFinal.simulado.duracao}</p>
                    <p><strong>Formato:</strong> {planoData.revisaoFinal.simulado.formato}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botão Desktop */}
        <div className="hidden md:block">
          <Button onClick={() => navigate("/plano-estudos")} variant="outline" className="w-full" size="lg">
            Criar Novo Plano
          </Button>
        </div>
      </main>

      {/* Footer Fixo Mobile */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4 md:hidden">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Button onClick={() => navigate("/plano-estudos")} variant="outline" className="flex-1">
            Novo Plano
          </Button>
          <Button onClick={handleExportPDF} className="flex-1 gap-2" disabled={isExporting}>
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default PlanoEstudosResultado;
