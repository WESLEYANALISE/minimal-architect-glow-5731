import { useState } from "react";
import { Play, BookOpen, X } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { VideoaulaArtigoView } from "./VideoaulaArtigoView";
import { ResumoArtigoSheet } from "./ResumoArtigoSheet";

interface EstudarArtigoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
  codeName: string;
  area: string;
}

export const EstudarArtigoSheet = ({
  isOpen,
  onClose,
  artigo,
  numeroArtigo,
  codeName,
  area,
}: EstudarArtigoSheetProps) => {
  const [showVideoaulas, setShowVideoaulas] = useState(false);
  const [showResumos, setShowResumos] = useState(false);

  const handleClose = () => {
    setShowVideoaulas(false);
    setShowResumos(false);
    onClose();
  };

  return (
    <>
      <Drawer open={isOpen && !showVideoaulas && !showResumos} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[50vh]">
          <div className="max-w-lg mx-auto w-full p-4 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Estudar Art. {numeroArtigo}</h3>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {/* Videoaulas */}
              <button
                onClick={() => setShowVideoaulas(true)}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                  <Play className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Videoaulas</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Buscar no YouTube</p>
                </div>
              </button>

              {/* Resumos */}
              <button
                onClick={() => setShowResumos(true)}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Resumos</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Cornell ou Feynman</p>
                </div>
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Videoaulas View */}
      <VideoaulaArtigoView
        isOpen={showVideoaulas}
        onClose={() => { setShowVideoaulas(false); onClose(); }}
        artigo={artigo}
        numeroArtigo={numeroArtigo}
        codeName={codeName}
        area={area}
      />

      {/* Resumos Sheet */}
      <ResumoArtigoSheet
        isOpen={showResumos}
        onClose={() => setShowResumos(false)}
        artigo={artigo}
        numeroArtigo={numeroArtigo}
        codeName={codeName}
        area={area}
      />
    </>
  );
};
