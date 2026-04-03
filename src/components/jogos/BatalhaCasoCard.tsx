import { motion } from "framer-motion";
import { Gavel, Swords, FileText, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { highlightCasoText } from "./batalhaHighlight";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BatalhaCasoCardProps {
  caso: string;
  tema: string;
  pontos_chave?: string[];
  nivel?: string;
  onIniciar: () => void;
}

const nivelLabel: Record<string, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

const nivelBadgeClass: Record<string, string> = {
  facil: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  medio: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  dificil: "bg-red-500/20 text-red-300 border-red-500/30",
};

const BatalhaCasoCard = ({ caso, tema, pontos_chave, nivel, onIniciar }: BatalhaCasoCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
            <Gavel className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white text-lg">Caso Jurídico</h2>
            <div className="flex gap-2 mt-1">
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                {tema}
              </Badge>
              {nivel && (
                <Badge className={`${nivelBadgeClass[nivel] || ""} text-xs`}>
                  {nivelLabel[nivel] || nivel}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Caso / Resumo */}
        <Tabs defaultValue="caso" className="w-full">
          <div className="px-4 pt-3">
            <TabsList className="w-full bg-neutral-800/80 border border-white/5">
              <TabsTrigger value="caso" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-neutral-700">
                <FileText className="w-3.5 h-3.5" />
                Caso Jurídico
              </TabsTrigger>
              <TabsTrigger value="resumo" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-neutral-700">
                <List className="w-3.5 h-3.5" />
                Resumo
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="caso" className="mt-0">
            <div className="p-5">
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {highlightCasoText(caso)}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="resumo" className="mt-0">
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-3">
                Pontos-Chave
              </p>
              {pontos_chave && pontos_chave.length > 0 ? (
                pontos_chave.map((ponto, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/50 border border-white/5"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-300 text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{ponto}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Nenhum ponto-chave disponível.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action */}
        <div className="p-4 border-t border-white/10">
          <Button
            onClick={onIniciar}
            className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-base gap-2"
          >
            <Swords className="w-5 h-5" />
            Iniciar Batalha
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default BatalhaCasoCard;
