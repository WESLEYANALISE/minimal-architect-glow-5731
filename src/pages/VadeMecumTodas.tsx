import { useNavigate } from "react-router-dom";
import { Crown, Gavel, FileText, BookText, Scale, Shield, HandCoins, ChevronRight, FileCheck, Users, ShieldCheck, Fingerprint, DollarSign, BookMarked, BadgeCheck, Handshake, User, AlertTriangle, Briefcase, Bell, Calendar, FileSearch, ArrowLeft, Search, Loader2, ListFilter, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";

import brasaoRepublica from "@/assets/brasao-republica.png?format=webp&quality=80";
import heroVadeMecumMenu from "@/assets/hero-vademecum-planalto.webp";
import heroVadeMecumAtualizacoes from "@/assets/vade-mecum-hero.webp";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import PopularProposicoesManual from "@/components/PopularProposicoesManual";
import ExplicacoesList from "@/components/lei-seca/ExplicacoesList";
import ResenhaDiariaCarousel from "@/components/ResenhaDiariaCarousel";
import { PesquisaLegislacaoTimeline } from "@/components/PesquisaLegislacaoTimeline";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

interface MainCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  iconBg: string;
  color: string;
}

interface ResenhaItem {
  id: string;
  numero_lei: string;
  ementa: string;
  data_publicacao: string;
}

interface SearchResult {
  tableName: string;
  displayName: string;
  articleNumber: string;
  content: string;
  route: string;
  color: string;
}

const VadeMecumTodas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [activeTab, setActiveTab] = useState("legislacao");
  const [showLegislacao, setShowLegislacao] = useState(false);
  const [resenhaItems, setResenhaItems] = useState<ResenhaItem[]>([]);
  const [isLoadingResenha, setIsLoadingResenha] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>("todos");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const [searchMode, setSearchMode] = useState<"palavra" | "lei">("palavra");
  
  const [imagesLoaded, setImagesLoaded] = useState({
    menu: false,
    atualizacoes: false,
  });

  useEffect(() => {
    const images = [
      { key: 'menu', src: heroVadeMecumMenu },
      { key: 'atualizacoes', src: heroVadeMecumAtualizacoes },
    ];
    
    images.forEach(({ key, src }) => {
      const img = new Image();
      img.src = src;
      img.onload = () => setImagesLoaded(prev => ({ ...prev, [key]: true }));
    });
  }, []);

  // Carregar últimas atualizações da Resenha Diária quando aba ativa
  useEffect(() => {
    if (activeTab === "explicacoes") {
      fetchResenhaItems();
    }
  }, [activeTab]);

  const fetchResenhaItems = async () => {
    setIsLoadingResenha(true);
    try {
      const { data, error } = await supabase
        .from('resenha_diaria')
        .select('id, numero_lei, ementa, data_publicacao')
        .order('data_publicacao', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setResenhaItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar resenha:', error);
    } finally {
      setIsLoadingResenha(false);
    }
  };

  // Agrupar itens por data de publicação
  const resenhaGroupedByDate = resenhaItems.reduce((acc, item) => {
    const date = item.data_publicacao;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ResenhaItem[]>);

  // Card hero - Constituição Federal
  const constituicaoCard = { id: "constituicao", title: "Constituição Federal", description: "Lei Fundamental do Estado Brasileiro", icon: Crown, iconBg: "bg-[hsl(345,40%,30%)]", color: "#9f1239", route: "/constituicao" };

  // Categorias principais (mais acessadas)
  const categoriasPrincipais = [
    { id: "constituicao", title: "Constituição", description: "Lei Fundamental e Suprema do Brasil", icon: Crown, iconBg: "bg-[hsl(345,40%,30%)]", color: "#9f1239", route: "/constituicao" },
    { id: "codigos", title: "Códigos", description: "Civil, Penal, CPC, CPP, CLT e mais", icon: Scale, iconBg: "bg-red-500", color: "#ef4444", route: "/codigos" },
    { id: "legislacao-penal", title: "Leis\nEspeciais", description: "Drogas, Armas, Maria da Penha", icon: Shield, iconBg: "bg-red-600", color: "#dc2626", route: "/legislacao-penal-especial" },
    { id: "estatutos", title: "Estatutos", description: "ECA, Idoso, OAB, Cidade e mais", icon: Gavel, iconBg: "bg-purple-500", color: "#a855f7", route: "/estatutos" },
    { id: "sumulas", title: "Jurisprudência", description: "Súmulas STF, STJ, TST, TSE e Vinculantes", icon: BookText, iconBg: "bg-blue-500", color: "#3b82f6", route: "/sumulas" },
    { id: "previdenciario", title: "Previdenciário", description: "Benefícios e Custeio da Previdência", icon: HandCoins, iconBg: "bg-emerald-500", color: "#10b981", route: "/previdenciario" },
    { id: "leis-ordinarias", title: "LO", description: "Leis Ordinárias Federais", icon: FileText, iconBg: "bg-cyan-500", color: "#06b6d4", route: "/leis-ordinarias" },
    { id: "leis-complementares", title: "LC", description: "Leis Complementares Federais", icon: FileCheck, iconBg: "bg-indigo-500", color: "#6366f1", route: "/leis-ordinarias" },
  ];

  // Proposições legislativas removidas (PEC, PL, PLC)
  const proposicoes: any[] = [];

  const searchCategories = [
    { id: "todos", label: "Todos", icon: ListFilter, color: "#6b7280" },
    { id: "constituicao", label: "Constituição", icon: Crown, color: "#9f1239" },
    { id: "codigos", label: "Códigos", icon: Scale, color: "#ef4444" },
    { id: "penal", label: "Leis Especiais", icon: Gavel, color: "#dc2626" },
    { id: "estatutos", label: "Estatutos", icon: Shield, color: "#10b981" },
    { id: "previdenciario", label: "Previdenciário", icon: HandCoins, color: "#059669" },
    { id: "leis", label: "Leis Ordinárias", icon: FileText, color: "#3b82f6" },
    { id: "complementares", label: "Leis Complementares", icon: FileCheck, color: "#6366f1" },
    { id: "sumulas", label: "Jurisprudência", icon: BookText, color: "#8b5cf6" },
  ];

  const handleCloseSearch = () => {
    setSearchClosing(true);
    setTimeout(() => {
      setSearchOpen(false);
      setSearchClosing(false);
      setSearchQuery("");
      setShowResults(false);
    }, 300);
  };

  // Mapeamento de tabelas para busca
  const tabelasBusca = {
    constituicao: [
      { table: "CF - Constituição Federal", name: "Constituição Federal", route: "/constituicao", color: "#f59e0b" }
    ],
    codigos: [
      { table: "CC - Código Civil", name: "Código Civil", route: "/codigo/cc", color: "#ef4444" },
      { table: "CP - Código Penal", name: "Código Penal", route: "/codigo/cp", color: "#f43f5e" },
      { table: "CPC - Código de Processo Civil", name: "CPC", route: "/codigo/cpc", color: "#e11d48" },
      { table: "CPP – Código de Processo Penal", name: "CPP", route: "/codigo/cpp", color: "#fb7185" },
      { table: "CLT - Consolidação das Leis do Trabalho", name: "CLT", route: "/codigo/clt", color: "#f97316" },
      { table: "CTN – Código Tributário Nacional", name: "CTN", route: "/codigo/ctn", color: "#fb923c" },
      { table: "CDC – Código de Defesa do Consumidor", name: "CDC", route: "/codigo/cdc", color: "#f472b6" },
      { table: "CTB Código de Trânsito Brasileiro", name: "Código de Trânsito", route: "/codigo/ctb", color: "#f59e0b" },
      { table: "CE – Código Eleitoral", name: "Código Eleitoral", route: "/codigo/ce", color: "#fbbf24" },
    ],
    penal: [
      { table: "CP - Código Penal", name: "Código Penal", route: "/codigo/cp", color: "#f43f5e" },
      { table: "CPP – Código de Processo Penal", name: "CPP", route: "/codigo/cpp", color: "#fb7185" },
      { table: "Lei 7.210 de 1984 - Lei de Execução Penal", name: "Lei de Execução Penal", route: "/lei/lep", color: "#e11d48" },
      { table: "Lei 8.072 de 1990 - Crimes Hediondos", name: "Crimes Hediondos", route: "/lei/hediondos", color: "#dc2626" },
      { table: "Lei 11.340 de 2006 - Maria da Penha", name: "Maria da Penha", route: "/lei/maria-penha", color: "#ec4899" },
      { table: "Lei 11.343 de 2006 - Lei de Drogas", name: "Lei de Drogas", route: "/lei/drogas", color: "#f43f5e" },
      { table: "Lei 12.850 de 2013 - Organizações Criminosas", name: "Organizações Criminosas", route: "/lei/org-criminosas", color: "#ef4444" },
    ],
    estatutos: [
      { table: "ESTATUTO - ECA", name: "ECA", route: "/estatuto/eca", color: "#10b981" },
      { table: "ESTATUTO - IDOSO", name: "Estatuto do Idoso", route: "/estatuto/idoso", color: "#34d399" },
      { table: "ESTATUTO - OAB", name: "Estatuto da OAB", route: "/estatuto/oab", color: "#14b8a6" },
      { table: "ESTATUTO - PESSOA COM DEFICIÊNCIA", name: "Pessoa com Deficiência", route: "/estatuto/deficiencia", color: "#2dd4bf" },
      { table: "ESTATUTO - IGUALDADE RACIAL", name: "Igualdade Racial", route: "/estatuto/igualdade-racial", color: "#06b6d4" },
      { table: "ESTATUTO - DESARMAMENTO", name: "Desarmamento", route: "/estatuto/desarmamento", color: "#22d3ee" },
      { table: "ESTATUTO - CIDADE", name: "Estatuto da Cidade", route: "/estatuto/cidade", color: "#0ea5e9" },
      { table: "ESTATUTO - TORCEDOR", name: "Estatuto do Torcedor", route: "/estatuto/torcedor", color: "#38bdf8" },
    ],
    leis: [
      { table: "Lei 9.099 de 1995 - Juizados Especiais", name: "Juizados Especiais", route: "/lei/juizados", color: "#3b82f6" },
      { table: "Lei 9.296 de 1996 - Interceptação Telefônica", name: "Interceptação Telefônica", route: "/lei/interceptacao", color: "#60a5fa" },
    ],
    sumulas: [
      { table: "SUMULAS_STF", name: "Súmulas STF", route: "/sumulas/stf", color: "#a78bfa" },
      { table: "SUMULAS_STJ", name: "Súmulas STJ", route: "/sumulas/stj", color: "#8b5cf6" },
      { table: "SUMULAS_TST", name: "Súmulas TST", route: "/sumulas/tst", color: "#c084fc" },
    ],
    previdenciario: [
      { table: "Lei 8.212 de 1991 - Custeio da Seguridade Social", name: "Custeio da Seguridade Social", route: "/lei/custeio", color: "#34d399" },
      { table: "Lei 8.213 de 1991 - Benefícios da Previdência Social", name: "Benefícios Previdenciários", route: "/lei/beneficios", color: "#10b981" },
    ],
    complementares: [
      { table: "LC 75 de 1993 - Estatuto do MPU", name: "Estatuto do MPU", route: "/lei/mpu", color: "#818cf8" },
      { table: "LC 80 de 1994 - Lei Orgânica da Defensoria Pública", name: "Defensoria Pública", route: "/lei/defensoria", color: "#a78bfa" },
    ]
  };

  // Tags invisíveis para busca por palavra-chave
  const KEYWORD_TAGS: Record<string, { tags: string[]; name: string; route: string; color: string; description: string }> = {
    "cf": { tags: ["constituição", "federal", "cf", "cf88", "direitos fundamentais", "garantias", "cidadania", "soberania", "república", "democracia", "habeas corpus", "mandado de segurança", "emendas", "cláusulas pétreas"], name: "Constituição Federal", route: "/constituicao", color: "#f59e0b", description: "CF/88 — Lei Fundamental do Brasil" },
    "cc": { tags: ["civil", "código civil", "cc", "obrigações", "contratos", "família", "sucessões", "propriedade", "posse", "herança", "casamento", "divórcio", "responsabilidade civil", "pessoa jurídica", "capacidade", "negócio jurídico", "prescrição", "usucapião"], name: "Código Civil", route: "/codigo/cc", color: "#ef4444", description: "Lei 10.406/2002" },
    "cp": { tags: ["penal", "código penal", "cp", "crime", "pena", "homicídio", "furto", "roubo", "estelionato", "lesão corporal", "injúria", "calúnia", "difamação", "estupro", "corrupção", "peculato", "prevaricação", "concussão", "receptação"], name: "Código Penal", route: "/codigo/cp", color: "#f43f5e", description: "Decreto-Lei 2.848/1940" },
    "cpc": { tags: ["processo civil", "cpc", "processual civil", "petição", "recurso", "apelação", "agravo", "embargos", "cumprimento de sentença", "execução", "tutela", "antecipação", "citação", "intimação", "audiência", "contestação", "réplica"], name: "CPC", route: "/codigo/cpc", color: "#e11d48", description: "Lei 13.105/2015" },
    "cpp": { tags: ["processo penal", "cpp", "processual penal", "inquérito", "denúncia", "prisão", "flagrante", "fiança", "habeas corpus", "interceptação", "busca e apreensão", "júri", "tribunal do júri", "pronúncia"], name: "CPP", route: "/codigo/cpp", color: "#fb7185", description: "Decreto-Lei 3.689/1941" },
    "clt": { tags: ["trabalho", "trabalhista", "clt", "empregado", "empregador", "férias", "salário", "jornada", "hora extra", "fgts", "rescisão", "aviso prévio", "insalubridade", "periculosidade", "sindicato", "greve", "terceirização"], name: "CLT", route: "/codigo/clt", color: "#f97316", description: "Decreto-Lei 5.452/1943" },
    "ctn": { tags: ["tributário", "tributo", "imposto", "taxa", "contribuição", "ctn", "fato gerador", "obrigação tributária", "crédito tributário", "lançamento", "isenção", "imunidade", "prescrição tributária", "decadência", "icms", "iss", "ir"], name: "CTN", route: "/codigo/ctn", color: "#fb923c", description: "Lei 5.172/1966" },
    "cdc": { tags: ["consumidor", "cdc", "fornecedor", "produto", "serviço", "propaganda enganosa", "vício", "defeito", "recall", "garantia", "troca", "devolução", "procon"], name: "CDC", route: "/codigo/cdc", color: "#f472b6", description: "Lei 8.078/1990" },
    "ctb": { tags: ["trânsito", "ctb", "multa", "cnh", "habilitação", "infração", "veículo", "condutor", "acidente", "embriaguez", "radar", "velocidade", "sinalização"], name: "Código de Trânsito", route: "/codigo/ctb", color: "#f59e0b", description: "Lei 9.503/1997" },
    "ce": { tags: ["eleitoral", "eleição", "voto", "candidato", "partido", "propaganda", "urna", "ce", "inelegibilidade", "filiação", "coligação", "campanha"], name: "Código Eleitoral", route: "/codigo/ce", color: "#fbbf24", description: "Lei 4.737/1965" },
    "drogas": { tags: ["drogas", "entorpecentes", "tráfico", "dependente", "crack", "maconha", "cocaína", "tóxico", "substância", "sisnad"], name: "Lei de Drogas", route: "/lei/drogas", color: "#f43f5e", description: "Lei 11.343/2006" },
    "maria-penha": { tags: ["maria da penha", "violência doméstica", "violência contra a mulher", "medida protetiva", "agressão", "mulher", "doméstica", "familiar"], name: "Maria da Penha", route: "/lei/maria-penha", color: "#ec4899", description: "Lei 11.340/2006" },
    "hediondos": { tags: ["hediondo", "hediondos", "crimes hediondos", "latrocínio", "extorsão mediante sequestro", "estupro", "genocídio", "inafiançável"], name: "Crimes Hediondos", route: "/lei/hediondos", color: "#dc2626", description: "Lei 8.072/1990" },
    "lep": { tags: ["execução penal", "preso", "detento", "penitenciária", "regime", "progressão", "livramento condicional", "remição", "saída temporária", "indulto"], name: "Lei de Execução Penal", route: "/lei/lep", color: "#e11d48", description: "Lei 7.210/1984" },
    "org-criminosas": { tags: ["organização criminosa", "organização", "orcrim", "delação", "colaboração premiada", "infiltração", "milícia", "facção"], name: "Organizações Criminosas", route: "/lei/org-criminosas", color: "#ef4444", description: "Lei 12.850/2013" },
    "eca": { tags: ["criança", "adolescente", "eca", "menor", "infância", "juventude", "adoção", "guarda", "tutela", "conselho tutelar", "ato infracional", "medida socioeducativa"], name: "ECA", route: "/estatuto/eca", color: "#10b981", description: "Lei 8.069/1990" },
    "idoso": { tags: ["idoso", "terceira idade", "envelhecimento", "60 anos", "aposentado", "estatuto do idoso"], name: "Estatuto do Idoso", route: "/estatuto/idoso", color: "#34d399", description: "Lei 10.741/2003" },
    "oab": { tags: ["oab", "advogado", "advocacia", "ordem dos advogados", "inscrição", "ética", "honorários", "procuração"], name: "Estatuto da OAB", route: "/estatuto/oab", color: "#14b8a6", description: "Lei 8.906/1994" },
    "deficiencia": { tags: ["deficiência", "pessoa com deficiência", "acessibilidade", "inclusão", "pcd", "barreira", "capacidade legal"], name: "Pessoa com Deficiência", route: "/estatuto/deficiencia", color: "#2dd4bf", description: "Lei 13.146/2015" },
    "igualdade-racial": { tags: ["igualdade racial", "racismo", "discriminação racial", "cotas", "quilombo", "afrodescendente"], name: "Igualdade Racial", route: "/estatuto/igualdade-racial", color: "#06b6d4", description: "Lei 12.288/2010" },
    "desarmamento": { tags: ["arma", "desarmamento", "porte", "posse de arma", "arma de fogo", "munição", "sinarm", "colecionador", "caçador", "atirador"], name: "Desarmamento", route: "/estatuto/desarmamento", color: "#22d3ee", description: "Lei 10.826/2003" },
    "cidade": { tags: ["cidade", "urbanismo", "plano diretor", "usucapião urbana", "solo", "parcelamento", "estatuto da cidade", "iptu progressivo"], name: "Estatuto da Cidade", route: "/estatuto/cidade", color: "#0ea5e9", description: "Lei 10.257/2001" },
    "torcedor": { tags: ["torcedor", "esporte", "estádio", "futebol", "ingresso", "torcida", "violência no esporte"], name: "Estatuto do Torcedor", route: "/estatuto/torcedor", color: "#38bdf8", description: "Lei 10.671/2003" },
    "juizados": { tags: ["juizados especiais", "pequenas causas", "conciliação", "juizado", "9099", "jecrim", "termo circunstanciado"], name: "Juizados Especiais", route: "/lei/juizados", color: "#3b82f6", description: "Lei 9.099/1995" },
    "interceptacao": { tags: ["interceptação", "escuta", "telefônica", "grampo", "sigilo telefônico", "9296"], name: "Interceptação Telefônica", route: "/lei/interceptacao", color: "#60a5fa", description: "Lei 9.296/1996" },
    "custeio": { tags: ["custeio", "seguridade social", "previdência", "inss", "contribuição previdenciária", "8212"], name: "Custeio da Seguridade", route: "/lei/custeio", color: "#34d399", description: "Lei 8.212/1991" },
    "beneficios": { tags: ["benefícios", "aposentadoria", "auxílio doença", "pensão por morte", "salário maternidade", "bpc", "loas", "8213", "previdenciário"], name: "Benefícios Previdenciários", route: "/lei/beneficios", color: "#10b981", description: "Lei 8.213/1991" },
    "mpu": { tags: ["ministério público", "mpu", "procurador", "promotor", "lc 75", "mp da união"], name: "Estatuto do MPU", route: "/lei/mpu", color: "#818cf8", description: "LC 75/1993" },
    "defensoria": { tags: ["defensoria", "defensor público", "defensoria pública", "lc 80", "assistência jurídica"], name: "Defensoria Pública", route: "/lei/defensoria", color: "#a78bfa", description: "LC 80/1994" },
    "tortura": { tags: ["tortura", "lei de tortura", "9455", "crime de tortura"], name: "Lei de Tortura", route: "/lei/tortura", color: "#dc2626", description: "Lei 9.455/1997" },
    "improbidade": { tags: ["improbidade", "improbidade administrativa", "enriquecimento ilícito", "ato de improbidade", "8429", "agente público"], name: "Improbidade Administrativa", route: "/lei/improbidade", color: "#ef4444", description: "Lei 8.429/1992" },
    "abuso-autoridade": { tags: ["abuso de autoridade", "abuso", "autoridade", "13869", "agente público"], name: "Abuso de Autoridade", route: "/lei/abuso-autoridade", color: "#f97316", description: "Lei 13.869/2019" },
    "lavagem": { tags: ["lavagem de dinheiro", "lavagem", "branqueamento", "9613", "coaf", "patrimônio ilícito"], name: "Lavagem de Dinheiro", route: "/lei/lavagem", color: "#f43f5e", description: "Lei 9.613/1998" },
  };

  // Mapeamento de números de lei para rotas
  const LEI_NUMBER_MAP: Record<string, { name: string; route: string; color: string }> = {
    "10406": { name: "Código Civil", route: "/codigo/cc", color: "#ef4444" },
    "2848": { name: "Código Penal", route: "/codigo/cp", color: "#f43f5e" },
    "13105": { name: "CPC", route: "/codigo/cpc", color: "#e11d48" },
    "3689": { name: "CPP", route: "/codigo/cpp", color: "#fb7185" },
    "5452": { name: "CLT", route: "/codigo/clt", color: "#f97316" },
    "5172": { name: "CTN", route: "/codigo/ctn", color: "#fb923c" },
    "8078": { name: "CDC", route: "/codigo/cdc", color: "#f472b6" },
    "9503": { name: "Código de Trânsito", route: "/codigo/ctb", color: "#f59e0b" },
    "4737": { name: "Código Eleitoral", route: "/codigo/ce", color: "#fbbf24" },
    "11343": { name: "Lei de Drogas", route: "/lei/drogas", color: "#f43f5e" },
    "11340": { name: "Maria da Penha", route: "/lei/maria-penha", color: "#ec4899" },
    "8072": { name: "Crimes Hediondos", route: "/lei/hediondos", color: "#dc2626" },
    "7210": { name: "Lei de Execução Penal", route: "/lei/lep", color: "#e11d48" },
    "12850": { name: "Organizações Criminosas", route: "/lei/org-criminosas", color: "#ef4444" },
    "8069": { name: "ECA", route: "/estatuto/eca", color: "#10b981" },
    "10741": { name: "Estatuto do Idoso", route: "/estatuto/idoso", color: "#34d399" },
    "8906": { name: "Estatuto da OAB", route: "/estatuto/oab", color: "#14b8a6" },
    "13146": { name: "Pessoa com Deficiência", route: "/estatuto/deficiencia", color: "#2dd4bf" },
    "12288": { name: "Igualdade Racial", route: "/estatuto/igualdade-racial", color: "#06b6d4" },
    "10826": { name: "Desarmamento", route: "/estatuto/desarmamento", color: "#22d3ee" },
    "10257": { name: "Estatuto da Cidade", route: "/estatuto/cidade", color: "#0ea5e9" },
    "10671": { name: "Estatuto do Torcedor", route: "/estatuto/torcedor", color: "#38bdf8" },
    "9099": { name: "Juizados Especiais", route: "/lei/juizados", color: "#3b82f6" },
    "9296": { name: "Interceptação Telefônica", route: "/lei/interceptacao", color: "#60a5fa" },
    "8212": { name: "Custeio da Seguridade", route: "/lei/custeio", color: "#34d399" },
    "8213": { name: "Benefícios Previdenciários", route: "/lei/beneficios", color: "#10b981" },
    "9455": { name: "Lei de Tortura", route: "/lei/tortura", color: "#dc2626" },
    "8429": { name: "Improbidade Administrativa", route: "/lei/improbidade", color: "#ef4444" },
    "13869": { name: "Abuso de Autoridade", route: "/lei/abuso-autoridade", color: "#f97316" },
    "9613": { name: "Lavagem de Dinheiro", route: "/lei/lavagem", color: "#f43f5e" },
  };

  // Busca por palavra-chave usando tags
  const buscarPorPalavraChave = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;
    
    setIsSearching(true);
    setShowResults(false);
    setSearchResults([]);

    const results: SearchResult[] = [];
    const queryWords = query.split(/\s+/);

    Object.entries(KEYWORD_TAGS).forEach(([, entry]) => {
      // Check if any tag matches any query word
      const score = entry.tags.reduce((acc, tag) => {
        const tagLower = tag.toLowerCase();
        // Exact match scores highest
        if (tagLower === query) return acc + 10;
        // Tag contains full query
        if (tagLower.includes(query)) return acc + 5;
        // Query contains tag
        if (query.includes(tagLower)) return acc + 4;
        // Individual word matches
        const wordMatches = queryWords.filter(w => tagLower.includes(w) || w.includes(tagLower)).length;
        return acc + wordMatches * 2;
      }, 0);

      if (score > 0) {
        results.push({
          tableName: entry.name,
          displayName: entry.name,
          articleNumber: entry.description,
          content: entry.description,
          route: entry.route,
          color: entry.color,
          _score: score,
        } as SearchResult & { _score: number });
      }
    });

    // Sort by relevance score
    results.sort((a, b) => ((b as any)._score || 0) - ((a as any)._score || 0));

    setSearchResults(results);
    setShowResults(true);
    setIsSearching(false);
  };

  // Busca por número de lei — normaliza pontos, barras, espaços
  const buscarPorNumeroLei = () => {
    const raw = searchQuery.trim();
    if (!raw) return;

    setIsSearching(true);
    setShowResults(false);
    setSearchResults([]);

    // Normalize: remove dots, slashes, spaces, dashes to get pure number
    const normalized = raw.replace(/[\.\-\/\s]/g, '');
    
    // Try to extract just the law number (before any year)
    // e.g., "11.343/2006" → "11343", "8.078" → "8078"
    const justNumber = normalized.replace(/(\d+)\d{4}$/, '$1') || normalized;
    
    const results: SearchResult[] = [];

    // Try exact match first, then partial
    const candidates = Object.entries(LEI_NUMBER_MAP);
    
    for (const [num, info] of candidates) {
      if (num === normalized || num === justNumber || normalized.includes(num) || num.includes(normalized)) {
        results.push({
          tableName: info.name,
          displayName: info.name,
          articleNumber: `Lei ${raw}`,
          content: info.name,
          route: info.route,
          color: info.color,
        });
      }
    }

    // Also check keyword tags for number-based tags (e.g., "9099", "8213")
    if (results.length === 0) {
      Object.entries(KEYWORD_TAGS).forEach(([, entry]) => {
        const hasMatch = entry.tags.some(tag => {
          const tagNorm = tag.replace(/[\.\-\/\s]/g, '');
          return tagNorm === normalized || tagNorm === justNumber;
        });
        if (hasMatch) {
          results.push({
            tableName: entry.name,
            displayName: entry.name,
            articleNumber: entry.description,
            content: entry.description,
            route: entry.route,
            color: entry.color,
          });
        }
      });
    }

    setSearchResults(results);
    setShowResults(true);
    setIsSearching(false);
  };

  // Função de busca unificada
  const executarBuscaRapida = () => {
    if (searchMode === "palavra") {
      buscarPorPalavraChave();
    } else {
      buscarPorNumeroLei();
    }
  };

  const handleCategoryClick = (card: typeof categoriasPrincipais[0]) => {
    navigate(card.route);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Selecionar imagem baseada na aba ativa
  const currentHeroImage = activeTab === "legislacao" 
    ? heroVadeMecumMenu 
    : heroVadeMecumAtualizacoes;

  const isDesktopView = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <div className="h-dvh bg-background relative overflow-hidden overscroll-contain" style={{ contain: 'layout style' }}>
      {/* Background image - full screen covering everything */}
      <div className="fixed inset-0 z-0">
        <img
          src={heroVadeMecumMenu}
          alt="Vade Mecum"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imagesLoaded.menu ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
          fetchPriority="high"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, hsl(var(--background) / 0.35) 0%, hsl(var(--background) / 0.55) 40%, hsl(var(--background) / 0.8) 100%)`
          }}
        />
      </div>

      <div className="relative z-10 h-full min-h-0 flex flex-col">

        {/* Mobile tabs */}
        <div className="lg:hidden max-w-4xl mx-auto w-full px-4 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-card/80 backdrop-blur-md border border-border/50 h-auto p-1">
              <TabsTrigger 
                value="legislacao" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                <Scale className="w-4 h-4" />
                <span>Legislação</span>
              </TabsTrigger>
              <TabsTrigger 
                value="leis-do-dia" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
              >
                <Calendar className="w-4 h-4" />
                <span>Leis do Dia</span>
              </TabsTrigger>
              <TabsTrigger 
                value="explicacoes" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explicações</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ===== DESKTOP: 3-column layout ===== */}
        <div className="hidden lg:flex flex-1 min-h-0">
          {/* Left column - Explicações / Leitura */}
          <aside className="w-72 xl:w-80 border-r border-white/5 bg-background/40 backdrop-blur-md flex flex-col h-full">
            <div className="p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500/15 rounded-lg">
                  <BookOpen className="w-4 h-4 text-orange-400" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Explicações de Leis</h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <ExplicacoesList />
            </div>
          </aside>

          {/* Center column - Vade Mecum categories */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full px-6 xl:px-8 pb-8 pt-6">
              {/* Desktop header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">Vade Mecum 2026</h1>
                <p className="text-sm text-muted-foreground mt-1">Legislação brasileira completa e atualizada</p>
              </div>

              {/* Barra de busca */}
              <div
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-3 px-4 py-4 bg-card/90 backdrop-blur-sm rounded-2xl cursor-pointer border border-border/30 hover:border-primary/30 transition-colors mb-6 relative overflow-hidden"
              >
                <Search className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Buscar artigo, lei ou código...</span>
              </div>

              {/* Grid principal - 3 colunas no desktop */}
              <div className="grid grid-cols-3 gap-3">
                {categoriasPrincipais.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCategoryClick(card)}
                      className="group bg-card/90 backdrop-blur-sm rounded-2xl border border-border/30 cursor-pointer hover:scale-[1.02] transition-all overflow-hidden h-[120px] p-3 flex flex-col gap-2 text-left relative"
                      style={{
                        boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold text-muted-foreground/70">2026</span>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} shadow-lg`}>
                        <Icon className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-foreground leading-tight tracking-tight whitespace-pre-line">{card.title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{card.description}</p>
                      </div>
                      <ChevronRight className="absolute bottom-2 right-2 w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>

              {/* Brasão decorativo */}
              <div className="mt-8 text-center">
                <img src={brasaoRepublica} alt="Brasão da República" className="w-14 h-14 object-contain mx-auto mb-2 drop-shadow-lg" />
                <p className="text-xs text-foreground/70 max-w-xs mx-auto">
                  Legislação brasileira sempre atualizada
                </p>
              </div>
            </div>
          </div>

          {/* Right column - Leis do Dia in list format */}
          <aside className="w-80 xl:w-96 border-l border-border/30 bg-background/80 backdrop-blur-sm flex flex-col h-full">
            <div className="p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-500/15 rounded-lg">
                  <Calendar className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Leis do Dia</h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ResenhaDiariaCarousel />
            </div>
          </aside>
        </div>

        {/* ===== MOBILE: content area ===== */}
        <div className="flex-1 min-h-0 flex lg:hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Aba Legislação */}
            {activeTab === "legislacao" && (
              <div className="max-w-4xl mx-auto w-full px-4 pb-8 pt-6 relative">
                {/* Hero Background apenas atrás dos cards */}
                <div className="absolute inset-0 -top-20 overflow-hidden rounded-3xl pointer-events-none z-0">
                  <img
                    src={heroVadeMecumMenu}
                    alt="Vade Mecum"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imagesLoaded.menu ? 'opacity-100' : 'opacity-0'}`}
                    loading="eager"
                    fetchPriority="high"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to bottom, hsl(var(--background) / 0.3) 0%, hsl(var(--background) / 0.6) 40%, hsl(var(--background) / 0.85) 70%, hsl(var(--background) / 1) 100%)`
                    }}
                  />
                </div>

                <div className="relative z-10">
                  {/* Barra de busca */}
                  <div
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-3 px-4 py-4 bg-card/90 backdrop-blur-sm rounded-2xl cursor-pointer border border-border/30 hover:border-primary/30 transition-colors mb-4 relative overflow-hidden"
                    style={{ opacity: 0, animation: 'slideDown 0.4s ease-out forwards' } as React.CSSProperties}
                  >
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2] rounded-2xl">
                      <div
                        className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                        style={{ animation: `shinePratique 4s ease-in-out infinite 0.5s` }}
                      />
                    </div>
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground typing-placeholder" />
                  </div>

                  {/* Grid principal - 2 colunas */}
                  <div className="grid grid-cols-2 gap-3">
                    {categoriasPrincipais.map((card, index) => {
                      const Icon = card.icon;
                      return (
                        <button
                          key={card.id}
                          onClick={() => handleCategoryClick(card)}
                          className="group bg-card/90 backdrop-blur-sm rounded-2xl border border-border/30 cursor-pointer active:scale-95 hover:scale-[1.02] transition-all overflow-hidden h-[130px] p-3 flex flex-col gap-2 text-left relative"
                          style={{
                            opacity: 0,
                            animation: `slideDown 0.4s ease-out ${(index + 1) * 0.06}s forwards`,
                            boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)',
                          } as React.CSSProperties}
                        >
                          <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2] rounded-2xl">
                            <div
                              className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.10] to-transparent skew-x-[-20deg]"
                              style={{ animation: `shinePratique 4s ease-in-out infinite ${index * 0.7 + 1}s` }}
                            />
                          </div>
                          <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold text-muted-foreground/70">2026</span>
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} shadow-lg`}>
                            <Icon className="w-5 h-5 text-white drop-shadow-md" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-extrabold text-foreground leading-tight tracking-tight whitespace-pre-line">{card.title}</h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{card.description}</p>
                          </div>
                          <ChevronRight className="absolute bottom-2 right-2 w-5 h-5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Divisória animada */}
                  <div className="relative my-5 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent overflow-hidden">
                      <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary/40 to-transparent" style={{ animation: 'shimmerLine 3s ease-in-out infinite' }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium whitespace-nowrap">Proposições Legislativas</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent overflow-hidden">
                      <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary/40 to-transparent ml-auto" style={{ animation: 'shimmerLine 3s ease-in-out infinite reverse' }} />
                    </div>
                  </div>

                  {/* Proposições - Grid 3 colunas compacto */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {proposicoes.map((card, index) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={card.id}
                          onClick={() => navigate(card.route)}
                          className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/30 cursor-pointer active:scale-95 hover:scale-[1.02] transition-all group overflow-hidden relative"
                          style={{
                            opacity: 0,
                            animation: `slideDown 0.4s ease-out ${(index + categoriasPrincipais.length + 1) * 0.06}s forwards`,
                          } as React.CSSProperties}
                        >
                          <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2] rounded-2xl">
                            <div
                              className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.10] to-transparent skew-x-[-20deg]"
                              style={{ animation: `shinePratique 4s ease-in-out infinite ${(index + categoriasPrincipais.length) * 0.7 + 1}s` }}
                            />
                          </div>
                          <div className="px-2.5 py-3.5 flex flex-col items-center gap-2 text-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xs font-bold text-foreground leading-tight">{card.title}</h3>
                            <p className="text-[10px] text-muted-foreground leading-tight">{card.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Brasão decorativo */}
                  <div className="mt-8 text-center" style={{ opacity: 0, animation: 'slideDown 0.5s ease-out 0.6s forwards' }}>
                    <img src={brasaoRepublica} alt="Brasão da República" className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-lg" />
                    <p className="text-xs text-foreground/70 max-w-xs mx-auto">
                      Legislação brasileira sempre atualizada
                    </p>
                    <p className="text-[10px] text-muted-foreground max-w-xs mx-auto mt-1">
                      Constituição, Códigos, Estatutos, Súmulas e Leis Ordinárias comentados e atualizados até 2026
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Aba Leis do Dia (mobile only) */}
            {activeTab === "leis-do-dia" && (
              <div className="max-w-4xl mx-auto w-full px-4 pb-8 pt-6">
                <div className="-mx-4">
                  <ResenhaDiariaCarousel />
                </div>
              </div>
            )}

            {/* Aba Explicações */}
            {activeTab === "explicacoes" && (
              <div className="max-w-4xl mx-auto w-full px-4 pb-8 pt-6">
                <ExplicacoesList />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Painel de Busca - Slide da direita */}
      {searchOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-md ${searchClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={handleCloseSearch}
          />
          {/* Painel */}
          <div 
            className={`absolute top-0 right-0 bottom-0 w-full bg-background flex flex-col overflow-hidden shadow-2xl ${searchClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}
          >
            {/* Header com gradiente */}
            <div className="relative bg-gradient-to-b from-rose-900/20 to-transparent">
              <div className="flex items-center gap-3 px-4 pt-5 pb-4">
                <Button
                  onClick={handleCloseSearch}
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full bg-card/50 hover:bg-card"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">Buscar Legislação</h2>
                  <p className="text-xs text-muted-foreground">Encontre artigos e leis rapidamente</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Search className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>

            {/* Toggle Palavra-chave / Lei */}
            <div className="flex mx-4 mt-2 mb-4 bg-card/80 rounded-xl p-1 border border-border/30">
              <button
                onClick={() => { setSearchMode("palavra"); setSearchQuery(""); setShowResults(false); }}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${searchMode === "palavra" ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Search className="w-4 h-4" />
                Palavra-chave
              </button>
              <button
                onClick={() => { setSearchMode("lei"); setSearchQuery(""); setShowResults(false); }}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${searchMode === "lei" ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-muted-foreground hover:text-foreground"}`}
              >
                <FileText className="w-4 h-4" />
                Nº da Lei
              </button>
            </div>

            {/* Conteúdo scrollável */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">
              {/* Campo de busca */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder={searchMode === "palavra" ? "Ex: drogas, consumidor, trabalho..." : "Ex: 11.343, 8078, 13.105/2015"}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowResults(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && executarBuscaRapida()}
                  className="h-14 bg-card/90 border-border/30 rounded-xl text-base font-medium pl-5 focus:border-primary/50 focus:ring-primary/20"
                  autoFocus
                />
              </div>

              {/* Dica contextual */}
              {!showResults && searchQuery.length === 0 && (
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {searchMode === "palavra" 
                      ? "💡 Digite palavras-chave como \"drogas\", \"violência doméstica\", \"consumidor\", \"trabalho\" para encontrar a legislação relacionada."
                      : "💡 Digite o número da lei com ou sem pontos. Ex: \"11.343\", \"8078\", \"13105\". O sistema identifica automaticamente."
                    }
                  </p>
                </div>
              )}

              {/* Botão buscar */}
              <Button
                onClick={executarBuscaRapida}
                disabled={!searchQuery.trim() || isSearching}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-base shadow-lg shadow-primary/20"
              >
                {isSearching ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Buscando...</>
                ) : (
                  <><Search className="w-5 h-5 mr-2" /> Buscar {searchMode === "palavra" ? `"${searchQuery || "..."}"` : `Lei ${searchQuery || "..."}`}</>
                )}
              </Button>

              {/* Resultados */}
              {showResults && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchResults.length > 0 ? `${searchResults.length} resultado(s) encontrado(s)` : "Nenhum resultado encontrado"}
                  </p>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-card/80 border border-border/30 flex items-center justify-center mb-4">
                        <FileSearch className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {searchMode === "palavra" ? `"${searchQuery}"` : `Lei ${searchQuery}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">não encontrado no acervo</p>
                    </div>
                  ) : (
                    searchResults.map((result, index) => (
                      <div
                        key={`${result.route}-${index}`}
                        onClick={() => navigate(result.route)}
                        className="rounded-2xl p-4 border cursor-pointer transition-all group hover:scale-[1.01] active:scale-[0.98] overflow-hidden relative"
                        style={{ 
                          backgroundColor: `${result.color}12`,
                          borderColor: `${result.color}35`,
                          opacity: 0, 
                          animation: `slideDown 0.3s ease-out ${index * 0.08}s forwards` 
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                            style={{ 
                              background: `linear-gradient(135deg, ${result.color}, ${result.color}cc)`,
                            }}
                          >
                            <Scale className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-foreground leading-tight">{result.displayName}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{result.content}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px) translateZ(0); }
          to { opacity: 1; transform: translateY(0) translateZ(0); }
        }
        @keyframes shimmerLine {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default VadeMecumTodas;
