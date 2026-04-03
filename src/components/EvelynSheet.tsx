import { ArrowLeft } from "lucide-react";
import atalhoEvelyn from '@/assets/atalho-evelyn.webp';
import Evelyn from '@/pages/Evelyn';
import SparkleHeroTitle from '@/components/SparkleHeroTitle';

interface EvelynSheetProps {
  open: boolean;
  onClose: () => void;
}

export const EvelynSheet = ({ open, onClose }: EvelynSheetProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ animation: 'slideUpFull 300ms ease-out forwards' }}
    >
      <div className="absolute inset-0 bg-background overflow-y-auto">
        {/* Hero */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={atalhoEvelyn}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/85" />

          {/* Back button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-black/70 transition-colors"
            style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Voltar</span>
          </button>

          {/* Hero text — centralizado, mais acima */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <SparkleHeroTitle
              line1="Sua assistente"
              line2="jurídica no WhatsApp"
              colorHex="rgba(167,243,208,0.8)"
            />
          </div>
        </div>

        {/* Content — renderiza a página Evelyn */}
        <div className="relative rounded-t-[32px] bg-muted -mt-6 min-h-screen pb-20 overflow-hidden">
          <style>{`
            .evelyn-sheet-wrapper > div { background: transparent !important; }
            .evelyn-sheet-wrapper .flex.flex-col.min-h-screen.bg-background { background: transparent !important; }
          `}</style>
          <div className="evelyn-sheet-wrapper">
            <Evelyn />
          </div>
        </div>
      </div>
    </div>
  );
};

