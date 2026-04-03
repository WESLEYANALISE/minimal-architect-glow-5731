import { useState } from "react";
import { X, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeiOrdinariaModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkPlanalto: string;
  numeroLei: string;
}

export function LeiOrdinariaModal({ isOpen, onClose, linkPlanalto, numeroLei }: LeiOrdinariaModalProps) {
  const [loading, setLoading] = useState(true);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-background"
      style={{
        animation: 'slideUp 300ms ease-out forwards',
      }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-card border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm text-foreground truncate">
            Lei nº {numeroLei}
          </h2>
          <p className="text-xs text-muted-foreground">Texto integral — Planalto</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(linkPlanalto, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <iframe
          src={linkPlanalto}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title={`Lei nº ${numeroLei}`}
        />
      </div>
    </div>
  );
}
