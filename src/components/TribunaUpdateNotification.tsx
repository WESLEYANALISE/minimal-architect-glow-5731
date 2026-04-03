import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { X, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import capaStf from "@/assets/tribuna/stf.jpg?format=webp&quality=75";

const STORAGE_KEY_PREFIX = "tribuna-update-vista-";

const limparCacheAntigo = () => {
  const now = Date.now();
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(STORAGE_KEY_PREFIX)) {
      const dateStr = key.replace(STORAGE_KEY_PREFIX, "");
      try {
        const diff = (now - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
        if (diff > 7) localStorage.removeItem(key);
      } catch {
        localStorage.removeItem(key);
      }
    }
  });
};

export const TribunaUpdateNotification = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const dataKey = format(new Date(), "yyyy-MM-dd");
  const storageKey = `${STORAGE_KEY_PREFIX}${dataKey}`;

  useEffect(() => {
    limparCacheAntigo();
    const jaViu = localStorage.getItem(storageKey) === "true";
    if (!jaViu) {
      // Delay to not compete with other notifications
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const marcarVisto = () => {
    localStorage.setItem(storageKey, "true");
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShow(false);
      setIsClosing(false);
      marcarVisto();
    }, 300);
  };

  const handleAcessar = () => {
    marcarVisto();
    navigate("/tribuna");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 ${
        isClosing ? "animate-fade-out" : "animate-fade-in"
      }`}
      onClick={handleClose}
    >
      <Card
        className={`max-w-sm w-full shadow-2xl relative pt-14 border-0 ${
          isClosing ? "animate-scale-out" : "animate-scale-in"
        } bg-gradient-to-b from-amber-950/90 to-background`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        {/* STF cover image */}
        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2">
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl ring-4 ring-amber-600/50">
            <img src={capaStf} alt="STF" className="w-full h-full object-cover" />
          </div>
        </div>

        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Nova Atualização</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <CardTitle className="text-xl text-white">Tribuna Atualizada</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Galeria institucional com fotos oficiais
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-black/20 text-center space-y-2">
            <p className="text-sm text-white/80">
              Explore o acervo fotográfico oficial de tribunais e instituições do Brasil — STF, STJ, TST, CNJ, TCU e TJSP.
            </p>
            <p className="text-xs text-amber-300/70">
              Milhares de fotos, álbuns e busca avançada
            </p>
          </div>

          <Button
            onClick={handleAcessar}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold relative overflow-hidden"
            size="lg"
          >
            Acessar Tribuna
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                animation: 'shimmer-slide 3s ease-in-out infinite',
              }}
            />
          </Button>

          <button
            onClick={handleClose}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Agora não
          </button>
        </CardContent>
      </Card>
    </div>
  );
};
