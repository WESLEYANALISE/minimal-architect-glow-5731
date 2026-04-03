import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";

interface ArsenalResultadoViewerProps {
  conteudo: string;
  titulo?: string;
  onExportar?: () => void;
  exportLabel?: string;
}

export const ArsenalResultadoViewer = ({
  conteudo,
  titulo,
  onExportar,
  exportLabel = "Exportar",
}: ArsenalResultadoViewerProps) => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = async () => {
    const sucesso = await copyToClipboard(conteudo);
    if (sucesso) {
      setCopiado(true);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopiado(false), 2000);
    } else {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="space-y-3">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        {titulo && <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>}
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopiar}
            className="h-8 text-xs gap-1.5"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiado ? "Copiado!" : "Copiar"}
          </Button>
          {onExportar && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportar}
              className="h-8 text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {exportLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo Markdown */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
        <div className="prose prose-sm prose-invert max-w-none
          prose-headings:text-foreground prose-headings:font-bold
          prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2
          prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1
          prose-p:text-[13px] prose-p:text-foreground/90 prose-p:leading-relaxed
          prose-li:text-[13px] prose-li:text-foreground/90
          prose-strong:text-foreground
          prose-table:text-[12px] prose-th:text-[12px] prose-td:text-[12px]
          prose-th:p-2 prose-td:p-2
          prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground
          prose-code:text-[12px] prose-code:bg-muted prose-code:px-1 prose-code:rounded
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{conteudo}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
