import { useState, useEffect } from "react";
import { Plus, BookMarked, Play, Trash2, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Caderno {
  id: string;
  nome: string;
  areas: string[];
  criadoEm: string;
  cor: string;
}

interface Props {
  onBack: () => void;
}

const STORAGE_KEY = "flashcards-cadernos";

const CORES = [
  "linear-gradient(135deg, hsl(8 65% 48%), hsl(8 55% 38%))",
  "linear-gradient(135deg, hsl(152 60% 42%), hsl(160 55% 34%))",
  "linear-gradient(135deg, hsl(210 55% 45%), hsl(220 50% 38%))",
  "linear-gradient(135deg, hsl(265 65% 55%), hsl(280 60% 42%))",
  "linear-gradient(135deg, hsl(25 80% 50%), hsl(15 70% 40%))",
  "linear-gradient(135deg, hsl(340 65% 50%), hsl(350 55% 40%))",
];

const AREAS_DISPONIVEIS = [
  "Direito Constitucional", "Direito Administrativo", "Direito Penal",
  "Direito Processual Penal", "Direito Civil", "Direito Processual Civil",
  "Direito do Trabalho", "Direito Tributário", "Direito Empresarial",
  "Direitos Humanos", "Direito Ambiental", "Direito do Consumidor",
  "Direito Eleitoral", "Direito Previdenciário",
];

const EXEMPLOS: Caderno[] = [
  { id: "ex-1", nome: "OAB Essencial", areas: ["Direito Constitucional", "Direito Civil", "Direito Penal"], criadoEm: new Date().toISOString(), cor: CORES[0] },
  { id: "ex-2", nome: "Penal Intensivo", areas: ["Direito Penal", "Direito Processual Penal"], criadoEm: new Date().toISOString(), cor: CORES[2] },
  { id: "ex-3", nome: "Direitos Fundamentais", areas: ["Direito Constitucional", "Direitos Humanos"], criadoEm: new Date().toISOString(), cor: CORES[3] },
];

const getCadernos = (): Caderno[] => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return [];
};
const saveCadernos = (c: Caderno[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
const shortName = (a: string) => a.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, "").replace(/^Direitos\s+/i, "");

export const FlashcardsCadernos = ({ onBack }: Props) => {
  const [cadernos, setCadernos] = useState<Caderno[]>([]);
  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novasAreas, setNovasAreas] = useState<string[]>([]);

  useEffect(() => {
    let loaded = getCadernos();
    if (loaded.length === 0) { loaded = EXEMPLOS; saveCadernos(loaded); }
    setCadernos(loaded);
  }, []);

  const handleCriar = () => {
    if (!novoNome.trim() || novasAreas.length === 0) return;
    const novo: Caderno = {
      id: `deck-${Date.now()}`, nome: novoNome.trim(), areas: novasAreas,
      criadoEm: new Date().toISOString(), cor: CORES[cadernos.length % CORES.length],
    };
    const updated = [...cadernos, novo];
    setCadernos(updated); saveCadernos(updated);
    setCriando(false); setNovoNome(""); setNovasAreas([]);
  };

  const handleExcluir = (id: string) => {
    const updated = cadernos.filter(c => c.id !== id);
    setCadernos(updated); saveCadernos(updated);
  };

  const toggleArea = (a: string) => setNovasAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  return (
    <div className="px-4 pb-6 space-y-4">
      <div className="flex items-center gap-2">
        <BookMarked className="w-5 h-5" style={{ color: "hsl(340 55% 50%)" }} />
        <h2 className="text-base font-bold text-foreground">Decks de Flashcards</h2>
      </div>

      <p className="text-xs text-muted-foreground">Monte decks personalizados selecionando áreas do Direito.</p>

      <div className="space-y-3">
        {cadernos.map((caderno, i) => (
          <motion.div key={caderno.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="relative overflow-hidden rounded-2xl p-4" style={{ background: caderno.cor, border: "1px solid hsl(0 0% 100% / 0.1)" }}>
            <Brain className="absolute -bottom-2 -right-2 text-white pointer-events-none" style={{ width: 64, height: 64, opacity: 0.12 }} />
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-white mb-1">{caderno.nome}</h3>
              <p className="text-[10px] text-white/70 mb-2">{caderno.areas.length} {caderno.areas.length === 1 ? "área" : "áreas"}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {caderno.areas.slice(0, 4).map(m => (
                  <span key={m} className="text-[9px] font-medium text-white px-2 py-0.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.2)" }}>{shortName(m)}</span>
                ))}
                {caderno.areas.length > 4 && <span className="text-[9px] text-white/60">+{caderno.areas.length - 4}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-colors" style={{ background: "hsl(0 0% 100% / 0.2)" }}>
                  <Play className="w-3.5 h-3.5" /> Estudar
                </button>
                <button onClick={() => handleExcluir(caderno.id)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors" style={{ background: "hsl(0 0% 100% / 0.1)" }}>
                  <Trash2 className="w-3.5 h-3.5 text-white/70" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!criando && (
        <button onClick={() => setCriando(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all" style={{ background: "linear-gradient(135deg, hsl(340 55% 50%), hsl(350 50% 38%))" }}>
          <Plus className="w-4 h-4" /> Criar Deck
        </button>
      )}

      <AnimatePresence>
        {criando && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="rounded-2xl p-4 space-y-4" style={{ background: "hsl(0 0% 16%)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <h3 className="text-sm font-bold text-foreground">Novo Deck</h3>
            <input type="text" placeholder="Nome do deck..." value={novoNome} onChange={e => setNovoNome(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" style={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 100% / 0.08)" }} />
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Áreas</p>
              <div className="flex flex-wrap gap-1.5">
                {AREAS_DISPONIVEIS.map(a => {
                  const sel = novasAreas.includes(a);
                  return (
                    <button key={a} onClick={() => toggleArea(a)} className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all"
                      style={{ background: sel ? "hsl(340 55% 50%)" : "hsl(0 0% 20%)", color: sel ? "white" : "hsl(0 0% 65%)", border: sel ? "1px solid hsl(340 45% 55%)" : "1px solid hsl(0 0% 100% / 0.06)" }}>
                      {shortName(a)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCriando(false)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground transition-colors" style={{ background: "hsl(0 0% 20%)" }}>Cancelar</button>
              <button onClick={handleCriar} disabled={!novoNome.trim() || novasAreas.length === 0}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40" style={{ background: "linear-gradient(135deg, hsl(340 55% 50%), hsl(350 50% 38%))" }}>Criar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
