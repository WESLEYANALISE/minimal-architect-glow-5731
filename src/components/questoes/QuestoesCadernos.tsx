import { useState, useEffect } from "react";
import { ArrowLeft, Plus, BookMarked, Play, Trash2, BookOpen, Scale, Gavel, Landmark, Shield, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Caderno {
  id: string;
  nome: string;
  materias: string[];
  tipos: string[];
  criadoEm: string;
  cor: string;
}

interface QuestoesCadernosProps {
  onBack: () => void;
}

const STORAGE_KEY = "questoes-cadernos";

const CORES_CADERNOS = [
  "linear-gradient(135deg, hsl(8 65% 48%), hsl(8 55% 38%))",
  "linear-gradient(135deg, hsl(152 60% 42%), hsl(160 55% 34%))",
  "linear-gradient(135deg, hsl(210 55% 45%), hsl(220 50% 38%))",
  "linear-gradient(135deg, hsl(265 65% 55%), hsl(280 60% 42%))",
  "linear-gradient(135deg, hsl(25 80% 50%), hsl(15 70% 40%))",
  "linear-gradient(135deg, hsl(340 65% 50%), hsl(350 55% 40%))",
];

const MATERIAS_DISPONIVEIS = [
  "Direito Constitucional",
  "Direito Administrativo",
  "Direito Penal",
  "Direito Processual Penal",
  "Direito Civil",
  "Direito Processual Civil",
  "Direito do Trabalho",
  "Direito Tributário",
  "Direito Empresarial",
  "Direitos Humanos",
  "Direito Ambiental",
  "Direito do Consumidor",
  "Direito Eleitoral",
  "Direito Previdenciário",
  "Direito Internacional",
];

const TIPOS_DISPONIVEIS = [
  { key: "alternativas", label: "Alternativas" },
  { key: "sim-nao", label: "Sim ou Não" },
  { key: "correspondencia", label: "Correspondência" },
];

const EXEMPLOS: Caderno[] = [
  {
    id: "exemplo-1",
    nome: "OAB Essencial",
    materias: ["Direito Constitucional", "Direito Civil", "Direito Penal"],
    tipos: ["alternativas"],
    criadoEm: new Date().toISOString(),
    cor: CORES_CADERNOS[0],
  },
  {
    id: "exemplo-2",
    nome: "Penal Intensivo",
    materias: ["Direito Penal", "Direito Processual Penal"],
    tipos: ["alternativas", "sim-nao"],
    criadoEm: new Date().toISOString(),
    cor: CORES_CADERNOS[2],
  },
  {
    id: "exemplo-3",
    nome: "Direitos Fundamentais",
    materias: ["Direito Constitucional", "Direitos Humanos"],
    tipos: ["alternativas", "sim-nao", "correspondencia"],
    criadoEm: new Date().toISOString(),
    cor: CORES_CADERNOS[3],
  },
];

const getCadernos = (): Caderno[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
};

const saveCadernos = (cadernos: Caderno[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cadernos));
};

const shortName = (area: string) =>
  area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, "").replace(/^Direitos\s+/i, "");

export const QuestoesCadernos = ({ onBack }: QuestoesCadernosProps) => {
  const [cadernos, setCadernos] = useState<Caderno[]>([]);
  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novasMaterias, setNovasMaterias] = useState<string[]>([]);
  const [novosTipos, setNovosTipos] = useState<string[]>(["alternativas"]);

  useEffect(() => {
    let loaded = getCadernos();
    if (loaded.length === 0) {
      loaded = EXEMPLOS;
      saveCadernos(loaded);
    }
    setCadernos(loaded);
  }, []);

  const handleCriar = () => {
    if (!novoNome.trim() || novasMaterias.length === 0 || novosTipos.length === 0) return;
    const novo: Caderno = {
      id: `caderno-${Date.now()}`,
      nome: novoNome.trim(),
      materias: novasMaterias,
      tipos: novosTipos,
      criadoEm: new Date().toISOString(),
      cor: CORES_CADERNOS[cadernos.length % CORES_CADERNOS.length],
    };
    const updated = [...cadernos, novo];
    setCadernos(updated);
    saveCadernos(updated);
    setCriando(false);
    setNovoNome("");
    setNovasMaterias([]);
    setNovosTipos(["alternativas"]);
  };

  const handleExcluir = (id: string) => {
    const updated = cadernos.filter((c) => c.id !== id);
    setCadernos(updated);
    saveCadernos(updated);
  };

  const toggleMateria = (m: string) => {
    setNovasMaterias((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const toggleTipo = (t: string) => {
    setNovosTipos((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <div className="px-4 pb-6 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Menu</span>
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked className="w-5 h-5" style={{ color: "hsl(265 65% 55%)" }} />
          <h2 className="text-base font-bold text-foreground">Cadernos de Questões</h2>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Monte cadernos personalizados selecionando matérias e tipos de questão.
      </p>

      {/* Lista de cadernos */}
      <div className="space-y-3">
        {cadernos.map((caderno, i) => (
          <motion.div
            key={caderno.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: caderno.cor,
              border: "1px solid hsl(0 0% 100% / 0.1)",
            }}
          >
            <BookMarked
              className="absolute -bottom-2 -right-2 text-white pointer-events-none"
              style={{ width: 64, height: 64, opacity: 0.12 }}
            />
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-white mb-1">{caderno.nome}</h3>
              <p className="text-[10px] text-white/70 mb-2">
                {caderno.materias.length} {caderno.materias.length === 1 ? "matéria" : "matérias"} •{" "}
                {caderno.tipos.map((t) => TIPOS_DISPONIVEIS.find((td) => td.key === t)?.label || t).join(", ")}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {caderno.materias.slice(0, 4).map((m) => (
                  <span
                    key={m}
                    className="text-[9px] font-medium text-white px-2 py-0.5 rounded-full"
                    style={{ background: "hsl(0 0% 100% / 0.2)" }}
                  >
                    {shortName(m)}
                  </span>
                ))}
                {caderno.materias.length > 4 && (
                  <span className="text-[9px] text-white/60">+{caderno.materias.length - 4}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-colors"
                  style={{ background: "hsl(0 0% 100% / 0.2)" }}
                >
                  <Play className="w-3.5 h-3.5" />
                  Iniciar
                </button>
                <button
                  onClick={() => handleExcluir(caderno.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: "hsl(0 0% 100% / 0.1)" }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-white/70" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Botão criar */}
      {!criando && (
        <button
          onClick={() => setCriando(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-primary-foreground transition-all"
          style={{
            background: "linear-gradient(135deg, hsl(265 65% 55%), hsl(280 60% 42%))",
          }}
        >
          <Plus className="w-4 h-4" />
          Criar Caderno
        </button>
      )}

      {/* Modal de criação */}
      <AnimatePresence>
        {criando && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-2xl p-4 space-y-4"
            style={{
              background: "hsl(0 0% 16%)",
              border: "1px solid hsl(0 0% 100% / 0.08)",
            }}
          >
            <h3 className="text-sm font-bold text-foreground">Novo Caderno</h3>

            {/* Nome */}
            <input
              type="text"
              placeholder="Nome do caderno..."
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{
                background: "hsl(0 0% 12%)",
                border: "1px solid hsl(0 0% 100% / 0.08)",
              }}
            />

            {/* Matérias */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Matérias</p>
              <div className="flex flex-wrap gap-1.5">
                {MATERIAS_DISPONIVEIS.map((m) => {
                  const sel = novasMaterias.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMateria(m)}
                      className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all"
                      style={{
                        background: sel ? "hsl(265 65% 55%)" : "hsl(0 0% 20%)",
                        color: sel ? "white" : "hsl(0 0% 65%)",
                        border: sel ? "1px solid hsl(265 50% 60%)" : "1px solid hsl(0 0% 100% / 0.06)",
                      }}
                    >
                      {shortName(m)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tipos */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Tipos de questão</p>
              <div className="flex flex-wrap gap-1.5">
                {TIPOS_DISPONIVEIS.map((t) => {
                  const sel = novosTipos.includes(t.key);
                  return (
                    <button
                      key={t.key}
                      onClick={() => toggleTipo(t.key)}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: sel ? "hsl(265 65% 55%)" : "hsl(0 0% 20%)",
                        color: sel ? "white" : "hsl(0 0% 65%)",
                        border: sel ? "1px solid hsl(265 50% 60%)" : "1px solid hsl(0 0% 100% / 0.06)",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <button
                onClick={() => setCriando(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground transition-colors"
                style={{ background: "hsl(0 0% 20%)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCriar}
                disabled={!novoNome.trim() || novasMaterias.length === 0}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, hsl(265 65% 55%), hsl(280 60% 42%))",
                }}
              >
                Criar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
