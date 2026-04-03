import { useState, useCallback } from "react";
import { Loader2, Lightbulb, BookOpen, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TermoHighlightProps {
  termo: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface DefinicaoData {
  definicao: string;
  exemploPratico?: string;
}

const TermoHighlight = ({ termo, children, disabled = false }: TermoHighlightProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<DefinicaoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDefinicao = useCallback(async () => {
    if (data) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: resposta, error: fnError } = await supabase.functions.invoke('gerar-definicao-termo', {
        body: { termo }
      });
      
      if (fnError) throw new Error(fnError.message);
      
      if (resposta?.success && resposta?.definicao) {
        setData({
          definicao: resposta.definicao,
          exemploPratico: resposta.exemploPratico
        });
      } else {
        throw new Error(resposta?.error || 'Erro ao gerar definição');
      }
    } catch (err) {
      console.error('Erro ao buscar definição:', err);
      setError('Não foi possível carregar a definição');
    } finally {
      setIsLoading(false);
    }
  }, [termo, data]);

  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
    fetchDefinicao();
  }, [fetchDefinicao]);

  const handleClose = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  }, []);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <>
      <span 
        className="text-orange-400 hover:text-orange-300 cursor-pointer underline decoration-orange-500/50 underline-offset-2 transition-colors font-medium"
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onTouchEnd={handleClick}
      >
        {children}
      </span>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          onClick={handleClose}
          onTouchEnd={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Bottom sheet on mobile, centered card on desktop */}
          <div 
            className="relative w-full sm:w-96 sm:max-w-[90vw] max-h-[70vh] bg-[#1a1a2e] border-t sm:border border-amber-500/30 sm:rounded-2xl rounded-t-2xl shadow-2xl shadow-black/70 animate-in slide-in-from-bottom duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                  {termo}
                </h4>
              </div>
              <button 
                onClick={handleClose}
                onTouchEnd={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                  <span className="ml-2 text-sm text-gray-400">Gerando definição...</span>
                </div>
              )}
              
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              
              {data && !isLoading && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                    {data.definicao}
                  </p>
                  
                  {data.exemploPratico && (
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                          Exemplo Prático
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                        {data.exemploPratico}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TermoHighlight;
