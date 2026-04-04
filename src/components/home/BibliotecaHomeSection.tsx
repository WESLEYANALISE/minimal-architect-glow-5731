import { useState, useEffect, useMemo, lazy, Suspense, useRef } from "react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { Search as SearchIcon, BookMarked, Star, Compass, X, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BibliotecaBottomNav, type BibliotecaBottomTab } from "@/components/biblioteca/BibliotecaBottomNav";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useDeviceType } from "@/hooks/use-device-type";

const PlanoLeituraInline = lazy(() => import("@/components/biblioteca/PlanoLeituraInline").then(m => ({ default: m.PlanoLeituraInline })));
const FavoritosInline = lazy(() => import("@/components/biblioteca/FavoritosInline").then(m => ({ default: m.FavoritosInline })));
import { BibliotecaSection, type BibliotecaSectionBook } from "@/components/biblioteca/BibliotecaSection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";

import { ORDEM_LEITURA_CLASSICOS } from "@/components/biblioteca/BibliotecaSortToggle";
import bibliotecaCoverHeader from "@/assets/biblioteca-cover-header.webp";
import capaLideranca from "@/assets/capa-lideranca.webp";
import capaForaDaToga from "@/assets/capa-fora-da-toga.webp";
import capaEstudos from "@/assets/sala-aula-direito.webp";
import capaClassicos from "@/assets/capa-classicos.webp";
import capaOratoria from "@/assets/capa-oratoria.webp";
import capaPesquisaCientifica from "@/assets/capa-pesquisa-cientifica.webp";
import capaPortugues from "@/assets/capa-portugues.webp";
import capaOab from "@/assets/capa-biblioteca-oab.webp";
import capaPolitica from "@/assets/politico-esquerda.webp";
import capaRedacao from "@/assets/capa-redacao-concursos.webp";
import capaColocacao from "@/assets/capa-colocacao-pronominal.webp";
import capaRegencia from "@/assets/capa-regencia-verbal.webp";
import capaOracoes from "@/assets/capa-oracoes-coordenadas.webp";
import capaSemantica from "@/assets/capa-semantica.webp";
import capaInterpretacao from "@/assets/capa-interpretacao-textos.webp";
import capaDireitoPenal from "@/assets/capa-direito-penal.webp";
import capaOabAreas from "@/assets/capa-oab-areas.webp";

const PORTUGUES_FALLBACK_COVERS: Record<string, string> = {
  "Redação para concursos": capaRedacao,
  "Colocação pronominal": capaColocacao,
  "Regência verbal e nominal": capaRegencia,
  "Orações coordenadas e subordinadas": capaOracoes,
  "Semântica": capaSemantica,
  "Interpretação de textos": capaInterpretacao,
};

interface BibliotecaConfig {
  key: string;
  title: string;
  subtitle?: string;
  table: string;
  titleCol: string;
  capaCol: string;
  localCapa: string;
  route: string;
  livroRoute: string;
}

const bibliotecas: BibliotecaConfig[] = [
  { key: "classicos", title: "Clássicos", subtitle: "Obras fundamentais da literatura jurídica", table: "BIBLIOTECA-CLASSICOS", titleCol: "livro", capaCol: "imagem", localCapa: capaClassicos, route: "/biblioteca-classicos", livroRoute: "/biblioteca-classicos" },
  { key: "estudos", title: "Estudos", subtitle: "Matérias e disciplinas do Direito", table: "BIBLIOTECA-ESTUDOS", titleCol: "Tema", capaCol: "Capa-livro", localCapa: capaEstudos, route: "/biblioteca-estudos", livroRoute: "/biblioteca-estudos" },
  { key: "oratoria", title: "Oratória", subtitle: "A arte de falar em público", table: "BIBLIOTECA-ORATORIA", titleCol: "livro", capaCol: "imagem", localCapa: capaOratoria, route: "/biblioteca-oratoria", livroRoute: "/biblioteca-oratoria" },
  { key: "oab", title: "OAB", subtitle: "Preparação para o Exame da Ordem", table: "BIBILIOTECA-OAB", titleCol: "Tema", capaCol: "Capa-livro", localCapa: capaOab, route: "/biblioteca-oab", livroRoute: "/biblioteca-oab" },
  { key: "politica", title: "Política", subtitle: "Literatura política e ciência de governo", table: "BIBLIOTECA-POLITICA", titleCol: "livro", capaCol: "imagem", localCapa: capaPolitica, route: "/biblioteca-politica", livroRoute: "/politica/livro" },
  { key: "lideranca", title: "Liderança", subtitle: "Gestão, liderança e desenvolvimento pessoal", table: "BIBLIOTECA-LIDERANÇA", titleCol: "livro", capaCol: "imagem", localCapa: capaLideranca, route: "/biblioteca-lideranca", livroRoute: "/biblioteca-lideranca" },
  { key: "fora", title: "Fora da Toga", subtitle: "Leituras além do universo jurídico", table: "BIBLIOTECA-FORA-DA-TOGA", titleCol: "livro", capaCol: "capa-livro", localCapa: capaForaDaToga, route: "/biblioteca-fora-da-toga", livroRoute: "/biblioteca-fora-da-toga" },
  { key: "portugues", title: "Português", subtitle: "Gramática e redação para concursos", table: "BIBLIOTECA-PORTUGUES", titleCol: "livro", capaCol: "imagem", localCapa: capaPortugues, route: "/biblioteca-portugues", livroRoute: "/biblioteca-portugues" },
  { key: "pesquisa", title: "Pesquisa Científica", subtitle: "Metodologia e produção acadêmica", table: "BIBLIOTECA-PESQUISA-CIENTIFICA", titleCol: "livro", capaCol: "imagem", localCapa: capaPesquisaCientifica, route: "/biblioteca-pesquisa-cientifica", livroRoute: "/biblioteca-pesquisa-cientifica" },
];

interface BibliotecaHomeSectionProps {
  navigate?: (path: string, options?: any) => void;
}

export const BibliotecaHomeSection = ({ navigate: navigateProp }: BibliotecaHomeSectionProps = {}) => {
  const routerNavigate = useTransitionNavigate();
  const navigate = navigateProp || routerNavigate;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<BibliotecaBottomTab | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isDesktop } = useDeviceType();
  const { isPremium } = useSubscription();

  const { data: contagens } = useQuery({
    queryKey: ["contagens-bibliotecas"],
    queryFn: async () => {
      const results = await Promise.all(
        bibliotecas.map((b) =>
          (supabase as any).from(b.table).select("*", { count: "exact", head: true })
        )
      );
      const map: Record<string, number> = {};
      bibliotecas.forEach((b, i) => {
        map[b.key] = results[i].count || 0;
      });
      return map;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  // Query que busca livros individuais por área (para o filtro de área no carrossel)
  const { data: areaLivrosMap, isLoading: areaLivrosLoading } = useQuery({
    queryKey: ["livros-por-area-bibliotecas"],
    queryFn: async () => {
      const [estudosRes, oabRes] = await Promise.all([
        (supabase as any).from("BIBLIOTECA-ESTUDOS").select('id, "Área", "Tema", "Capa-livro", url_capa_gerada, "Ordem"').order("Ordem"),
        (supabase as any).from("BIBILIOTECA-OAB").select('id, "Área", "Tema", "Capa-livro", "Ordem"').order("Ordem"),
      ]);
      const estudosByArea: Record<string, BibliotecaSectionBook[]> = {};
      for (const row of (estudosRes.data || [])) {
        const area = row["Área"]; if (!area) continue;
        if (!estudosByArea[area]) estudosByArea[area] = [];
        const capa = row["url_capa_gerada"] || row["Capa-livro"] || (area === "Direito Penal" ? capaDireitoPenal : null);
        estudosByArea[area].push({ id: row.id, titulo: row["Tema"] || "Sem título", capa });
      }
      const oabByArea: Record<string, BibliotecaSectionBook[]> = {};
      for (const row of (oabRes.data || [])) {
        const area = row["Área"]; if (!area) continue;
        if (!oabByArea[area]) oabByArea[area] = [];
        const capa = row["Capa-livro"] || (area === "Direito Penal" ? capaDireitoPenal : capaOabAreas);
        oabByArea[area].push({ id: row.id, titulo: row["Tema"] || "Sem título", capa });
      }
      return { estudos: estudosByArea, oab: oabByArea };
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const { data: livrosMap, isLoading: livrosLoading } = useQuery({
    queryKey: ["livros-preview-bibliotecas"],
    queryFn: async () => {
      const estudosPromise = (supabase as any)
        .from("BIBLIOTECA-ESTUDOS")
        .select("id, Área, Capa-area")
        .not("Área", "is", null)
        .order("id");

      const oabPromise = (supabase as any)
        .from("BIBILIOTECA-OAB")
        .select("id, Área, Capa-area")
        .not("Área", "is", null)
        .order("id");

      const otherResults = await Promise.all([
        estudosPromise,
        oabPromise,
        ...bibliotecas
          .filter((b) => b.key !== "estudos" && b.key !== "oab")
          .map((b) =>
            (supabase as any)
              .from(b.table)
              .select(`id, ${b.titleCol}, ${b.capaCol}${b.key === "classicos" ? ", autor, url_videoaula, sobre" : ""}`)
              .order("id")
              .limit(b.key === "classicos" ? 30 : 12)
          ),
      ]);

      const map: Record<string, BibliotecaSectionBook[]> = {};

      const estudosData = otherResults[0].data || [];
      const seenAreas = new Set<string>();
      const estudosBooks: BibliotecaSectionBook[] = [];
      for (const row of estudosData) {
        const area = row["Área"];
        if (area && !seenAreas.has(area)) {
          seenAreas.add(area);
          estudosBooks.push({ id: row.id, titulo: area, capa: row["Capa-area"] || null });
        }
      }
      map["estudos"] = estudosBooks;

      const oabData = otherResults[1].data || [];
      const seenOabAreas = new Set<string>();
      const oabBooks: BibliotecaSectionBook[] = [];
      for (const row of oabData) {
        const area = row["Área"];
        if (area && !seenOabAreas.has(area)) {
          seenOabAreas.add(area);
          oabBooks.push({ id: row.id, titulo: area, capa: row["Capa-area"] || null });
        }
      }
      map["oab"] = oabBooks;

      const otherBibliotecas = bibliotecas.filter((b) => b.key !== "estudos" && b.key !== "oab");
      otherBibliotecas.forEach((b, i) => {
        const data = otherResults[i + 2].data || [];
        let books = data.map((row: any) => {
          const titulo = row[b.titleCol] || "Sem título";
          let capa = row[b.capaCol] || null;
          if (!capa && b.key === "portugues") {
            capa = PORTUGUES_FALLBACK_COVERS[titulo] || null;
          }
          return { 
            id: row.id, 
            titulo, 
            capa,
            autor: row.autor || undefined,
            sobre: row.sobre || undefined,
            urlVideoaula: row.url_videoaula || undefined,
          };
        });
        if (b.key === "classicos") {
          books.sort((a: BibliotecaSectionBook, b: BibliotecaSectionBook) => {
            const orderA = ORDEM_LEITURA_CLASSICOS[a.id] ?? 999;
            const orderB = ORDEM_LEITURA_CLASSICOS[b.id] ?? 999;
            return orderA - orderB;
          });
        }
        map[b.key] = books;
      });
      return map;
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
  });


  // Prefetch all book cover images in background
  useEffect(() => {
    if (!livrosMap) return;
    Object.values(livrosMap).flat().forEach((book) => {
      if (book.capa) {
        const img = new Image();
        img.src = book.capa;
      }
    });
  }, [livrosMap]);

  // Limites de livros gratuitos por biblioteca
  const FREE_LIMITS: Record<string, number> = {
    estudos: 2, classicos: 2, oab: 2, oratoria: 2,
    politica: 2, portugues: 2, lideranca: 2, fora: 2, pesquisa: 0,
  };

  // Calcula minWidth compartilhado entre Estudos e OAB (pega o label mais longo das duas seções)
  const abreviarArea = (area: string) =>
    area.replace("Direito ", "").replace(" do Trabalho", " Trab.").replace("Processual ", "Proc. ");

  const sharedAreaTabMinWidth = (() => {
    const calcMin = (areas: string[]) => {
      if (!areas.length) return 999;
      const longest = areas.reduce((acc, area) => {
        const label = abreviarArea(area);
        return label.length > acc.length ? label : acc;
      }, "");
      return longest.length * 5 + 12;
    };
    const estudosMin = calcMin(Object.keys(areaLivrosMap?.estudos || {}));
    const oabMin = calcMin(Object.keys(areaLivrosMap?.oab || {}));
    const result = Math.min(estudosMin, oabMin);
    return result === 999 ? undefined : result;
  })();

  // Filter both by library title AND by book titles within each library
  const filteredBibliotecas = bibliotecas.map((b) => {
    if (!searchQuery.trim()) return b;
    const query = searchQuery.toLowerCase();
    // If library title matches, show all books
    if (b.title.toLowerCase().includes(query)) return b;
    // Otherwise check if any book title matches
    const books = livrosMap?.[b.key] || [];
    const hasMatch = books.some((book) => book.titulo.toLowerCase().includes(query));
    return hasMatch ? b : null;
  }).filter(Boolean) as BibliotecaConfig[];

  // Filter books within each section when searching
  const getFilteredBooks = (key: string) => {
    const books = livrosMap?.[key] || [];
    if (!searchQuery.trim()) return books;
    const query = searchQuery.toLowerCase();
    const lib = bibliotecas.find(b => b.key === key);
    if (lib && lib.title.toLowerCase().includes(query)) return books;
    return books.filter((book) => book.titulo.toLowerCase().includes(query));
  };

  return (
    <div className="space-y-4">

      {/* Bottom Nav */}
      <BibliotecaBottomNav
        activeTab={activeTab as BibliotecaBottomTab}
        onTabChange={(tab) => {
          if (tab === 'buscar') {
            setSearchOpen(true);
            return;
          }
          if (tab === 'livrodia') {
            navigate('/dica-do-dia');
            return;
          }
          if (tab === null) {
            setActiveTab(null);
            return;
          }
          setActiveTab(prev => prev === tab ? null : tab);
        }}
      />

      {/* Search — Dialog on desktop, Drawer on mobile */}
      {isDesktop ? (
        <Dialog open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) setSearchQuery(""); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" hideCloseButton>
            <div className="px-2 pt-2 pb-2">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar livro, autor ou biblioteca..."
                  className="pl-12 pr-10 h-12 text-base bg-secondary/50 border-border rounded-xl"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors cursor-pointer">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto px-2 pb-4 flex-1">
              {searchQuery.trim() ? (
                <div className="flex flex-col gap-4 pt-2">
                  {filteredBibliotecas.length > 0 ? (
                    filteredBibliotecas.map((b) => {
                      const books = getFilteredBooks(b.key);
                      if (!books.length) return null;
                      return (
                        <div key={b.key}>
                          <button onClick={() => { navigate(b.route); setSearchOpen(false); }} className="text-sm font-bold text-primary mb-2 hover:underline cursor-pointer">{b.title} →</button>
                          <div className="grid grid-cols-4 xl:grid-cols-6 gap-3">
                            {books.slice(0, 12).map((book) => (
                              <button key={book.id} onClick={() => { navigate(`${b.livroRoute}/${book.id}`); setSearchOpen(false); }} className="text-center group cursor-pointer">
                                {book.capa ? (
                                  <img src={book.capa} alt={book.titulo} className="w-full aspect-[3/4] object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform" />
                                ) : (
                                  <div className="w-full aspect-[3/4] rounded-lg bg-secondary flex items-center justify-center"><BookMarked className="w-6 h-6 text-muted-foreground" /></div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{book.titulo}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground"><SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Nenhum resultado encontrado</p></div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground"><SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Digite para buscar livros, autores ou bibliotecas</p></div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) setSearchQuery(""); }}>
          <DrawerContent className="max-h-[85vh] bg-background">
            <div className="px-4 pt-4 pb-2">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar livro, autor ou biblioteca..."
                  className="pl-12 pr-10 h-12 text-base bg-neutral-800/80 border-white/10 focus:border-amber-500/50 rounded-xl"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto px-4 pb-6 max-h-[70vh]">
              {searchQuery.trim() ? (
                <div className="flex flex-col gap-4 pt-2">
                  {filteredBibliotecas.length > 0 ? (
                    filteredBibliotecas.map((b) => {
                      const books = getFilteredBooks(b.key);
                      if (!books.length) return null;
                      return (
                        <div key={b.key}>
                          <button onClick={() => { navigate(b.route); setSearchOpen(false); }} className="text-sm font-bold text-amber-400 mb-2 hover:underline">{b.title} →</button>
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {books.slice(0, 6).map((book) => (
                              <button key={book.id} onClick={() => { navigate(`${b.livroRoute}/${book.id}`); setSearchOpen(false); }} className="flex-shrink-0 w-20 text-center group">
                                {book.capa ? (
                                  <img src={book.capa} alt={book.titulo} className="w-20 h-28 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform" />
                                ) : (
                                  <div className="w-20 h-28 rounded-lg bg-neutral-800 flex items-center justify-center"><BookMarked className="w-6 h-6 text-muted-foreground" /></div>
                                )}
                                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{book.titulo}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground"><SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Nenhum resultado encontrado</p></div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground"><SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Digite para buscar livros, autores ou bibliotecas</p></div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {activeTab === null ? (
      <>
      {/* Book sections */}
      <div className="flex flex-col gap-6 pb-24">
        {bibliotecas.map((b, idx) => (
          <div
            key={b.key}
            className="animate-fade-in"
          >
          <BibliotecaSection
              title={b.title}
              subtitle={b.subtitle}
              capaUrl={b.localCapa}
              count={contagens?.[b.key] || 0}
              route={b.route}
              livroRoute={b.livroRoute}
              books={livrosMap?.[b.key] || []}
              isLoading={livrosLoading || ((b.key === "estudos" || b.key === "oab") && areaLivrosLoading)}
              freeLimit={FREE_LIMITS[b.key]}
              isPremium={isPremium}
          isAreaBased={b.key === "estudos" || b.key === "oab"}
              areaBooks={b.key === "estudos" ? areaLivrosMap?.estudos : b.key === "oab" ? areaLivrosMap?.oab : undefined}
              areaTabMinWidth={sharedAreaTabMinWidth}
              showNivelToggle={b.key === "classicos"}
              navigate={navigate}
            />
            {idx < bibliotecas.length - 1 && (
              <div className="mt-6 flex items-center justify-center">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </div>
            )}
          </div>
        ))}
      </div>
      </>
      ) : activeTab === "plano" || activeTab === "favoritos" ? (
        <div className="pb-24">
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>}>
          {activeTab === "plano" ? <PlanoLeituraInline /> : <FavoritosInline />}
        </Suspense>
        </div>
      ) : activeTab === "livrodia" ? (
        <LivroDoDiaBiblioteca bibliotecas={bibliotecas} livrosMap={livrosMap} navigate={navigate} />
      ) : activeTab === "explorar" ? (
        <ExplorarBiblioteca bibliotecas={bibliotecas} contagens={contagens} navigate={navigate} />
      ) : null}
    </div>
  );
};

// Livro do Dia view
const LivroDoDiaBiblioteca = ({ bibliotecas: bibs, livrosMap, navigate }: { bibliotecas: BibliotecaConfig[]; livrosMap: Record<string, BibliotecaSectionBook[]> | undefined; navigate: (path: string) => void }) => {
  const livroDoDia = useMemo(() => {
    if (!livrosMap) return null;
    const allBooks: { book: BibliotecaSectionBook; bib: BibliotecaConfig }[] = [];
    for (const b of bibs) {
      for (const book of (livrosMap[b.key] || [])) {
        if (book.capa) allBooks.push({ book, bib: b });
      }
    }
    if (!allBooks.length) return null;
    const today = new Date();
    const idx = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % allBooks.length;
    return allBooks[idx];
  }, [livrosMap, bibs]);

  if (!livroDoDia) return <div className="text-center py-16 pb-24 text-muted-foreground">Carregando...</div>;

  const { book, bib } = livroDoDia;

  return (
    <div className="space-y-4 pb-24 pt-4 animate-fade-in">
      <div className="px-4">
        <div className="flex items-center gap-2.5 mb-1">
          <BookMarked className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold">Livro do Dia</h2>
        </div>
        <p className="text-xs text-muted-foreground">Recomendação especial de hoje</p>
      </div>

      <div className="mx-4 relative rounded-2xl overflow-hidden aspect-[2/3] max-h-[420px] cursor-pointer group" onClick={() => navigate(`${bib.livroRoute}/${book.id}`)}>
        <img src={book.capa!} alt={book.titulo} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Badge variant="secondary" className="mb-2 text-[10px] px-2.5 py-0.5 bg-amber-500/20 backdrop-blur-sm border-amber-500/30 text-amber-200">
            📖 Livro do Dia
          </Badge>
          <h3 className="text-2xl font-bold text-white mb-1">{book.titulo}</h3>
          <p className="text-sm text-white/70 mb-3">{bib.title}</p>
          {book.autor && <p className="text-xs text-white/60 mb-3">por {book.autor}</p>}
          <button className="flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-full text-sm font-bold shadow-xl">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Ver Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};

// Explorar view — overview of all libraries
const ExplorarBiblioteca = ({ bibliotecas: bibs, contagens, navigate }: { bibliotecas: BibliotecaConfig[]; contagens: Record<string, number> | undefined; navigate: (path: string) => void }) => {
  return (
    <div className="space-y-4 pb-24 pt-4 animate-fade-in">
      <div className="px-4">
        <div className="flex items-center gap-2.5 mb-1">
          <Compass className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold">Explorar Bibliotecas</h2>
        </div>
        <p className="text-xs text-muted-foreground">Navegue por todas as coleções disponíveis</p>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3">
        {bibs.map((b) => (
          <button
            key={b.key}
            onClick={() => navigate(b.route)}
            className="relative overflow-hidden rounded-2xl bg-card/80 border border-border/30 p-4 text-left hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
          >
            <img src={b.localCapa} alt={b.title} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative z-10">
              <h3 className="font-bold text-sm mb-0.5">{b.title}</h3>
              <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{b.subtitle}</p>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-400 border-amber-500/20">
                {contagens?.[b.key] || 0} obras
              </Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
