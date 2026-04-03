import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Building2 } from "lucide-react";

interface DespesaCardProps {
  despesa: {
    tipoDespesa: string;
    nomeFornecedor: string;
    valorDocumento: number;
    valorLiquido: number;
    dataDocumento: string;
    urlDocumento?: string;
  };
  index?: number;
}

export const DespesaCard = ({ despesa, index = 0 }: DespesaCardProps) => {
  return (
    <Card 
      className="bg-card border border-border/50 hover:border-primary/30 transition-all animate-fade-in"
      style={{
        animationDelay: `${index * 0.06}s`,
        animationFillMode: 'backwards'
      }}
    >
      <CardContent className="p-3">
        <div className="flex gap-3 items-start">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs text-foreground line-clamp-2">
              {despesa.tipoDespesa}
            </h3>
            
            <div className="flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3 h-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground truncate">
                {despesa.nomeFornecedor}
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-1.5">
              <div>
                <p className="text-sm font-bold text-primary">
                  {despesa.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                {despesa.valorDocumento !== despesa.valorLiquido && (
                  <p className="text-[10px] text-muted-foreground line-through">
                    {despesa.valorDocumento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}
              </div>
              
              <p className="text-[10px] text-muted-foreground">
                {new Date(despesa.dataDocumento).toLocaleDateString('pt-BR')}
              </p>
            </div>
            
            {despesa.urlDocumento && (
              <a
                href={despesa.urlDocumento}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary/70 hover:text-primary mt-1 inline-block"
              >
                Ver comprovante →
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
