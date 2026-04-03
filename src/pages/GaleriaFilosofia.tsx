import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FILOSOFOS, CATEGORIAS_FILOSOFIA } from "@/lib/filosofia-config";
import { FilosofoCard } from "@/components/filosofia/FilosofoCard";
import { GraduationCap, Search } from "lucide-react";


const ADMIN_EMAIL = "wn7corporation@gmail.com";

const GaleriaFilosofia = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin]);

  const filosofosFiltrados = FILOSOFOS.filter((f) => {
    const matchCategoria = !categoriaAtiva || f.categorias.includes(categoriaAtiva);
    const matchBusca = !busca || f.nome.toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="bg-amber-900/20 rounded-2xl p-3 shadow-lg ring-1 ring-amber-800/30">
            <GraduationCap className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Galeria de Filosofia
            </h1>
            <p className="text-muted-foreground text-sm">Grandes pensadores da humanidade</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar filósofo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/70 border border-white/5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setCategoriaAtiva(null)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
              !categoriaAtiva
                ? "bg-amber-500 text-black font-semibold"
                : "bg-neutral-800/70 text-muted-foreground hover:bg-neutral-700/80"
            }`}
          >
            Todos
          </button>
          {CATEGORIAS_FILOSOFIA.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(categoriaAtiva === cat ? null : cat)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
                categoriaAtiva === cat
                  ? "bg-amber-500 text-black font-semibold"
                  : "bg-neutral-800/70 text-muted-foreground hover:bg-neutral-700/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filosofosFiltrados.map((filosofo, index) => (
            <FilosofoCard key={filosofo.slug} filosofo={filosofo} index={index} />
          ))}
        </div>

        {filosofosFiltrados.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum filósofo encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default GaleriaFilosofia;
