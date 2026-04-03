import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Users, TrendingUp, Loader2, X, ChevronRight, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useDeputadosFavoritos } from "@/hooks/useDeputadoFavorito";

interface Deputado {
  id: number;
  nome: string;
  sigla_partido: string | null;
  sigla_uf: string | null;
  url_foto: string | null;
  email: string | null;
}

const EM_ALTA_SEED = [
  { nome: "Nikolas Ferreira", partido: "PL", uf: "MG" },
  { nome: "Guilherme Boulos", partido: "PSOL", uf: "SP" },
  { nome: "Erika Hilton", partido: "PSOL", uf: "SP" },
  { nome: "Kim Kataguiri", partido: "UNIÃO", uf: "SP" },
];

const LegislativoCamaraDeputados = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "em-alta" ? "em-alta" : searchParams.get("tab") === "favoritos" ? "favoritos" : "todos";
  const { user } = useAuth();

  const [deputados, setDeputados] = useState<Deputado[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [emAltaIds, setEmAltaIds] = useState<number[]>([]);

  const { data: favoritos, isLoading: loadingFavoritos } = useDeputadosFavoritos();

  useEffect(() => {
    fetchDeputados();
    fetchEmAlta();
  }, []);

  const fetchDeputados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("deputados_cache")
        .select("id, nome, sigla_partido, sigla_uf, url_foto, email")
        .order("nome");

      if (!error && data && data.length > 0) {
        setDeputados(data as any[]);
        return;
      }

      console.log("Cache vazio, buscando via edge function...");
      const { data: apiData, error: fnError } = await supabase.functions.invoke("buscar-deputados", { body: {} });
      if (fnError) throw fnError;

      const deps = (apiData?.deputados || []).map((dep: any) => ({
        id: dep.id, nome: dep.nome, sigla_partido: dep.siglaPartido,
        sigla_uf: dep.siglaUf, url_foto: dep.urlFoto, email: dep.email,
      }));
      setDeputados(deps);

      const registros = (apiData?.deputados || []).map((dep: any) => ({
        id: dep.id, nome: dep.nome, sigla_partido: dep.siglaPartido,
        sigla_uf: dep.siglaUf, url_foto: dep.urlFoto, email: dep.email,
        uri: dep.uri, legislatura: dep.idLegislatura, updated_at: new Date().toISOString(),
      }));
      supabase.from("deputados_cache").upsert(registros, { onConflict: "id" }).then(({ error: e }) => {
        if (e) console.error("Erro cache:", e);
      });
    } catch (e) {
      console.error("Erro ao buscar deputados:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmAlta = async () => {
    try {
      const { data } = await supabase
        .from("deputados_ranking")
        .select("deputado_id, acessos")
        .eq("periodo", "semanal")
        .order("acessos", { ascending: false })
        .limit(20);
      if (data && data.length > 0) setEmAltaIds((data as any[]).map((d: any) => d.deputado_id));
    } catch {}
  };

  const registrarAcesso = async (deputadoId: number) => {
    try {
      const { data: existing } = await supabase
        .from("deputados_ranking").select("id, acessos")
        .eq("deputado_id", deputadoId).eq("periodo", "semanal").maybeSingle();
      if (existing) {
        await supabase.from("deputados_ranking")
          .update({ acessos: (existing as any).acessos + 1, updated_at: new Date().toISOString() })
          .eq("id", (existing as any).id);
      } else {
        await supabase.from("deputados_ranking")
          .insert({ deputado_id: deputadoId, acessos: 1, periodo: "semanal" } as any);
      }
    } catch {}
  };

  const filtrados = useMemo(() => {
    if (!busca.trim()) return deputados;
    const term = busca.toLowerCase();
    return deputados.filter((d) =>
      d.nome.toLowerCase().includes(term) ||
      d.sigla_partido?.toLowerCase().includes(term) ||
      d.sigla_uf?.toLowerCase().includes(term)
    );
  }, [deputados, busca]);

  const deputadosEmAlta = useMemo(() => {
    if (emAltaIds.length > 0) {
      return emAltaIds.map((id) => deputados.find((d) => d.id === id)).filter(Boolean) as Deputado[];
    }
    return EM_ALTA_SEED.map((seed) =>
      deputados.find((d) => d.nome.toLowerCase().includes(seed.nome.toLowerCase()))
    ).filter(Boolean) as Deputado[];
  }, [deputados, emAltaIds]);

  const handleDeputadoClick = (dep: Deputado) => {
    registrarAcesso(dep.id);
    navigate(`/camara-deputados/deputado/${dep.id}`);
  };

  const DeputadoCard = ({ dep, index }: { dep: Deputado; index: number }) => (
    <button
      onClick={() => handleDeputadoClick(dep)}
      className="w-full flex items-center gap-3 bg-card border border-border/40 rounded-xl p-3 text-left hover:border-primary/40 transition-all active:scale-[0.98] group animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.5)}s`, animationFillMode: "backwards" }}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-border/50">
        {dep.url_foto ? (
          <img src={dep.url_foto} alt={dep.nome} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
            <Users className="w-5 h-5 text-white/40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {dep.nome}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          {dep.sigla_partido && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{dep.sigla_partido}</Badge>
          )}
          {dep.sigla_uf && (
            <span className="text-[10px] text-muted-foreground">{dep.sigla_uf}</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary flex-shrink-0 transition-colors" />
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button onClick={() => navigate('/legislativo/camara')} className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Deputados Federais</h1>
            <p className="text-[11px] text-muted-foreground">
              {loading ? "Carregando..." : `${deputados.length} deputados em exercício`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Busca */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar deputado, partido ou estado..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 bg-card border-border/50"
            />
            {busca && (
              <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="px-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="todos" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="em-alta" className="gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              Em Alta
            </TabsTrigger>
            <TabsTrigger value="favoritos" className="gap-1.5 text-xs">
              <Heart className="w-3.5 h-3.5" />
              Favoritos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="space-y-2 pb-24">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filtrados.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {busca ? "Nenhum deputado encontrado" : "Deputados ainda não sincronizados"}
                </p>
              </div>
            ) : (
              filtrados.map((dep, i) => <DeputadoCard key={dep.id} dep={dep} index={i} />)
            )}
          </TabsContent>

          <TabsContent value="em-alta" className="space-y-2 pb-24">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : deputadosEmAlta.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Ainda sem dados de tendências</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Deputados mais pesquisados e acessados pelos usuários
                </p>
                {deputadosEmAlta.map((dep, i) => (
                  <div key={dep.id} className="relative">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-10">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center">
                        {i + 1}
                      </span>
                    </div>
                    <div className="ml-4">
                      <DeputadoCard dep={dep} index={i} />
                    </div>
                  </div>
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="favoritos" className="space-y-2 pb-24">
            {!user ? (
              <div className="text-center py-12">
                <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Faça login para ver seus favoritos</p>
              </div>
            ) : loadingFavoritos ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !favoritos || favoritos.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum deputado favoritado</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Toque no ❤️ na página do deputado para salvar</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  {favoritos.length} deputado{favoritos.length > 1 ? 's' : ''} favoritado{favoritos.length > 1 ? 's' : ''}
                </p>
                {favoritos.map((fav: any, i: number) => {
                  const dep: Deputado = {
                    id: fav.deputado_id,
                    nome: fav.deputado_nome || 'Deputado',
                    sigla_partido: fav.deputado_partido,
                    sigla_uf: fav.deputado_uf,
                    url_foto: fav.deputado_foto,
                    email: null,
                  };
                  return <DeputadoCard key={fav.id} dep={dep} index={i} />;
                })}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LegislativoCamaraDeputados;
