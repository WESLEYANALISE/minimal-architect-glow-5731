import { useNavigate } from "react-router-dom";
import { Library, Search as SearchIcon, Layers, BookMarked, ArrowRight, Crown, GraduationCap, Scale, Mic, Globe, Award, BookText, Lightbulb, FlaskConical } from "lucide-react";
import { BibliotecaTopNav, type BibliotecaTab } from "@/components/biblioteca/BibliotecaTopNav";
import { BibliotecaSection, type BibliotecaSectionBook } from "@/components/biblioteca/BibliotecaSection";
import { LivroCarouselCard } from "@/components/LivroCarouselCard";
import { ORDEM_LEITURA_CLASSICOS } from "@/components/biblioteca/BibliotecaSortToggle";
import { Input } from "@/components/ui/input";
import { useState, lazy, Suspense, useMemo } from "react";
import { Heart, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";

const PlanoLeituraInline = lazy(() => import("@/components/biblioteca/PlanoLeituraInline").then(m => ({ default: m.PlanoLeituraInline })));
const FavoritosInline = lazy(() => import("@/components/biblioteca/FavoritosInline").then(m => ({ default: m.FavoritosInline })));
import capaLideranca from "@/assets/capa-lideranca.webp";
import capaForaDaToga from "@/assets/capa-fora-da-toga.webp";
import capaEstudos from "@/assets/sala-aula-direito.webp";
import capaClassicos from "@/assets/capa-classicos.webp";
import capaOratoria from "@/assets/capa-oratoria.webp";
import capaPesquisaCientifica from "@/assets/capa-pesquisa-cientifica.webp";
import capaPortugues from "@/assets/capa-portugues.webp";
import capaOab from "@/assets/capa-biblioteca-oab.webp";
import capaPolitica from "@/assets/politico-esquerda.webp";
import capaOabAreas from "@/assets/capa-oab-areas.jpeg?format=webp&quality=75";
import themisFull from "@/assets/themis-full.webp";
import capaRedacao from "@/assets/capa-redacao-concursos.webp";
import capaColocacao from "@/assets/capa-colocacao-pronominal.webp";
import capaRegencia from "@/assets/capa-regencia-verbal.webp";
import capaOracoes from "@/assets/capa-oracoes-coordenadas.webp";
import capaSemantica from "@/assets/capa-semantica.webp";
import capaInterpretacao from "@/assets/capa-interpretacao-textos.webp";

const PORTUGUES_FALLBACK_COVERS: Record<string, string> = {
  "Redação para concursos": capaRedacao,
  "Colocação pronominal": capaColocacao,
  "Regência verbal e nominal": capaRegencia,
  "Orações coordenadas e subordinadas": capaOracoes,
  "Semântica": capaSemantica,
  "Interpretação de textos": capaInterpretacao,
};
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StandardPageHeader } from "@/components/StandardPageHeader";

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
  {
    key: "classicos",
    title: "Clássicos",
    subtitle: "Obras fundamentais da literatura jurídica",
    table: "BIBLIOTECA-CLASSICOS",
    titleCol: "livro",
    capaCol: "imagem",
    localCapa: capaClassicos,
    route: "/biblioteca-classicos",
    livroRoute: "/biblioteca-classicos",
  },
  {
    key: "estudos",
    title: "Estudos",
    subtitle: "Matérias e disciplinas do Direito",
    table: "BIBLIOTECA-ESTUDOS",
    titleCol: "Tema",
    capaCol: "Capa-livro",
    localCapa: capaEstudos,
    route: "/biblioteca-estudos",
    livroRoute: "/biblioteca-estudos",
  },
  {
    key: "oab",
    title: "OAB",
    subtitle: "Preparação para o Exame da Ordem",
    table: "BIBILIOTECA-OAB",
    titleCol: "Tema",
    capaCol: "Capa-livro",
    localCapa: capaOab,
    route: "/biblioteca-oab",
    livroRoute: "/biblioteca-oab",
  },
  {
    key: "politica",
    title: "Política",
    subtitle: "Literatura política e ciência de governo",
    table: "BIBLIOTECA-POLITICA",
    titleCol: "livro",
    capaCol: "imagem",
    localCapa: capaPolitica,
    route: "/biblioteca-politica",
    livroRoute: "/biblioteca-politica",
  },
  {
    key: "oratoria",
    title: "Oratória",
    subtitle: "A arte de falar em público",
    table: "BIBLIOTECA-ORATORIA",
    titleCol: "livro",
    capaCol: "imagem",
    localCapa: capaOratoria,
    route: "/biblioteca-oratoria",
    livroRoute: "/biblioteca-oratoria",
  },
  {
    key: "portugues",
    title: "Português",
    subtitle: "Gramática e redação para concursos",
    table: "BIBLIOTECA-PORTUGUES",
    titleCol: "livro",
    capaCol: "imagem",
    localCapa: capaPortugues,
    route: "/biblioteca-portugues",
    livroRoute: "/biblioteca-portugues",
  },
  {
    key: "lideranca",
    title: "Liderança",
    subtitle: "Gestão, liderança e desenvolvimento pessoal",
    table: "BIBLIOTECA-LIDERANÇA",
    titleCol: "livro",
    capaCol: "imagem",
    localCapa: capaLideranca,
    route: "/biblioteca-lideranca",
    livroRoute: "/biblioteca-lideranca",
  },
  {
    key: "fora",
    title: "Fora da Toga",
    subtitle: "Leituras além do universo jurídico",
    table: "BIBLIOTECA-FORA-DA-TOGA",
    titleCol: "livro",
    capaCol: "capa-livro",
    localCapa: capaForaDaToga,
    route: "/biblioteca-fora-da-toga",
    livroRoute: "/biblioteca-fora-da-toga",
  },
  {
    key: "pesquisa",
    title: "Pesquisa Científica",
    subtitle: "Metodologia e produção acadêmica",
    table: "BIBLIOTECA-PESQUISA-CIENTIFICA",
    titleCol: "livro",
    capaCol: "imagem",
    localCapa: capaPesquisaCientifica,
    route: "/biblioteca-pesquisa-cientifica",
    livroRoute: "/biblioteca-pesquisa-cientifica",
  },
];

const FREE_LIMITS: Record<string, number> = {
  estudos: 2, classicos: 2, oab: 2, oratoria: 2,
  politica: 2, portugues: 2, lideranca: 2, fora: 2, pesquisa: 0,
};

const Bibliotecas = () => {
  const routerNavigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<BibliotecaTab>("acervo");
  const { isPremium } = useSubscription();
  const { isAuthDialogOpen, closeAuthDialog, requireAuth } = useRequireAuth();

  const navigate = (path: string, options?: any) => {
    requireAuth(() => routerNavigate(path, options));
  };

  // Query contagens
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
  });

  // Query livros preview (10 por biblioteca)
  const { data: livrosMap, isLoading: livrosLoading } = useQuery({
    queryKey: ["livros-preview-bibliotecas"],
    queryFn: async () => {
      // Estudos: buscar por área (primeiro livro de cada área)
      const estudosPromise = (supabase as any)
        .from("BIBLIOTECA-ESTUDOS")
        .select("id, Área, Capa-area")
        .not("Área", "is", null)
        .order("id");

      // OAB: buscar por área (primeiro livro de cada área)
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

      // Estudos: agrupar por área, pegar primeiro de cada
      const estudosData = otherResults[0].data || [];
      const seenAreas = new Set<string>();
      const estudosBooks: BibliotecaSectionBook[] = [];
      for (const row of estudosData) {
        const area = row["Área"];
        if (area && !seenAreas.has(area)) {
          seenAreas.add(area);
          estudosBooks.push({
            id: row.id,
            titulo: area,
            capa: row["Capa-area"] || null,
          });
        }
      }
      map["estudos"] = estudosBooks;

      // OAB: agrupar por área, pegar primeiro de cada
      const oabData = otherResults[1].data || [];
      const seenOabAreas = new Set<string>();
      const oabBooks: BibliotecaSectionBook[] = [];
      for (const row of oabData) {
        const area = row["Área"];
        if (area && !seenOabAreas.has(area)) {
          seenOabAreas.add(area);
          oabBooks.push({
            id: row.id,
            titulo: area,
            capa: capaOabAreas,
          });
        }
      }
      map["oab"] = oabBooks;

      // Demais bibliotecas
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
  });

  const totalObras = contagens
    ? Object.values(contagens).reduce((a, b) => a + b, 0)
    : 0;

  const filteredBibliotecas = bibliotecas.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Desktop: coleção selecionada na sidebar — começa com "classicos"
  const [selectedCollection, setSelectedCollection] = useState<string>("classicos");
  const selectedBib = bibliotecas.find(b => b.key === selectedCollection) || bibliotecas[0];
  const selectedBooks = livrosMap ? livrosMap[selectedCollection] || [] : [];
  const [desktopRightTab, setDesktopRightTab] = useState<'plano' | 'favoritos' | null>(null);

  // Filter books by search on desktop
  const filteredSelectedBooks = useMemo(() => {
    if (!searchQuery.trim()) return selectedBooks;
    return selectedBooks.filter(b => b.titulo.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [selectedBooks, searchQuery]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Themis fixed background */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <img src={themisFull} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 animate-pulse" style={{ animationDuration: '4s', background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />
      </div>
      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      <div className="fixed inset-0 z-[2] pointer-events-none animate-shimmer-down" style={{ background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)" }} />

      <div className="relative z-10">
        <StandardPageHeader title="Bibliotecas" position="fixed" backPath="/" />
        <div className="pt-[env(safe-area-inset-top)]" />

        {/* ── MOBILE: original layout ── */}
        <div className="lg:hidden">
          {/* Hero */}
          <div className="pt-14 pb-3 px-4">
            <div className="max-w-7xl mx-auto text-center animate-fade-in">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Library className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                    <span className="bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent">Biblioteca Jurídica</span>
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1">Acervo completo para sua formação</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-amber-400" />{bibliotecas.length} coleções</span>
                  <span className="w-px h-3 bg-border" />
                  <span className="flex items-center gap-1.5"><BookMarked className="w-3.5 h-3.5 text-amber-400" />{totalObras} obras</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-4">
            <div className="max-w-7xl mx-auto relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar biblioteca..." className="pl-12 h-12 text-base bg-card/50 border-amber-900/20 focus:border-amber-500/50 rounded-xl" />
            </div>
          </div>

          {/* Tabs */}
          <BibliotecaTopNav activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "acervo" ? (
            <div className="pb-10 pt-3">
              <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {filteredBibliotecas.map((b, idx) => (
                  <motion.div
                    key={b.key}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: idx < 3 ? idx * 0.1 : 0, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <BibliotecaSection
                      title={b.title}
                      subtitle={b.subtitle}
                      capaUrl={b.localCapa}
                      count={contagens?.[b.key] || 0}
                      route={b.route}
                      livroRoute={b.livroRoute}
                      books={livrosMap?.[b.key] || []}
                      isLoading={livrosLoading}
                      freeLimit={FREE_LIMITS[b.key]}
                      isPremium={isPremium}
                      isAreaBased={b.key === "estudos" || b.key === "oab"}
                      showNivelToggle={b.key === "classicos"}
                      navigate={navigate}
                    />
                    {idx < filteredBibliotecas.length - 1 && (
                      <div className="mt-6 flex items-center justify-center">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>}>
              {activeTab === "plano" ? <PlanoLeituraInline /> : <FavoritosInline />}
            </Suspense>
          )}
        </div>

        {/* ── DESKTOP: fixed full-screen layout, no scrollbars ── */}
        <div className="hidden lg:flex flex-col pt-14 max-w-[1600px] mx-auto" style={{ height: '100vh' }}>
          
          {/* TOP BAR: Search + Plano/Favoritos */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 flex-shrink-0">
            {/* Collection tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
              {bibliotecas.map((b) => {
                const isActive = selectedCollection === b.key;
                const icons: Record<string, any> = {
                  classicos: Crown, estudos: GraduationCap, oab: Scale, politica: Globe,
                  oratoria: Mic, portugues: BookText, lideranca: Award, fora: Lightbulb, pesquisa: FlaskConical,
                };
                const Icon = icons[b.key] || Library;
                return (
                  <button
                    key={b.key}
                    onClick={() => setSelectedCollection(b.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {b.title}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-[220px] xl:w-[280px] flex-shrink-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Buscar em ${selectedBib.title}...`}
                className="pl-10 h-9 text-xs bg-card/50 border-amber-900/20 focus:border-amber-500/50 rounded-full"
              />
            </div>

            {/* Plano / Favoritos buttons */}
            <button
              onClick={() => setDesktopRightTab(desktopRightTab === 'plano' ? null : 'plano')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                desktopRightTab === 'plano'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Plano
            </button>
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                desktopRightTab === 'favoritos'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
              onClick={() => setDesktopRightTab(desktopRightTab === 'favoritos' ? null : 'favoritos')}
            >
              <Heart className="w-3.5 h-3.5" />
              Favoritos
            </button>
            <button
              onClick={() => navigate(selectedBib.route)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-medium hover:bg-amber-500/25 transition-colors whitespace-nowrap"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* CONTENT: books or plano/favoritos overlay */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
            {desktopRightTab === 'plano' || desktopRightTab === 'favoritos' ? (
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">
                    {desktopRightTab === 'plano' ? 'Plano de Leitura' : 'Favoritos'}
                  </h2>
                  <button
                    onClick={() => setDesktopRightTab(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ← Voltar ao acervo
                  </button>
                </div>
                <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-500" /></div>}>
                  {desktopRightTab === 'plano' ? <PlanoLeituraInline /> : <FavoritosInline />}
                </Suspense>
              </div>
            ) : (
              <>
                {/* Estudos: show areas as carousels */}
                {(selectedCollection === 'estudos' || selectedCollection === 'oab') && filteredSelectedBooks.length > 0 ? (
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold text-foreground mb-3">
                      {selectedBib.title} <span className="text-xs text-muted-foreground font-normal">— {selectedBib.subtitle}</span>
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {filteredSelectedBooks.map((book, index) => {
                        const isLocked = !isPremium && FREE_LIMITS[selectedCollection] !== undefined && index >= (FREE_LIMITS[selectedCollection] || 0);
                        return (
                          <div
                            key={book.id}
                            onClick={() => {
                              if (isLocked) return;
                              navigate(selectedBib.route, { state: { selectedArea: book.titulo } });
                            }}
                            className="flex-[0_0_160px] cursor-pointer group"
                          >
                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/10 hover:border-amber-500/40 transition-all hover:shadow-amber-500/20">
                              {book.capa ? (
                                <img src={book.capa} alt={book.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center">
                                  <BookOpen className="w-10 h-10 text-amber-400/60" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">{book.titulo}</h3>
                              </div>
                              {isLocked && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-amber-400 text-xs font-semibold">Premium</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-3 mb-4">
                      <h2 className="text-lg font-bold text-foreground">{selectedBib.title}</h2>
                      {selectedBib.subtitle && <span className="text-xs text-muted-foreground">— {selectedBib.subtitle}</span>}
                    </div>
                    <div className="grid grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 xl:gap-4">
                      {livrosLoading ? (
                        Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="aspect-[2/3] rounded-lg bg-white/10 animate-pulse" />
                        ))
                      ) : filteredSelectedBooks.length > 0 ? (
                        filteredSelectedBooks.map((book, index) => {
                          const isLocked = !isPremium && FREE_LIMITS[selectedCollection] !== undefined && index >= (FREE_LIMITS[selectedCollection] || 0);
                          return (
                            <LivroCarouselCard
                              key={book.id}
                              titulo={book.titulo}
                              capaUrl={book.capa}
                              isPremiumLocked={isLocked}
                              priority={index < 8}
                              onClick={() => {
                                if (isLocked) return;
                                navigate(`${selectedBib.livroRoute}/${book.id}`);
                              }}
                            />
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground col-span-full text-center py-12">Nenhum livro encontrado.</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <AuthRequiredDialog open={isAuthDialogOpen} onOpenChange={closeAuthDialog} />
    </div>
  );
};

export default Bibliotecas;
