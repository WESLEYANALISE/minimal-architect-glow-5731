import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";
import { useExternalBrowser } from "@/hooks/use-external-browser";

interface SuporteChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TAWK_PROPERTY_ID = "6334e74154f06e12d8976e15";
const TAWK_WIDGET_ID = "1ge3aemji";
const TAWK_DIRECT_URL = `https://tawk.to/chat/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
const LOAD_TIMEOUT_MS = 20000;

export const SuporteChatModal = ({ open, onOpenChange }: SuporteChatModalProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isNative } = useCapacitorPlatform();
  const { openUrl } = useExternalBrowser();

  useEffect(() => {
    if (open && isNative) {
      openUrl(TAWK_DIRECT_URL);
      onOpenChange(false);
      return;
    }

    if (open) {
      setLoading(true);
      setError(false);
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        setError(true);
      }, LOAD_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [open, isNative]);

  const handleIframeLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(false);
    setError(false);
  };

  const handleOpenExternal = () => {
    window.open(TAWK_DIRECT_URL, "_blank");
  };

  if (!open || isNative) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center gap-4 px-4 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">Suporte Direito Premium</h2>
      </div>

      <div className="flex-1 relative">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-lg font-medium">Chat indisponível no momento</p>
            <p className="text-sm text-muted-foreground">
              O chat não pôde ser carregado. Tente abrir em uma nova aba.
            </p>
            <Button onClick={handleOpenExternal} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Abrir chat em nova aba
            </Button>
          </div>
        )}

        <iframe
          src={TAWK_DIRECT_URL}
          className="w-full h-full border-0"
          title="Chat de Suporte"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="microphone; camera"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
};
