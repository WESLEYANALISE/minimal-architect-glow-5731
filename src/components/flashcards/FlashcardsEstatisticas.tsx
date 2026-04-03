import { Brain, BookOpen, CheckCircle2, RotateCcw, Flame, Trash2 } from "lucide-react";
import { useFlashcardStats, useFlashcardStudyProgress } from "@/hooks/useFlashcardStudyProgress";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getAreaHex } from "@/lib/flashcardsAreaColors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const FlashcardsEstatisticas = () => {
  const { data, isLoading } = useFlashcardStats();
  const { resetProgress } = useFlashcardStudyProgress();

  const compreendi = data?.compreendi || 0;
  const revisar = data?.revisar || 0;
  const total = data?.total || 0;
  const streak = data?.streak || 0;
  const areaStats = data?.areaStats || [];

  const needsReview = [...areaStats].sort((a, b) => b.revisar - a.revisar).filter(a => a.revisar > 0);
  const mostMastered = [...areaStats].sort((a, b) => b.percentDominio - a.percentDominio).filter(a => a.compreendi > 0);

  return (
    <div className="px-4 space-y-4 pb-4">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-card rounded-xl p-3 border text-center">
          <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-xl font-bold text-foreground">{total}</p>
          <p className="text-[10px] text-muted-foreground">Estudados</p>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
          <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
          <p className="text-xl font-bold text-emerald-500">{compreendi}</p>
          <p className="text-[10px] text-emerald-600">Compreendi</p>
        </div>
        <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-center">
          <RotateCcw className="w-5 h-5 mx-auto mb-1 text-amber-500" />
          <p className="text-xl font-bold text-amber-500">{revisar}</p>
          <p className="text-[10px] text-amber-600">Revisar</p>
        </div>
        <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/20 text-center">
          <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
          <p className="text-xl font-bold text-orange-500">{streak}</p>
          <p className="text-[10px] text-orange-600">Dias seguidos</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum flashcard estudado ainda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Estude flashcards para ver suas estatísticas aqui
          </p>
        </div>
      ) : (
        <>
          {/* Precisa Revisar */}
          {needsReview.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-amber-500 mb-2 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Precisa Revisar
              </h3>
              <div className="space-y-2">
                {needsReview.slice(0, 5).map(stat => {
                  const hex = getAreaHex(stat.area);
                  return (
                    <div key={stat.area} className="bg-card rounded-xl p-3 border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold" style={{ color: hex }}>{stat.area}</span>
                        <span className="text-[10px] text-amber-500">{stat.revisar} para revisar</span>
                      </div>
                      <Progress value={stat.percentDominio} className="h-1.5" />
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{stat.compreendi} compreendi · {stat.revisar} revisar</span>
                        <span className="text-[10px] text-muted-foreground">{stat.percentDominio}% domínio</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mais Domina */}
          {mostMastered.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-emerald-500 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Mais Domina
              </h3>
              <div className="space-y-2">
                {mostMastered.slice(0, 5).map(stat => {
                  const hex = getAreaHex(stat.area);
                  return (
                    <div key={stat.area} className="bg-card rounded-xl p-3 border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold" style={{ color: hex }}>{stat.area}</span>
                        <span className="text-[10px] text-emerald-500">{stat.percentDominio}% domínio</span>
                      </div>
                      <Progress value={stat.percentDominio} className="h-1.5" />
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{stat.total} estudados</span>
                        <span className="text-[10px] text-muted-foreground">{stat.compreendi} compreendi</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botão Reiniciar */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-xs gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10">
                <Trash2 className="w-3.5 h-3.5" />
                Reiniciar todos os flashcards
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reiniciar progresso?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apagará todo o seu progresso de flashcards. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => resetProgress()} className="bg-red-500 hover:bg-red-600">
                  Reiniciar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default FlashcardsEstatisticas;
