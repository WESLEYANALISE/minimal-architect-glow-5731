import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Search, BookOpen, Scale, ScrollText, Gavel } from "lucide-react";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { criarCondicoesBusca } from "@/lib/numeroExtenso";
import { useAuth } from "@/contexts/AuthContext";

const VadeMecumBusca = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { goBack } = useHierarchicalNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [searchInput, setSearchInput] = useState(query);

  const condicoesBusca = useMemo(() => criarCondicoesBusca(query), [query]);
  
  // Detectar se a query é número puro (ex: "56", "art 56", "artigo 56")
  const isNumeroPuro = useMemo(() => condicoesBusca.numeroArtigo !== null, [condicoesBusca]);

  // Buscar na Constituição
  const { data: constituicaoResults, isLoading: loadingConstituicao } = useQuery({
    queryKey: ["busca-constituicao", query],
    queryFn: async () => {
      if (!query) return [];
      
      const { numeroArtigo, variacoes } = condicoesBusca;
      
      // Busca por número de artigo: apenas por número exato + sufixos, SEM busca de texto livre
      if (numeroArtigo && variacoes.length > 0) {
        const promises = variacoes.map(variacao =>
          supabase
            .from("CF - Constituição Federal" as any)
            .select('id, "Número do Artigo", Artigo')
            .eq("Número do Artigo", variacao)
            .limit(100)
        );
        
        const results = await Promise.all(promises);
        const allData: any[] = [];
        
        results.forEach(({ data, error }) => {
          if (!error && data) {
            allData.push(...data);
          }
        });
        
        // Remover duplicatas pelo id
        const unique = Array.from(new Map(allData.map((item: any) => [item.id, item])).values());
        
        // Buscar artigos com sufixos (56-A, 56-B, etc) — com padrão exato para evitar falsos positivos
        const { data: suffixData } = await supabase
          .from("CF - Constituição Federal" as any)
          .select('id, "Número do Artigo", Artigo')
          .like("Número do Artigo", `${numeroArtigo}°-%`)
          .limit(100);
        
        if (suffixData) {
          (suffixData as any[]).forEach((item: any) => {
            if (!unique.some((u: any) => u.id === item.id)) {
              unique.push(item);
            }
          });
        }
        
        // Sufixos com º também
        const { data: suffixDataB } = await supabase
          .from("CF - Constituição Federal" as any)
          .select('id, "Número do Artigo", Artigo')
          .like("Número do Artigo", `${numeroArtigo}º-%`)
          .limit(100);
        
        if (suffixDataB) {
          (suffixDataB as any[]).forEach((item: any) => {
            if (!unique.some((u: any) => u.id === item.id)) {
              unique.push(item);
            }
          });
        }
        
        return unique.slice(0, 200);
      }
      
      // Busca por texto (não é número de artigo)
      const { data, error } = await supabase
        .from("CF - Constituição Federal" as any)
        .select('id, "Número do Artigo", Artigo')
        .ilike("Artigo", `%${query}%`)
        .limit(200);
      
      if (error) return [];
      return data || [];
    },
    enabled: !!query,
  });

  // Buscar em Códigos
  const { data: codigosResults, isLoading: loadingCodigos } = useQuery({
    queryKey: ["busca-codigos", query],
    queryFn: async () => {
      if (!query) return [];
      
      const { numeroArtigo, variacoes } = condicoesBusca;

      const tabelasCodigos = [
        { table: "CC - Código Civil", sigla: "CC" },
        { table: "CP - Código Penal", sigla: "CP" },
        { table: "CPC – Código de Processo Civil", sigla: "CPC" },
        { table: "CPP – Código de Processo Penal", sigla: "CPP" },
        { table: "CLT – Consolidação das Leis do Trabalho", sigla: "CLT" },
        { table: "CDC – Código de Defesa do Consumidor", sigla: "CDC" },
        { table: "CTN – Código Tributário Nacional", sigla: "CTN" },
        { table: "CTB Código de Trânsito Brasileiro", sigla: "CTB" },
        { table: "CE – Código Eleitoral", sigla: "CE" },
        { table: "CA - Código de Águas", sigla: "CA" },
        { table: "CBA Código Brasileiro de Aeronáutica", sigla: "CBA" },
        { table: "CBT Código Brasileiro de Telecomunicações", sigla: "CBT" },
        { table: "CCOM – Código Comercial", sigla: "CCOM" },
        { table: "CDM – Código de Minas", sigla: "CDM" }
      ];

      // Busca por número de artigo: apenas exato + sufixos
      if (numeroArtigo && variacoes.length > 0) {
        const promises = tabelasCodigos.flatMap(({ table, sigla }) =>
          variacoes.map(async (variacao) => {
            const { data, error } = await supabase
              .from(table as any)
              .select('id, "Número do Artigo", Artigo')
              .eq("Número do Artigo", variacao)
              .limit(20);
            
            if (error) return [];
            return (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }));
          })
        );

        // Buscar artigos com sufixos (56-A, 56-B, etc)
        const suffixPromises = tabelasCodigos.flatMap(({ table, sigla }) => [
          supabase
            .from(table as any)
            .select('id, "Número do Artigo", Artigo')
            .like("Número do Artigo", `${numeroArtigo}°-%`)
            .limit(20)
            .then(({ data }) => (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }))),
          supabase
            .from(table as any)
            .select('id, "Número do Artigo", Artigo')
            .like("Número do Artigo", `${numeroArtigo}º-%`)
            .limit(20)
            .then(({ data }) => (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }))),
        ]);

        const [mainResults, suffixResults] = await Promise.all([
          Promise.all(promises),
          Promise.all(suffixPromises)
        ]);

        const allResults = [...mainResults.flat(), ...suffixResults.flat()];
        
        // Remover duplicatas
        return Array.from(
          new Map(allResults.map(item => [`${item.tabela}-${item.id}`, item])).values()
        );
      }

      // Busca por texto
      const textPromises = tabelasCodigos.map(async ({ table, sigla }) => {
        const { data } = await supabase
          .from(table as any)
          .select('id, "Número do Artigo", Artigo')
          .ilike("Artigo", `%${query}%`)
          .limit(20);
        
        return (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }));
      });

      const textResults = await Promise.all(textPromises);
      const allResults = textResults.flat();
      
      return Array.from(
        new Map(allResults.map(item => [`${item.tabela}-${item.id}`, item])).values()
      );
    },
    enabled: !!query,
  });

  // Buscar em Estatutos
  const { data: estatutosResults, isLoading: loadingEstatutos } = useQuery({
    queryKey: ["busca-estatutos", query],
    queryFn: async () => {
      if (!query) return [];
      
      const { numeroArtigo, variacoes } = condicoesBusca;

      const tabelasEstatutos = [
        { table: "ESTATUTO - CIDADE", sigla: "Estatuto da Cidade" },
        { table: "ESTATUTO - DESARMAMENTO", sigla: "Estatuto do Desarmamento" },
        { table: "ESTATUTO - ECA", sigla: "ECA" },
        { table: "ESTATUTO - IDOSO", sigla: "Estatuto do Idoso" },
        { table: "ESTATUTO - IGUALDADE RACIAL", sigla: "Estatuto da Igualdade Racial" },
        { table: "ESTATUTO - OAB", sigla: "Estatuto da OAB" },
        { table: "ESTATUTO - PESSOA COM DEFICIÊNCIA", sigla: "Estatuto da Pessoa com Deficiência" },
        { table: "ESTATUTO - TORCEDOR", sigla: "Estatuto do Torcedor" }
      ];

      // Busca por número exato + sufixos
      if (numeroArtigo && variacoes.length > 0) {
        const promises = tabelasEstatutos.flatMap(({ table, sigla }) =>
          variacoes.map(async (variacao) => {
            const { data, error } = await supabase
              .from(table as any)
              .select('id, "Número do Artigo", Artigo')
              .eq("Número do Artigo", variacao)
              .limit(20);
            
            if (error) return [];
            return (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }));
          })
        );

        const suffixPromises = tabelasEstatutos.flatMap(({ table, sigla }) => [
          supabase
            .from(table as any)
            .select('id, "Número do Artigo", Artigo')
            .like("Número do Artigo", `${numeroArtigo}°-%`)
            .limit(20)
            .then(({ data }) => (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }))),
          supabase
            .from(table as any)
            .select('id, "Número do Artigo", Artigo')
            .like("Número do Artigo", `${numeroArtigo}º-%`)
            .limit(20)
            .then(({ data }) => (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }))),
        ]);

        const [mainResults, suffixResults] = await Promise.all([
          Promise.all(promises),
          Promise.all(suffixPromises)
        ]);

        const allResults = [...mainResults.flat(), ...suffixResults.flat()];
        
        return Array.from(
          new Map(allResults.map(item => [`${item.tabela}-${item.id}`, item])).values()
        );
      }

      // Busca por texto
      const textPromises = tabelasEstatutos.map(async ({ table, sigla }) => {
        const { data } = await supabase
          .from(table as any)
          .select('id, "Número do Artigo", Artigo')
          .ilike("Artigo", `%${query}%`)
          .limit(20);
        
        return (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }));
      });

      const textResults = await Promise.all(textPromises);
      const allResults = textResults.flat();
      
      return Array.from(
        new Map(allResults.map(item => [`${item.tabela}-${item.id}`, item])).values()
      );
    },
    enabled: !!query,
  });

  // Buscar em Súmulas
  const { data: sumulasResults, isLoading: loadingSumulas } = useQuery({
    queryKey: ["busca-sumulas", query],
    queryFn: async () => {
      if (!query) return [];
      
      const { numeroArtigo } = condicoesBusca;
      
      if (numeroArtigo && /^\d+$/.test(numeroArtigo)) {
        const numId = Number(numeroArtigo);
        
        const [sumulas, vinculantes] = await Promise.all([
          supabase
            .from("SUMULAS" as any)
            .select('id, "Título da Súmula", "Texto da Súmula"')
            .eq("id", numId)
            .limit(1)
            .then(({ data, error }) => {
              if (error) return [];
              return (data || []).map((item: any) => ({ ...item, tipo: "Súmula" }));
            }),
          supabase
            .from("SUMULAS VINCULANTES" as any)
            .select('id, "Título da Súmula", "Texto da Súmula"')
            .eq("id", numId)
            .limit(1)
            .then(({ data, error }) => {
              if (error) return [];
              return (data || []).map((item: any) => ({ ...item, tipo: "Súmula Vinculante" }));
            })
        ]);

        return [...sumulas, ...vinculantes];
      }
      
      return [];
    },
    enabled: !!query,
  });

  const isLoading = loadingConstituicao || loadingCodigos || loadingEstatutos || loadingSumulas;

  const totalResults = 
    (constituicaoResults?.length || 0) +
    (codigosResults?.length || 0) +
    (estatutosResults?.length || 0) +
    (sumulasResults?.length || 0);

  // Helpers
  const getCodigoRoute = (sigla: string) => {
    const routes: { [key: string]: string } = {
      "CC": "cc", "CP": "cp", "CPC": "cpc", "CPP": "cpp",
      "CLT": "clt", "CDC": "cdc", "CTN": "ctn", "CTB": "ctb",
      "CE": "ce", "CA": "ca", "CBA": "cba", "CBT": "cbt",
      "CCOM": "ccom", "CDM": "cdm"
    };
    return routes[sigla] || sigla.toLowerCase();
  };

  const getCodigoNomeCompleto = (sigla: string) => {
    const nomes: { [key: string]: string } = {
      "CC": "Código Civil", "CP": "Código Penal", "CPC": "Código de Processo Civil",
      "CPP": "Código de Processo Penal", "CLT": "Consolidação das Leis do Trabalho",
      "CDC": "Código de Defesa do Consumidor", "CTN": "Código Tributário Nacional",
      "CTB": "Código de Trânsito Brasileiro", "CE": "Código Eleitoral",
      "CA": "Código de Águas", "CBA": "Código Brasileiro de Aeronáutica",
      "CBT": "Código Brasileiro de Telecomunicações", "CCOM": "Código Comercial",
      "CDM": "Código de Minas"
    };
    return nomes[sigla] || sigla;
  };

  const getCodigoCor = (sigla: string) => {
    const cores: { [key: string]: string } = {
      "CC": "hsl(217,91%,60%)", "CP": "hsl(0,84%,60%)", "CPC": "hsl(174,72%,56%)",
      "CPP": "hsl(39,84%,56%)", "CLT": "hsl(271,76%,53%)", "CDC": "hsl(142,76%,36%)",
      "CTN": "hsl(48,89%,50%)", "CTB": "hsl(199,89%,48%)", "CE": "hsl(337,78%,56%)",
      "CA": "hsl(188,94%,43%)", "CBA": "hsl(221,83%,53%)", "CBT": "hsl(280,61%,50%)",
      "CCOM": "hsl(24,74%,50%)", "CDM": "hsl(16,82%,47%)"
    };
    return cores[sigla] || "hsl(217,91%,60%)";
  };

  const getEstatutoRoute = (tabela: string) => {
    const routes: { [key: string]: string } = {
      "ESTATUTO - CIDADE": "cidade", "ESTATUTO - DESARMAMENTO": "desarmamento",
      "ESTATUTO - ECA": "eca", "ESTATUTO - IDOSO": "idoso",
      "ESTATUTO - IGUALDADE RACIAL": "igualdade-racial", "ESTATUTO - OAB": "oab",
      "ESTATUTO - PESSOA COM DEFICIÊNCIA": "pessoa-deficiencia", "ESTATUTO - TORCEDOR": "torcedor"
    };
    return routes[tabela] || "";
  };

  const registrarBusca = async (termo: string) => {
    if (!user || !termo.trim()) return;
    await supabase
      .from("busca_leis_historico" as any)
      .insert({ user_id: user.id, termo: termo.trim() } as any);
  };

  const handleSearchWithHistory = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchInput.trim()) {
      registrarBusca(searchInput.trim());
      setSearchParams({ q: searchInput.trim() });
    }
  };

  // Buscar histórico
  const { data: maisBuscados } = useQuery({
    queryKey: ["busca-leis-historico", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("busca_leis_historico" as any)
        .select("termo")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error || !data) return [];
      const freq: Record<string, number> = {};
      (data as any[]).forEach((item: any) => {
        const t = item.termo?.toLowerCase?.() || "";
        if (t) freq[t] = (freq[t] || 0) + 1;
      });
      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([termo, count]) => ({ termo, count }));
    },
    enabled: !!user,
  });

  // Buscar favoritos
  const { data: favoritos } = useQuery({
    queryKey: ["artigos-favoritos-busca", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("artigos_favoritos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });

  // Tela de busca vazia
  if (!query) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-8 max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/15 flex items-center justify-center">
              <Search className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Busca Rápida de Leis</h2>
            <p className="text-sm text-muted-foreground">
              Digite o número do artigo ou palavras-chave para buscar em toda a legislação
            </p>
          </div>
          
          <form onSubmit={handleSearchWithHistory} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ex: artigo 5, homicídio, prescrição..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 text-base"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!searchInput.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold disabled:opacity-50 transition-all hover:shadow-lg"
            >
              Procurar
            </button>
          </form>

          {maisBuscados && maisBuscados.length > 0 && (
            <div className="mt-8 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">🔥 Mais Buscados</p>
              <div className="flex flex-wrap gap-2">
                {maisBuscados.map(({ termo, count }) => (
                  <button
                    key={termo}
                    onClick={() => { setSearchInput(termo); registrarBusca(termo); setSearchParams({ q: termo }); }}
                    className="px-3 py-1.5 rounded-full bg-muted/50 text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center gap-1.5"
                  >
                    {termo}
                    <span className="text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {favoritos && favoritos.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">⭐ Favoritos</p>
              <div className="space-y-1.5">
                {favoritos.slice(0, 8).map((fav: any) => (
                  <button
                    key={fav.id}
                    onClick={() => { setSearchInput(fav.numero_artigo); registrarBusca(fav.numero_artigo); setSearchParams({ q: fav.numero_artigo }); }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-muted/30 hover:bg-red-500/10 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{fav.numero_artigo}</span>
                    <span className="text-xs text-muted-foreground ml-2">({fav.tabela_codigo})</span>
                    {fav.conteudo_preview && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{fav.conteudo_preview}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(!maisBuscados || maisBuscados.length === 0) && (
            <div className="mt-8 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sugestões</p>
              <div className="flex flex-wrap gap-2">
                {["Art. 5", "Art. 121", "Art. 155", "Furto", "Homicídio", "Prescrição"].map(s => (
                  <button
                    key={s}
                    onClick={() => { setSearchInput(s); registrarBusca(s); setSearchParams({ q: s }); }}
                    className="px-3 py-1.5 rounded-full bg-muted/50 text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Seções de resultado (só as que têm conteúdo)
  const secoes = [
    {
      id: "constituicao",
      titulo: "Constituição Federal",
      icone: <BookOpen className="w-4 h-4" />,
      cor: "hsl(170,100%,42%)",
      corBg: "hsl(170,100%,42%,0.08)",
      isLoading: loadingConstituicao,
      items: constituicaoResults || [],
      renderItem: (item: any) => (
        <Card
          key={item.id}
          className="hover:shadow-md transition-all cursor-pointer border border-border/50 hover:border-[hsl(170,100%,42%)]/30"
          onClick={() => navigate(`/constituicao?artigo=${item["Número do Artigo"]}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-base" style={{ color: "hsl(170,100%,42%)" }}>
                Art. {item["Número do Artigo"]}
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "hsl(170,100%,42%,0.12)", color: "hsl(170,100%,42%)" }}>
                CF
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed line-clamp-3">
              {item.Artigo}
            </p>
          </CardContent>
        </Card>
      )
    },
    {
      id: "codigos",
      titulo: "Códigos e Leis",
      icone: <Scale className="w-4 h-4" />,
      cor: "hsl(39,84%,56%)",
      corBg: "hsl(39,84%,56%,0.08)",
      isLoading: loadingCodigos,
      items: codigosResults || [],
      renderItem: (item: any) => {
        const cor = getCodigoCor(item.fonte);
        return (
          <Card
            key={`${item.tabela}-${item.id}`}
            className="hover:shadow-md transition-all cursor-pointer border border-border/50"
            style={{ ['--hover-color' as any]: cor }}
            onClick={() => navigate(`/codigo/${getCodigoRoute(item.fonte)}?artigo=${item["Número do Artigo"]}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium mb-0.5 uppercase tracking-wide" style={{ color: cor }}>
                    {getCodigoNomeCompleto(item.fonte)}
                  </p>
                  <h3 className="font-bold text-base" style={{ color: cor }}>
                    Art. {item["Número do Artigo"]}
                  </h3>
                </div>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                  style={{ backgroundColor: `${cor}18`, color: cor }}
                >
                  {item.fonte}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                {item.Artigo}
              </p>
            </CardContent>
          </Card>
        );
      }
    },
    {
      id: "estatutos",
      titulo: "Estatutos",
      icone: <ScrollText className="w-4 h-4" />,
      cor: "hsl(239,84%,67%)",
      corBg: "hsl(239,84%,67%,0.08)",
      isLoading: loadingEstatutos,
      items: estatutosResults || [],
      renderItem: (item: any) => (
        <Card
          key={`${item.tabela}-${item.id}`}
          className="hover:shadow-md transition-all cursor-pointer border border-border/50 hover:border-[hsl(239,84%,67%)]/30"
          onClick={() => navigate(`/estatuto/${getEstatutoRoute(item.tabela)}?artigo=${item["Número do Artigo"]}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium mb-0.5 uppercase tracking-wide" style={{ color: "hsl(239,84%,67%)" }}>
                  {item.fonte}
                </p>
                <h3 className="font-bold text-base" style={{ color: "hsl(239,84%,67%)" }}>
                  Art. {item["Número do Artigo"]}
                </h3>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ backgroundColor: "hsl(239,84%,67%,0.12)", color: "hsl(239,84%,67%)" }}>
                EST
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed line-clamp-3">
              {item.Artigo}
            </p>
          </CardContent>
        </Card>
      )
    },
    {
      id: "sumulas",
      titulo: "Súmulas",
      icone: <Gavel className="w-4 h-4" />,
      cor: "hsl(174,72%,56%)",
      corBg: "hsl(174,72%,56%,0.08)",
      isLoading: loadingSumulas,
      items: sumulasResults || [],
      renderItem: (item: any) => (
        <Card
          key={`${item.tipo}-${item.id}`}
          className="hover:shadow-md transition-all cursor-pointer border border-border/50 hover:border-[hsl(174,72%,56%)]/30"
          onClick={() => navigate(`/sumula/${item.tipo === "Súmula Vinculante" ? "vinculantes" : "sumulas"}?numero=${item.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-base" style={{ color: "hsl(174,72%,56%)" }}>
                Súmula {item.id}
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "hsl(174,72%,56%,0.12)", color: "hsl(174,72%,56%)" }}>
                {item.tipo}
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed line-clamp-3">
              {item["Texto da Súmula"]}
            </p>
          </CardContent>
        </Card>
      )
    }
  ];

  // Filtrar seções com resultados (ou loading)
  const secoesVisiveis = secoes.filter(s => s.isLoading || s.items.length > 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30 px-4 py-3">
        <form onSubmit={handleSearchWithHistory} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar artigo ou termo..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Buscar
          </button>
        </form>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Resumo da busca */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {totalResults > 0
              ? <><span className="font-medium text-foreground">{totalResults}</span> resultado{totalResults !== 1 ? "s" : ""} para "{query}"</>
              : <>Nenhum resultado encontrado para "<span className="font-medium text-foreground">{query}</span>"</>
            }
          </p>
        )}

        {/* Loading global */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Buscando em toda a legislação...</p>
          </div>
        )}

        {/* Seções agrupadas */}
        {!isLoading && secoesVisiveis.length > 0 && secoesVisiveis.map(secao => (
          <div key={secao.id} className="space-y-3">
            {/* Cabeçalho da seção */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ backgroundColor: `${secao.cor}12` }}
            >
              <div className="flex items-center gap-2" style={{ color: secao.cor }}>
                {secao.icone}
                <span className="font-semibold text-sm uppercase tracking-wide">{secao.titulo}</span>
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${secao.cor}20`, color: secao.cor }}
              >
                {secao.items.length} {secao.items.length === 1 ? "artigo" : "artigos"}
              </span>
            </div>

            {/* Cards da seção */}
            <div className="space-y-3 pl-0">
              {secao.items.map(item => secao.renderItem(item))}
            </div>
          </div>
        ))}

        {/* Nenhum resultado */}
        {!isLoading && totalResults === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-2">Nenhum resultado</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Tente buscar por outro número de artigo ou palavra-chave diferente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VadeMecumBusca;
