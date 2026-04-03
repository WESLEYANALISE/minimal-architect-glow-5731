import { motion } from "framer-motion";
import { FileText, Search, Users, Package, Shield, AlertTriangle, CheckCircle, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ProvaData {
  nome: string;
  descricao: string;
  tipo: string;
  relevancia: string;
  apresentada_por: number;
  deve_deferir: boolean;
  motivo: string;
}

interface BatalhaProvasProps {
  provas: ProvaData[];
  parte1Nome: string;
  parte2Nome: string;
  parte1Papel: string;
  parte2Papel: string;
  onIniciarJulgamento: () => void;
}

const tipoIcon: Record<string, React.ReactNode> = {
  documental: <FileText className="w-4 h-4" />,
  pericial: <Search className="w-4 h-4" />,
  testemunhal: <Users className="w-4 h-4" />,
  material: <Package className="w-4 h-4" />,
};

const relevanciaConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  forte: { label: "Forte", class: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: <Shield className="w-3 h-3" /> },
  media: { label: "Média", class: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: <AlertTriangle className="w-3 h-3" /> },
  fraca: { label: "Fraca", class: "bg-red-500/20 text-red-300 border-red-500/30", icon: <AlertTriangle className="w-3 h-3" /> },
};

const BatalhaProvas = ({ provas, parte1Nome, parte2Nome, parte1Papel, parte2Papel, onIniciarJulgamento }: BatalhaProvasProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-4"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto"
        >
          <FileText className="w-7 h-7 text-white" />
        </motion.div>
        <h2 className="text-xl font-bold text-white">Provas do Processo</h2>
        <p className="text-gray-400 text-sm">Analise as provas antes de iniciar o julgamento</p>
      </div>

      {/* Provas list */}
      <div className="space-y-3">
        {provas.map((prova, i) => {
          const rel = relevanciaConfig[prova.relevancia] || relevanciaConfig.media;
          const icon = tipoIcon[prova.tipo] || <FileText className="w-4 h-4" />;
          const parteNome = prova.apresentada_por === 1 ? parte1Nome : parte2Nome;
          const partePapel = prova.apresentada_por === 1 ? parte1Papel : parte2Papel;
          const isPartOne = prova.apresentada_por === 1;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: isPartOne ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl border p-4 space-y-2 ${
                isPartOne
                  ? "bg-blue-900/10 border-blue-500/20"
                  : "bg-red-900/10 border-red-500/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isPartOne ? "bg-blue-500/20 text-blue-300" : "bg-red-500/20 text-red-300"
                  }`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{prova.nome}</p>
                    <p className="text-gray-500 text-xs capitalize">{prova.tipo}</p>
                  </div>
                </div>
                <Badge className={`${rel.class} text-xs gap-1`}>
                  {rel.icon}
                  {rel.label}
                </Badge>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed">{prova.descricao}</p>

              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CheckCircle className="w-3 h-3" />
                <span>Apresentada por: <span className={isPartOne ? "text-blue-300" : "text-red-300"}>{parteNome}</span> ({partePapel})</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: provas.length * 0.1 + 0.3 }}
      >
        <Button
          onClick={onIniciarJulgamento}
          className="w-full h-12 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-base gap-2"
        >
          <Gavel className="w-5 h-5" />
          Iniciar Julgamento
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default BatalhaProvas;
