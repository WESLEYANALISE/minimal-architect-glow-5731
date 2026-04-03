import { X, Share2, Plus, Minus, Volume2, Pause, Sparkles, ChevronLeft, ChevronRight, Clock, FileText, Lightbulb, BookOpen, BookMarked, AlertCircle, Scale, Loader2, Eye, EyeOff, Star, Highlighter, MoreVertical, Type, StickyNote, Crown, MessageCircle, ExternalLink, Target, GraduationCap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import brasaoRepublica from "@/assets/brasao-republica.png?format=webp&quality=80";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatTextWithUppercase } from "@/lib/textFormatter";
import { ArtigoActionsMenu } from "@/components/ArtigoActionsMenu";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useNarrationPlayer } from "@/contexts/NarrationPlayerContext";
import { Badge } from "@/components/ui/badge";
import JurisprudenciaListaCompacta from "@/components/jurisprudencia/JurisprudenciaListaCompacta";
import JurisprudenciaDrawer from "@/components/jurisprudencia/JurisprudenciaDrawer";
import { useArtigoFavorito } from "@/hooks/useArtigoFavorito";
import { useArtigoGrifos } from "@/hooks/useArtigoGrifos";
import { useArtigoAnotacoes } from "@/hooks/useArtigoAnotacoes";
import { ArticleHighlighter, type MagicGrifo, MAGIC_COLORS } from "@/components/ArticleHighlighter";
import { HighlightColorPicker } from "@/components/HighlightColorPicker";
import { AnotacaoDrawer } from "@/components/vade-mecum/AnotacaoDrawer";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { isNarrationAllowed, getNarrationBlockedMessage, isArticleFeatureAllowed, getFeatureBlockedMessage } from "@/lib/utils/premiumNarration";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { formatNumeroArtigo } from "@/lib/formatNumeroArtigo";
import { sanitizeArticlePrefix } from "@/lib/sanitizeArticlePrefix";
import { getUrlPlanalto } from "@/lib/urlsPlanalto";
import PraticaArtigoModal, { type PraticaTipo } from "@/components/PraticaArtigoModal";
import { EstudarArtigoSheet } from "@/components/vade-mecum/EstudarArtigoSheet";

// Helper: extract Planalto URLs from article text before cleaning
const extractPlanaltoUrl = (text: string | null): string | null => {
  if (!text) return null;
  // Match URLs inside [url] brackets
  const bracketMatch = text.match(/\[(https?:\/\/[^\]]*planalto[^\]]*)\]/);
  if (bracketMatch) return bracketMatch[1];
  // Match raw planalto URLs
  const rawMatch = text.match(/(https?:\/\/[^\s]*planalto[^\s]*)/);
  if (rawMatch) return rawMatch[1];
  return null;
};

// Section info is now passed as a prop from the parent component

// Função para parsear URLs de narração (suporta string simples ou JSON array)
const parseNarracaoUrls = (narracao: string | null): string[] => {
  if (!narracao) return [];
  try {
    const parsed = JSON.parse(narracao);
    return Array.isArray(parsed) ? parsed : [narracao];
  } catch {
    return [narracao];
  }
};

// Mapeamento de codeName para area na tabela RESUMOS_ARTIGOS_LEI
const codeNameToArea: Record<string, string> = {
  "CF/88": "Constituição Federal",
  "Constituição Federal": "Constituição Federal",
  "CF - Constituição Federal": "Constituição Federal",
  "CP": "Código Penal",
  "Código Penal": "Código Penal",
  "CP - Código Penal": "Código Penal",
  "CC": "Código Civil",
  "Código Civil": "Código Civil",
  "CC - Código Civil": "Código Civil",
  "CPC": "Código de Processo Civil",
  "Código de Processo Civil": "Código de Processo Civil",
  "CPC – Código de Processo Civil": "Código de Processo Civil",
  "CPP": "Código de Processo Penal",
  "Código de Processo Penal": "Código de Processo Penal",
  "CPP – Código de Processo Penal": "Código de Processo Penal",
  "CDC": "Código de Defesa do Consumidor",
  "Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
  "CDC – Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
  "CTN": "Código Tributário Nacional",
  "Código Tributário Nacional": "Código Tributário Nacional",
  "CTN – Código Tributário Nacional": "Código Tributário Nacional",
  "CTB": "Código de Trânsito Brasileiro",
  "Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
  "CTB Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
  "CLT": "CLT",
  "CLT - Consolidação das Leis do Trabalho": "CLT",
  "ECA": "ECA",
  "Estatuto da Criança e do Adolescente": "ECA",
  "Estatuto do Idoso": "Estatuto do Idoso",
  "Estatuto da OAB": "Estatuto da OAB",
  "Estatuto da Cidade": "Estatuto da Cidade",
  "Estatuto da Igualdade Racial": "Estatuto da Igualdade Racial",
  "Estatuto da Pessoa com Deficiência": "Estatuto da Pessoa com Deficiência",
  "Estatuto do Desarmamento": "Estatuto do Desarmamento",
  "Estatuto do Torcedor": "Estatuto do Torcedor",
  "Lei Maria da Penha": "Lei Maria da Penha",
  "Lei de Drogas": "Lei de Drogas",
  "Lei de Execução Penal": "Lei de Execução Penal",
  "Lei de Tortura": "Lei de Tortura",
  "Crimes Hediondos": "Crimes Hediondos",
  "Abuso de Autoridade": "Abuso de Autoridade",
  "Interceptação Telefônica": "Interceptação Telefônica",
  "Juizados Especiais": "Juizados Especiais",
  "Lavagem de Dinheiro": "Lavagem de Dinheiro",
  "Organizações Criminosas": "Organizações Criminosas",
  "Código de Minas": "Código de Minas",
  "CDM – Código de Minas": "Código de Minas",
  "CE": "Código Eleitoral",
  "Código Eleitoral": "Código Eleitoral",
  "CE – Código Eleitoral": "Código Eleitoral",
  "CPM": "Código Penal Militar",
  "Código Penal Militar": "Código Penal Militar",
  "CPM – Código Penal Militar": "Código Penal Militar",
  "CPPM": "Código de Processo Penal Militar",
  "Código de Processo Penal Militar": "Código de Processo Penal Militar",
  "CPPM – Código de Processo Penal Militar": "Código de Processo Penal Militar",
  "CA": "Código de Águas",
  "Código de Águas": "Código de Águas",
  "CA - Código de Águas": "Código de Águas",
  "CBA": "Código Brasileiro de Aeronáutica",
  "Código Brasileiro de Aeronáutica": "Código Brasileiro de Aeronáutica",
  "CBA Código Brasileiro de Aeronáutica": "Código Brasileiro de Aeronáutica",
  "CBT": "Código de Telecomunicações",
  "CBT Código Brasileiro de Telecomunicações": "Código de Telecomunicações",
  "CCOM": "Código Comercial",
  "CCOM – Código Comercial": "Código Comercial",
};

// Mapeamento de codeName para nome da tabela no Supabase (para buscar narração fresca)
const codeNameToTableName: Record<string, string> = {
  "CF/88": "CF - Constituição Federal",
  "Constituição Federal": "CF - Constituição Federal",
  "CP": "CP - Código Penal",
  "Código Penal": "CP - Código Penal",
  "CC": "CC - Código Civil",
  "Código Civil": "CC - Código Civil",
  "CPC": "CPC – Código de Processo Civil",
  "Código de Processo Civil": "CPC – Código de Processo Civil",
  "CPP": "CPP – Código de Processo Penal",
  "Código de Processo Penal": "CPP – Código de Processo Penal",
  "CDC": "CDC – Código de Defesa do Consumidor",
  "Código de Defesa do Consumidor": "CDC – Código de Defesa do Consumidor",
  "CTN": "CTN – Código Tributário Nacional",
  "Código Tributário Nacional": "CTN – Código Tributário Nacional",
  "CTB": "CTB Código de Trânsito Brasileiro",
  "Código de Trânsito Brasileiro": "CTB Código de Trânsito Brasileiro",
  "CLT": "CLT - Consolidação das Leis do Trabalho",
  "ECA": "ESTATUTO - ECA",
  "Estatuto da Criança e do Adolescente": "ESTATUTO - ECA",
  "Estatuto do Idoso": "ESTATUTO - IDOSO",
  "Estatuto da OAB": "ESTATUTO - OAB",
  "Estatuto da Cidade": "ESTATUTO - CIDADE",
  "Estatuto da Igualdade Racial": "ESTATUTO - IGUALDADE RACIAL",
  "Estatuto da Pessoa com Deficiência": "ESTATUTO - PESSOA COM DEFICIÊNCIA",
  "Estatuto do Desarmamento": "ESTATUTO - DESARMAMENTO",
  "Estatuto do Torcedor": "ESTATUTO - TORCEDOR",
  "Lei Maria da Penha": "LEI 11340 - MARIA DA PENHA",
  "Lei de Drogas": "LEI 11343 - LEI DE DROGAS",
  "Lei de Execução Penal": "LEI 7210 - LEP",
  "Lei de Tortura": "LEI 9455 - TORTURA",
  "Crimes Hediondos": "LEI 8072 - CRIMES HEDIONDOS",
  "Abuso de Autoridade": "LEI 13869 - ABUSO DE AUTORIDADE",
  "Interceptação Telefônica": "Lei 9.296 de 1996 - Interceptação Telefônica",
  "Juizados Especiais": "LEI 9099 - JUIZADOS CIVEIS",
  "Lavagem de Dinheiro": "Lei 9.613 de 1998 - Lavagem de Dinheiro",
  "Organizações Criminosas": "Lei 12.850 de 2013 - Organizações Criminosas",
  "Código de Minas": "CDM – Código de Minas",
  "CDM – Código de Minas": "CDM – Código de Minas",
  "CE": "CE – Código Eleitoral",
  "Código Eleitoral": "CE – Código Eleitoral",
  "CE – Código Eleitoral": "CE – Código Eleitoral",
  "CPM": "CPM – Código Penal Militar",
  "Código Penal Militar": "CPM – Código Penal Militar",
  "CPM – Código Penal Militar": "CPM – Código Penal Militar",
  "CPPM": "CPPM – Código de Processo Penal Militar",
  "Código de Processo Penal Militar": "CPPM – Código de Processo Penal Militar",
  "CPPM – Código de Processo Penal Militar": "CPPM – Código de Processo Penal Militar",
  "CA": "CA - Código de Águas",
  "Código de Águas": "CA - Código de Águas",
  "CA - Código de Águas": "CA - Código de Águas",
  "CBA": "CBA Código Brasileiro de Aeronáutica",
  "CBA Código Brasileiro de Aeronáutica": "CBA Código Brasileiro de Aeronáutica",
  "CBT": "CBT Código Brasileiro de Telecomunicações",
  "CBT Código Brasileiro de Telecomunicações": "CBT Código Brasileiro de Telecomunicações",
  "CCOM": "CCOM – Código Comercial",
  "CCOM – Código Comercial": "CCOM – Código Comercial",
  "Código Florestal": "CF - Código Florestal",
  "Consolidação das Leis do Trabalho": "CLT - Consolidação das Leis do Trabalho",
  "Código de Caça": "CC - Código de Caça",
  "Código de Pesca": "CP - Código de Pesca",
  "Código de Propriedade Industrial": "CPI - Código de Propriedade Industrial",
  "Código de Defesa do Usuário": "CDUS - Código de Defesa do Usuário",
  "Código Brasileiro de Telecomunicações": "CBT Código Brasileiro de Telecomunicações",
  "Código Brasileiro de Aeronáutica": "CBA Código Brasileiro de Aeronáutica",
  "Lei de Benefícios da Previdência Social": "LEI 8213 - Benefícios",
  "Lei de Custeio da Previdência Social": "LEI 8212 - Custeio",
  "Lei de Improbidade Administrativa": "LEI 8429 - IMPROBIDADE",
  "Lei de Acesso à Informação": "LEI 12527 - ACESSO INFORMACAO",
  "Lei Anticorrupção": "LEI 12846 - ANTICORRUPCAO",
  "Lei de Mediação": "LEI 13140 - MEDIACAO",
  "Lei Geral de Proteção de Dados": "LEI 13709 - LGPD",
  "Lei de Responsabilidade Fiscal": "LC 101 - LRF",
  "Lei de Licitações e Contratos": "LEI 14133 - LICITACOES",
  "Lei da Ação Popular": "LEI 4717 - ACAO POPULAR",
  "Lei de Registros Públicos": "LEI 6015 - REGISTROS PUBLICOS",
  "Lei da Ação Civil Pública": "LEI 7347 - ACAO CIVIL PUBLICA",
  "Lei dos Juizados Especiais": "LEI 9099 - JUIZADOS CIVEIS",
  "Juizados Especiais Cíveis e Criminais": "LEI 9099 - JUIZADOS CIVEIS",
  "Lei da Legislação Tributária": "LEI 9430 - LEGISLACAO TRIBUTARIA",
  "Lei do Processo Administrativo": "LEI 9784 - PROCESSO ADMINISTRATIVO",
  "Lei da ADI e ADC": "LEI 9868 - ADI E ADC",
  "Lei de Crimes Ambientais": "LEI 9605 - Crimes Ambientais",
  "Lei de Recuperação e Falência": "LEI 11101 - Recuperação e Falência",
  "Pacote Anticrime": "Lei 13.964 de 2019 - Pacote Anticrime",
  "Lei de Crimes Democráticos": "Lei 14.197 de 2021 - Crimes Contra o Estado Democrático",
  "Lei de Abuso de Autoridade": "Lei 13.869 de 2019 - Abuso de Autoridade",
  "Estatuto do Servidor Público Federal": "LEI 8112 - SERVIDOR PUBLICO",
  "Lei das Contravenções Penais": "DL 3688 - CONTRAVENCOES PENAIS",
  "Código de Ética do Servidor Público": "DECRETO 1171 - ETICA SERVIDOR",
  "Lei da Previdência Complementar": "LC 109 - PREVIDENCIA COMPLEMENTAR",
};

// Mapeamento de codeName para código do Corpus927
const codeNameToCorpus927: Record<string, string> = {
  // Código Penal
  "CP": "cp-40",
  "cp": "cp-40",
  "Código Penal": "cp-40",
  "CP - Código Penal": "cp-40",
  "CP – Código Penal": "cp-40",
  // Código de Processo Penal
  "CPP": "cpp-41",
  "cpp": "cpp-41",
  "Código de Processo Penal": "cpp-41",
  "CPP - Código de Processo Penal": "cpp-41",
  "CPP – Código de Processo Penal": "cpp-41",
  // Código Civil
  "CC": "cc-02",
  "cc": "cc-02",
  "Código Civil": "cc-02",
  "CC - Código Civil": "cc-02",
  "CC – Código Civil": "cc-02",
  // Código de Processo Civil
  "CPC": "cpc-15",
  "cpc": "cpc-15",
  "Código de Processo Civil": "cpc-15",
  "CPC - Código de Processo Civil": "cpc-15",
  "CPC – Código de Processo Civil": "cpc-15",
  // Código Tributário Nacional
  "CTN": "ctn-66",
  "ctn": "ctn-66",
  "Código Tributário Nacional": "ctn-66",
  "CTN - Código Tributário Nacional": "ctn-66",
  "CTN – Código Tributário Nacional": "ctn-66",
  // Código de Defesa do Consumidor
  "CDC": "cdc-90",
  "cdc": "cdc-90",
  "Código de Defesa do Consumidor": "cdc-90",
  "CDC - Código de Defesa do Consumidor": "cdc-90",
  "CDC – Código de Defesa do Consumidor": "cdc-90",
  // CLT
  "CLT": "clt-43",
  "clt": "clt-43",
  "CLT - Consolidação das Leis do Trabalho": "clt-43",
  "CLT – Consolidação das Leis do Trabalho": "clt-43",
  // Constituição Federal
  "CF/88": "cf-88",
  "cf/88": "cf-88",
  "Constituição Federal": "cf-88",
  "CF - Constituição Federal": "cf-88",
  "CF – Constituição Federal": "cf-88",
};

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
  // Campos de explicação diretamente na tabela do código
  explicacao_resumido?: string | null;
  explicacao_tecnico?: string | null;
  exemplo?: string | null;
  termos?: any | null;
}

interface ResumoData {
  resumo_markdown: string | null;
  exemplos: string | null;
  termos: string | null;
}

interface JurisprudenciaItem {
  tipo: string;
  titulo: string;
  texto: string;
  ementa?: string;
  tese?: string;
  tribunal?: string;
  numero?: string;
  data?: string;
  relator?: string;
  link?: string;
  resumo?: string;
}

interface ArtigoFullscreenDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  codeName: string;
  tableName?: string;
  onPlayComment?: (audioUrl: string, title: string) => void;
  onOpenAula?: (article: Article) => void;
  onOpenExplicacao?: (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => void;
  onGenerateFlashcards?: (artigo: string, numeroArtigo: string) => void;
  onOpenTermos?: (artigo: string, numeroArtigo: string) => void;
  onOpenQuestoes?: (artigo: string, numeroArtigo: string) => void;
  onPerguntar?: (artigo: string, numeroArtigo: string) => void;
  onOpenAulaArtigo?: (artigo: string, numeroArtigo: string) => void;
  loadingFlashcards?: boolean;
  currentAudio?: { url: string; title: string; isComment: boolean };
  stickyPlayerOpen?: boolean;
  onPreviousArticle?: () => void;
  onNextArticle?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  totalArticles?: number;
  skipInitialAnimation?: boolean;
  highlightAlteracao?: { elementoTipo: string; elementoNumero: string | null; tipoAlteracao?: string; leiAlteradora?: string | null; anoAlteracao?: number | null; textoCompleto?: string | null; textoAnterior?: string | null; urlLeiAlteradora?: string | null } | null;
  sectionInfo?: { titulo?: string; subtitulo?: string } | null;
}

export const ArtigoFullscreenDrawer = ({
  isOpen,
  onClose,
  article,
  codeName,
  tableName,
  onPlayComment,
  onOpenAula,
  onOpenExplicacao,
  onGenerateFlashcards,
  onOpenTermos,
  onOpenQuestoes,
  onPerguntar,
  onOpenAulaArtigo,
  loadingFlashcards,
  currentAudio,
  stickyPlayerOpen,
  onPreviousArticle,
  onNextArticle,
  hasPrevious = false,
  hasNext = false,
  totalArticles = 0,
  skipInitialAnimation = false,
  highlightAlteracao = null,
  sectionInfo = null,
}: ArtigoFullscreenDrawerProps) => {
  // Estado para controlar se é a primeira abertura
  const [hasAnimated, setHasAnimated] = useState(skipInitialAnimation);
  
  // Marcar como animado após primeira abertura
  useEffect(() => {
    if (isOpen && !hasAnimated) {
      // Esperar um pouco para garantir que não anima na primeira vez
      setTimeout(() => setHasAnimated(true), 50);
    }
  }, [isOpen, hasAnimated]);
  const [fontSize, setFontSize] = useState(16);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [durations, setDurations] = useState<number[]>([]);
  const [showRecursos, setShowRecursos] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [activeTab, setActiveTab] = useState<string>("artigo");
  const [activeExemploIndex, setActiveExemploIndex] = useState(0);
  const [resumoData, setResumoData] = useState<ResumoData | null>(null);
  const [loadingResumo, setLoadingResumo] = useState(false);
  
  // Estados para Jurisprudência
  const [jurisprudencias, setJurisprudencias] = useState<JurisprudenciaItem[]>([]);
  const [loadingJurisprudencia, setLoadingJurisprudencia] = useState(false);
  const [jurisprudenciaCarregada, setJurisprudenciaCarregada] = useState(false);
  const [etapaBusca, setEtapaBusca] = useState<string>('');
  
  // Estados para drawer de jurisprudência selecionada
  const [jurisprudenciaSelecionada, setJurisprudenciaSelecionada] = useState<JurisprudenciaItem | null>(null);
  const [jurisprudenciaIndex, setJurisprudenciaIndex] = useState(0);
  const [drawerJurisAberto, setDrawerJurisAberto] = useState(false);
  
  // Estado para ocultar/mostrar anotações legais (oculto por padrão)
  const [hideAnnotations, setHideAnnotations] = useState(true);
  
  // Estado para menu flutuante de opções extras
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  
  // Estado para drawer de anotações
  const [anotacaoOpen, setAnotacaoOpen] = useState(false);
  
  // Estado para premium card
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  
  // Estado para prática de artigos
  const [praticaModalOpen, setPraticaModalOpen] = useState(false);
  const [praticaTipo, setPraticaTipo] = useState<PraticaTipo>("flashcard_conceito");
  
  // Estado para sheet Estudar
  const [showEstudar, setShowEstudar] = useState(false);
  
  // Estados para Grifo Mágico (IA)
  const [magicMode, setMagicMode] = useState(false);
  const [magicHighlights, setMagicHighlights] = useState<MagicGrifo[]>([]);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicTooltip, setMagicTooltip] = useState<{ grifo: MagicGrifo; x: number; y: number } | null>(null);
  const [showMagicLegend, setShowMagicLegend] = useState(false);
  
  // Estado para narração atualizada do banco (quando cache está desatualizado)
  const [freshNarracaoUrls, setFreshNarracaoUrls] = useState<string[] | null>(null);
  const [checkingNarracao, setCheckingNarracao] = useState(false);
  
  // Estado para mensagem do premium card
  const [premiumCardMessage, setPremiumCardMessage] = useState<{ title: string; description: string }>({
    title: '',
    description: ''
  });
  
  // Subscription context
  const { isPremium } = useSubscription();

  // Função para dividir exemplos em partes
  const parseExemplos = (exemplos: string | null): string[] => {
    if (!exemplos) return [];
    // Divide por "## Exemplo" mantendo o delimitador
    const parts = exemplos.split(/(?=## Exemplo \d)/i);
    return parts.filter(part => part.trim().length > 0);
  };

  const exemplosArray = resumoData?.exemplos ? parseExemplos(resumoData.exemplos) : [];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const { playNarration, stopNarration } = useNarrationPlayer();

  // Reset audio quando artigo muda
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentIndex(0);
    setActiveTab("artigo");
    setActiveExemploIndex(0);
    setResumoData(null);
    // Resetar jurisprudência quando muda de artigo
    setJurisprudencias([]);
    setJurisprudenciaCarregada(false);
    setEtapaBusca('');
    // Resetar grifo mágico
    setMagicMode(false);
    setMagicHighlights([]);
    setMagicTooltip(null);
    setShowMagicLegend(false);
    // Resetar narração fresca
    setFreshNarracaoUrls(null);
    setCheckingNarracao(false);
  }, [article?.id]);

  // Buscar dados do resumo quando tab mudar para explicação/exemplo/termos
  useEffect(() => {
    const fetchResumoData = async () => {
      if (!article || activeTab === "artigo") return;
      
      const area = codeNameToArea[codeName] || codeName;
      const numeroArtigo = article["Número do Artigo"] || "";
      
      // Normalizar o número do artigo para busca - remover º, ° e espaços
      const numeroLimpo = numeroArtigo.replace(/[°º]/g, "").trim();
      
      setLoadingResumo(true);
      
      try {
        // Tentar primeiro sem o grau
        let { data } = await supabase
          .from("RESUMOS_ARTIGOS_LEI")
          .select("resumo_markdown, exemplos, termos")
          .eq("area", area)
          .eq("tema", numeroLimpo)
          .maybeSingle();
        
        // Se não encontrou, tentar com º (ordinal masculino - formato comum na tabela)
        if (!data) {
          const result = await supabase
            .from("RESUMOS_ARTIGOS_LEI")
            .select("resumo_markdown, exemplos, termos")
            .eq("area", area)
            .eq("tema", numeroLimpo + "º")
            .maybeSingle();
          data = result.data;
        }
        
        // Se não encontrou, tentar com ° (símbolo de grau)
        if (!data) {
          const result = await supabase
            .from("RESUMOS_ARTIGOS_LEI")
            .select("resumo_markdown, exemplos, termos")
            .eq("area", area)
            .eq("tema", numeroLimpo + "°")
            .maybeSingle();
          data = result.data;
        }
        
        // Se ainda não encontrou, tentar com o número original
        if (!data && numeroArtigo !== numeroLimpo) {
          const result = await supabase
            .from("RESUMOS_ARTIGOS_LEI")
            .select("resumo_markdown, exemplos, termos")
            .eq("area", area)
            .eq("tema", numeroArtigo)
            .maybeSingle();
          data = result.data;
        }
        
        setResumoData(data);
      } catch (error) {
        console.error("Erro ao buscar resumo:", error);
        setResumoData(null);
      } finally {
        setLoadingResumo(false);
      }
    };

    fetchResumoData();
  }, [activeTab, article?.id, codeName]);

  // Buscar jurisprudência quando tab mudar para jurisprudencia
  const buscarJurisprudencia = useCallback(async () => {
    if (!article || jurisprudenciaCarregada || loadingJurisprudencia) return;
    
    const numeroArt = article["Número do Artigo"] || "";
    
    // Limpar número do artigo - remover º, ° e espaços extras
    const numeroLimpo = numeroArt.replace(/[°º]/g, "").replace(/\s+/g, " ").trim();
    
    // Obter código do Corpus927 - tentar diferentes variações
    let codigoCorpus = codeNameToCorpus927[codeName];
    
    // Se não encontrou, tentar extrair apenas a sigla (ex: "CP - Código Penal" -> "CP")
    if (!codigoCorpus) {
      const sigla = codeName.split(/\s*[-–]\s*/)[0].trim();
      codigoCorpus = codeNameToCorpus927[sigla];
    }
    
    console.log('Busca jurisprudência:', { codeName, codigoCorpus, numeroLimpo });
    
    setLoadingJurisprudencia(true);
    setEtapaBusca('🔍 Iniciando busca de jurisprudência...');
    
    try {
      setEtapaBusca('📦 Buscando no cache...');
      await new Promise(r => setTimeout(r, 300));
      
      if (codigoCorpus) {
        // Buscar diretamente do cache do Supabase
        const { data: cacheData, error: cacheError } = await supabase
          .from('jurisprudencias_corpus927')
          .select('jurisprudencias')
          .eq('legislacao', codigoCorpus)
          .eq('artigo', numeroLimpo)
          .maybeSingle();
        
        console.log('Cache result:', { cacheData, cacheError });
        
        if (!cacheError && cacheData?.jurisprudencias) {
          setEtapaBusca('📋 Processando resultados...');
          const juris = Array.isArray(cacheData.jurisprudencias) 
            ? (cacheData.jurisprudencias as unknown as JurisprudenciaItem[]) 
            : [];
          setJurisprudencias(juris);
          setEtapaBusca(`✅ ${juris.length} jurisprudência(s) encontrada(s)`);
          setJurisprudenciaCarregada(true);
          setTimeout(() => setEtapaBusca(''), 1500);
          setLoadingJurisprudencia(false);
          return;
        }
      }
      
      // Se não encontrou no cache, tentar pela edge function
      setEtapaBusca('🌐 Conectando à API dos Tribunais...');
      
      const { data, error } = await supabase.functions.invoke('buscar-jurisprudencia-corpus927', {
        body: {
          legislacao: codeName,
          artigo: numeroLimpo,
          forcarAtualizacao: false
        }
      });
      
      if (error) throw error;
      
      setEtapaBusca('📋 Processando resultados...');
      
      if (data?.success && data?.data?.jurisprudencias) {
        setJurisprudencias(data.data.jurisprudencias);
        setEtapaBusca(`✅ ${data.data.jurisprudencias.length} jurisprudência(s) encontrada(s)`);
      } else if (data?.jurisprudencias && Array.isArray(data.jurisprudencias)) {
        setJurisprudencias(data.jurisprudencias);
      } else {
        setJurisprudencias([]);
      }
      
      setJurisprudenciaCarregada(true);
    } catch (error) {
      console.error('Erro ao buscar jurisprudência:', error);
      setEtapaBusca('❌ Erro ao buscar jurisprudência');
      setJurisprudencias([]);
      setJurisprudenciaCarregada(true);
    } finally {
      setLoadingJurisprudencia(false);
      setTimeout(() => setEtapaBusca(''), 1500);
    }
  }, [article, codeName, jurisprudenciaCarregada, loadingJurisprudencia]);

  // Trigger busca quando mudar para tab jurisprudencia
  useEffect(() => {
    if (activeTab === 'jurisprudencia' && !jurisprudenciaCarregada && !loadingJurisprudencia) {
      buscarJurisprudencia();
    }
  }, [activeTab, buscarJurisprudencia, jurisprudenciaCarregada, loadingJurisprudencia]);

  // IMPORTANTE: Os hooks devem ser chamados ANTES de qualquer return condicional
  const numeroArtigo = article?.["Número do Artigo"] || "";
  const conteudoRaw = article?.["Artigo"] || "";
  const conteudo = sanitizeArticlePrefix(conteudoRaw, numeroArtigo);
  const artigoId = article?.id || 0;

  // Hook de favoritos
  const { isFavorito, toggleFavorito, isLoading: isLoadingFavorito } = useArtigoFavorito({
    tabelaCodigo: codeName,
    numeroArtigo: numeroArtigo,
    artigoId: artigoId,
    conteudoPreview: conteudo?.substring(0, 200)
  });

  // Hook de grifos
  const {
    highlights,
    isEditing: isHighlightMode,
    setIsEditing: setIsHighlightMode,
    selectedColor,
    setSelectedColor,
    addHighlight,
    removeHighlightAtPosition,
    clearHighlights
  } = useArtigoGrifos({
    tabelaCodigo: codeName,
    numeroArtigo: numeroArtigo,
    artigoId: artigoId
  });

  // Hook de anotações
  const { hasAnotacao } = useArtigoAnotacoes({
    tabelaCodigo: codeName,
    numeroArtigo: numeroArtigo,
    artigoId: artigoId
  });

  // Hook para tooltip do grifo mágico (deve estar antes de qualquer return condicional)
  const handleMagicTooltip = useCallback((grifo: MagicGrifo, rect: { x: number; y: number }) => {
    setMagicTooltip(prev => prev?.grifo === grifo ? null : { grifo, x: rect.x, y: rect.y });
  }, []);

  // Agora podemos fazer o return condicional
  if (!article) return null;

  const originalNarracaoUrls = parseNarracaoUrls(article["Narração"]);
  // Usar narração fresca se disponível, senão a do cache
  const narracaoUrls = freshNarracaoUrls || originalNarracaoUrls;
  const hasNarracao = narracaoUrls.length > 0;
  
  // Verificar se narração é permitida para este artigo
  const numeroArtigoStr = article["Número do Artigo"] || "";
  const canPlayNarration = isNarrationAllowed(numeroArtigoStr, isPremium, codeName);
  const narrationBlocked = hasNarracao && !canPlayNarration;
  
  // Verificar se recursos do artigo são permitidos (favoritar, grifo, anotações, recursos)
  const canUseArticleFeatures = isArticleFeatureAllowed(numeroArtigoStr, isPremium, codeName);
  
  // Handlers que verificam premium antes de executar ação
  const handleFavoritoClick = () => {
    if (!canUseArticleFeatures) {
      const msg = getFeatureBlockedMessage('favorito');
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return;
    }
    toggleFavorito();
  };
  
  const handleHighlightClick = () => {
    if (!canUseArticleFeatures) {
      const msg = getFeatureBlockedMessage('grifo');
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return;
    }
    setIsHighlightMode(!isHighlightMode);
  };
  
  const handleAnotacaoClick = () => {
    if (!canUseArticleFeatures) {
      const msg = getFeatureBlockedMessage('anotacao');
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return;
    }
    setAnotacaoOpen(true);
  };
  
  const handleRecursosBlockedClick = () => {
    const msg = getFeatureBlockedMessage('recurso');
    setPremiumCardMessage(msg);
    setShowPremiumCard(true);
  };
  
  // Handler para interceptar mudança de tabs premium
  const handleTabChange = (newTab: string) => {
    // Tabs premium: explicação, exemplo, termos
    const premiumTabs = ['explicacao', 'exemplo', 'termos'];
    
    if (premiumTabs.includes(newTab) && !canUseArticleFeatures) {
      // Mostrar PremiumFloatingCard com mensagem específica
      const msg = getFeatureBlockedMessage(newTab as 'explicacao' | 'exemplo' | 'termos');
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return; // Não muda de tab
    }
    
    setActiveTab(newTab);
  };

  const increaseFontSize = () => {
    if (fontSize < 24) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  const handleNarracaoClick = async () => {
    // Verificar se artigo é bloqueado para não-premium (art. 6+)
    if (!canPlayNarration) {
      const msg = getNarrationBlockedMessage();
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return;
    }
    
    if (!hasNarracao) {
      // Tentar buscar narração fresca do banco (pode ter sido gerada após o cache)
      const resolvedTableName = tableName || codeNameToTableName[codeName];
      if (resolvedTableName && article?.id && !checkingNarracao) {
        setCheckingNarracao(true);
        try {
          const { data } = await supabase
            .from(resolvedTableName as any)
            .select('"Narração"')
            .eq('id', article.id)
            .maybeSingle();
          
          const freshUrls = parseNarracaoUrls(data?.["Narração"] || null);
          if (freshUrls.length > 0) {
            setFreshNarracaoUrls(freshUrls);
            setCheckingNarracao(false);
            toast.success("Narração disponível!", { duration: 1500 });
            return;
          }
        } catch (err) {
          console.error("Erro ao verificar narração:", err);
        }
        setCheckingNarracao(false);
      }
      
      toast("Em breve", {
        description: "A narração deste artigo estará disponível em breve",
        icon: <Clock className="w-4 h-4" />,
        duration: 2000,
      });
      return;
    }

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const playCurrentAudio = async () => {
      if (!audioRef.current) {
        audioRef.current = new Audio(narracaoUrls[currentIndex]);
        
        audioRef.current.addEventListener('loadedmetadata', () => {
          setDuration(audioRef.current?.duration || 0);
        });
        
        audioRef.current.addEventListener('timeupdate', () => {
          setCurrentTime(audioRef.current?.currentTime || 0);
        });
        
        audioRef.current.addEventListener('ended', () => {
          // Ir para próximo áudio se houver
          if (currentIndex < narracaoUrls.length - 1) {
            audioRef.current = null;
            setCurrentIndex(prev => prev + 1);
            // Tocar próximo automaticamente
            setTimeout(async () => {
              const nextAudio = new Audio(narracaoUrls[currentIndex + 1]);
              audioRef.current = nextAudio;
              try {
                await playNarration(nextAudio);
              } catch (e) {
                console.error('Erro ao tocar próximo áudio:', e);
              }
            }, 100);
          } else {
            setIsPlaying(false);
            setCurrentTime(0);
            setCurrentIndex(0);
          }
        });
      }

      try {
        // Usar playNarration do contexto para iniciar o áudio de fundo junto
        await playNarration(audioRef.current);
        setIsPlaying(true);
      } catch (e) {
        console.error('Erro ao tocar narração:', e);
      }
    };

    await playCurrentAudio();
  };

  const handlePrevious = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopNarration();
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentIndex(0);
    setSlideDirection('left');
    onPreviousArticle?.();
  };

  const handleNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopNarration();
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentIndex(0);
    setSlideDirection('right');
    onNextArticle?.();
  };

  // Check if navigation is available (circular navigation - always available if more than 1 article)
  const canNavigate = totalArticles > 1;

  // Toggle Grifo Mágico
  const handleToggleMagic = async () => {
    if (magicMode) {
      setMagicMode(false);
      setShowMagicLegend(false);
      setMagicTooltip(null);
      return;
    }

    if (!isPremium) {
      setPremiumCardMessage({ title: 'Grifo Mágico é Premium', description: 'Assine para que a IA destaque automaticamente os trechos mais importantes para concursos.' });
      setShowPremiumCard(true);
      return;
    }

    // If already loaded, just toggle
    if (magicHighlights.length > 0) {
      setMagicMode(true);
      setShowMagicLegend(true);
      return;
    }

    setMagicLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'izspjvegxdfgkgibpyst';
      const response = await supabase.functions.invoke('grifo-magico', {
        body: {
          artigoTexto: conteudo,
          artigoNumero: numeroArtigo,
          leiNome: codeName,
        },
      });

      if (response.error) throw response.error;

      // Handle rate limiting returned as 200 with rateLimited flag
      if (response.data?.rateLimited) {
        toast.error('IA temporariamente ocupada. Tente novamente em alguns segundos.');
        return;
      }

      const grifos = response.data?.grifos || [];
      setMagicHighlights(grifos);
      setMagicMode(true);
      setShowMagicLegend(true);

      if (grifos.length === 0 && !response.data?.error) {
        toast.info('Nenhum trecho importante identificado pela IA neste artigo');
      } else if (response.data?.error) {
        toast.error(response.data.error);
      }
    } catch (error: any) {
      console.error('Erro ao gerar grifo mágico:', error);
      toast.error('Erro ao gerar destaques automáticos');
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className={`h-[95vh] max-h-[95vh] flex flex-col ${skipInitialAnimation && !hasAnimated ? '[&[data-state=open]]:!duration-0 [&[data-state=open]]:!animate-none' : ''}`}>
        {/* Wrapper para centralizar no desktop */}
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
          {/* Header com controles de fonte */}
          <DrawerHeader className="border-b border-border px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg font-bold text-amber-500">
                Art. {formatNumeroArtigo(numeroArtigo)}
              </DrawerTitle>
              <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                {/* Botão de ocultar/mostrar anotações */}
                <button
                  onClick={() => setHideAnnotations(!hideAnnotations)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    !hideAnnotations 
                      ? 'text-sky-400 bg-sky-500/20' 
                      : 'text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10'
                  }`}
                  title={hideAnnotations ? "Revelar anotações legais" : "Ocultar anotações legais"}
                >
                  {hideAnnotations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                
                {/* Botão de Grifo/Destaque */}
                <button
                  onClick={handleHighlightClick}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isHighlightMode 
                      ? 'text-emerald-400 bg-emerald-500/20' 
                      : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                  title={isHighlightMode ? "Sair do modo destaque" : "Modo destaque"}
                >
                  <Highlighter className="w-4 h-4" />
                </button>

                {/* Botão Favoritar (movido do rodapé para o header) */}
                <button
                  onClick={handleFavoritoClick}
                  disabled={isLoadingFavorito}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isFavorito 
                      ? 'text-amber-400 bg-amber-500/20' 
                      : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10'
                  }`}
                  title={isFavorito ? "Remover favorito" : "Favoritar"}
                >
                  <Star className={`w-4 h-4 ${isFavorito ? 'fill-amber-400' : ''}`} />
                </button>
                
                {/* Botão Compartilhar */}
                <button
                  onClick={() => {
                    const linhas = conteudo.split('\n').filter(l => l.trim());
                    let textoFormatado = `⚖️ *${codeName}*\n\n`;
                    textoFormatado += `📌 *Art. ${numeroArtigo}*\n\n`;
                    linhas.forEach(linha => {
                      const trimmed = linha.trim();
                      if (/^[IVXLCDM]+\s*[-–—]/.test(trimmed)) {
                        textoFormatado += `  *${trimmed.split(/[-–—]/)[0].trim()}* - ${trimmed.split(/[-–—]/).slice(1).join('-').trim()}\n\n`;
                      } else if (/^(Parágrafo|§)/.test(trimmed)) {
                        textoFormatado += `\n📎 *${trimmed}*\n\n`;
                      } else if (/^[a-z]\)/.test(trimmed)) {
                        textoFormatado += `    ${trimmed}\n`;
                      } else {
                        textoFormatado += `${trimmed}\n\n`;
                      }
                    });
                    textoFormatado += `━━━━━━━━━━━━━━\n`;
                    textoFormatado += `📱 _Enviado via *Direito Prime*_\n`;
                    textoFormatado += `⭐ _Estudos Jurídicos_`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(textoFormatado)}`, '_blank');
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10"
                  title="Compartilhar no WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                
                {/* Separador */}
                <div className="w-px h-5 bg-border/50 mx-0.5" />
                
                {/* Fechar */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 hover:text-amber-300 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DrawerHeader>

          {/* Botões flutuantes - controle de fonte (esconde no modo destaque) */}
          {!isHighlightMode && (
          <div className="fixed right-3 bottom-28 z-50">
            <div className="flex flex-col items-center gap-2.5">
              {/* FAB Grifo Mágico */}
              {activeTab === 'artigo' && !highlightAlteracao && (
                <button
                  onClick={handleToggleMagic}
                  disabled={magicLoading}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 relative overflow-hidden ${
                    magicMode
                      ? 'bg-amber-300 text-amber-900 shadow-[0_0_14px_rgba(252,211,77,0.6)]'
                      : 'bg-amber-400 text-amber-900 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
                  }`}
                  title={magicMode ? "Desativar Grifo Mágico" : "Grifo Mágico (IA)"}
                >
                  {magicLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {/* Shimmer effect */}
                  <span className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
                    animation: 'shimmer 2.5s ease-in-out infinite',
                  }} />
                </button>
              )}
              
              {/* Controle de Fonte agrupado */}
              <div className="flex flex-col items-center bg-background/90 backdrop-blur-md border border-border/60 rounded-2xl shadow-lg overflow-hidden">
                <button
                  onClick={increaseFontSize}
                  disabled={fontSize >= 24}
                  className="w-11 h-10 flex items-center justify-center text-foreground hover:bg-muted/80 transition-all disabled:opacity-30 active:bg-muted"
                  title="Aumentar fonte"
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                <div className="w-full flex items-center justify-center border-y border-border/40 py-1">
                  <span className="text-[10px] font-bold text-amber-500 tabular-nums">{fontSize}</span>
                </div>
                
                <button
                  onClick={decreaseFontSize}
                  disabled={fontSize <= 12}
                  className="w-11 h-10 flex items-center justify-center text-foreground hover:bg-muted/80 transition-all disabled:opacity-30 active:bg-muted"
                  title="Diminuir fonte"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          )}

        {/* Título/Capítulo da seção acima das tabs */}
        {sectionInfo && (sectionInfo.titulo || sectionInfo.subtitulo) && (
          <div className="px-4 py-2 border-b border-border/30">
            {sectionInfo.titulo && (
              <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">{sectionInfo.titulo}</p>
            )}
            {sectionInfo.subtitulo && (
              <p className="text-[11px] text-muted-foreground italic">{sectionInfo.subtitulo}</p>
            )}
          </div>
        )}

        {/* Tabs de alternância */}
        <div className="border-b border-border/50 px-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className={`w-full h-12 bg-muted/30 p-1 grid gap-1 ${highlightAlteracao ? 'grid-cols-2' : 'grid-cols-4'}`}>
              <TabsTrigger 
                value="artigo" 
                className="text-sm rounded-md data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                Artigo
              </TabsTrigger>
              <TabsTrigger 
                value="explicacao" 
                className="text-sm rounded-md data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                {highlightAlteracao ? 'O que mudou?' : 'Explicação'}
              </TabsTrigger>
              {!highlightAlteracao && (
                <TabsTrigger 
                  value="exemplo" 
                  className="text-sm rounded-md data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  Exemplo
                </TabsTrigger>
              )}
              {!highlightAlteracao && (
                <TabsTrigger 
                  value="termos" 
                  className="text-sm rounded-md data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  Termos
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Conteúdo scrollável - sem animações pesadas */}
        <div className="flex-1 relative overflow-y-auto min-h-0" ref={scrollAreaRef}>
          {/* Brasão como marca d'água fixa */}
          {activeTab === "artigo" && (
            <div className="sticky top-1/2 left-1/2 -translate-y-1/2 w-0 h-0 flex items-center justify-center pointer-events-none z-0">
              <img 
                src={brasaoRepublica} 
                alt="" 
                className="w-80 h-80 object-contain opacity-[0.06]"
                aria-hidden="true"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
            </div>
          )}
          
          <div className="relative z-10">
              <div className="px-4 py-6 pb-28">
                  {/* Tab Artigo */}
                  {activeTab === "artigo" && (
                    <div>
                      {/* Legenda do Grifo Mágico */}
                      <AnimatePresence>
                        {showMagicLegend && magicMode && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 overflow-hidden"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-semibold text-amber-400">Grifo Mágico ativo</span>
                              </div>
                              <button
                                onClick={() => setShowMagicLegend(false)}
                                className="text-amber-400/60 hover:text-amber-400 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                              {Object.entries(MAGIC_COLORS).map(([key, { border, label }]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center gap-1.5 text-[10px] text-foreground/70"
                                >
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: border }} />
                                  {label}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Purple highlight banner for alteração */}
                      {highlightAlteracao && (
                        <div className="mb-4 p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-8 rounded-full bg-purple-500" />
                            <div>
                              <p className="text-xs font-semibold text-purple-400">
                                Alteração destacada
                              </p>
                              <p className="text-[11px] text-purple-300/80">
                                {highlightAlteracao.elementoTipo !== 'artigo' 
                                  ? `${highlightAlteracao.elementoTipo}${highlightAlteracao.elementoNumero ? ` ${highlightAlteracao.elementoNumero}` : ''}`
                                  : 'Artigo inteiro'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Número do artigo inline com o texto */}
                      <div className="article-inline-wrapper" style={{ fontSize: `${fontSize}px`, lineHeight: '1.75' }}>
                        <span className="text-amber-400 font-bold" style={{ fontSize: `${fontSize + 2}px` }}>
                          Art. {formatNumeroArtigo(numeroArtigo)} –{' '}
                        </span>
                        <ArticleHighlighter
                          content={conteudo || "Conteúdo não disponível"}
                          highlights={highlights}
                          isEditing={isHighlightMode}
                          selectedColor={selectedColor}
                          onAddHighlight={addHighlight}
                          onRemoveHighlightAtPosition={removeHighlightAtPosition}
                          onColorChange={setSelectedColor}
                          fontSize={fontSize}
                          hideAnnotations={hideAnnotations}
                          highlightAlteracao={highlightAlteracao}
                          magicHighlights={magicHighlights}
                          magicMode={magicMode}
                          onMagicTooltip={handleMagicTooltip}
                        />
                      </div>
                      {/* Ver no Planalto */}
                      {(() => {
                        const planaltoUrl = extractPlanaltoUrl(conteudo) || getUrlPlanalto(codeName);
                        if (!planaltoUrl) return null;
                        return (
                          <a
                            href={planaltoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                              <Scale className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">Ver no Planalto</p>
                              <p className="text-[11px] text-muted-foreground truncate">planalto.gov.br</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          </a>
                        );
                      })()}
                    </div>
                  )}

                  {/* Tab Explicação */}
                  {activeTab === "explicacao" && (
                    <div style={{ fontSize: `${fontSize}px` }}>
                      {highlightAlteracao?.tipoAlteracao ? (
                        // Modo Novidades: explicar a alteração específica
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-purple-500/15 border border-purple-500/30">
                            <h2 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                              <Sparkles className="w-5 h-5" />
                              O que mudou neste artigo?
                            </h2>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                  {highlightAlteracao.tipoAlteracao}
                                </Badge>
                                {highlightAlteracao.anoAlteracao && (
                                  <span className="text-xs text-purple-300/70">
                                    Ano: {highlightAlteracao.anoAlteracao}
                                  </span>
                                )}
                              </div>
                              {highlightAlteracao.leiAlteradora && (
                                <p className="text-sm text-foreground/80">
                                  <strong className="text-purple-300">Lei responsável:</strong>{' '}
                                  {highlightAlteracao.leiAlteradora}
                                </p>
                              )}
                              <div className="border-t border-purple-500/20 pt-3">
                                <p className="text-sm font-semibold text-purple-300 mb-2">Elemento afetado:</p>
                                <p className="text-sm text-foreground/80">
                                  {highlightAlteracao.elementoTipo !== 'artigo' 
                                    ? `${highlightAlteracao.elementoTipo}${highlightAlteracao.elementoNumero ? ` ${highlightAlteracao.elementoNumero}` : ''}`
                                    : 'Artigo inteiro'
                                  }
                                </p>
                              </div>
                              <div className="border-t border-purple-500/20 pt-3">
                                <p className="text-sm font-semibold text-purple-300 mb-2">Explicação:</p>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                  {highlightAlteracao.tipoAlteracao === 'Revogação' 
                                    ? `Este dispositivo foi revogado${highlightAlteracao.leiAlteradora ? ` pela ${highlightAlteracao.leiAlteradora}` : ''}. Isso significa que ele não está mais em vigor e não produz efeitos jurídicos.`
                                    : highlightAlteracao.tipoAlteracao === 'Inclusão' || highlightAlteracao.tipoAlteracao === 'Acréscimo'
                                    ? `Este dispositivo foi incluído/acrescentado${highlightAlteracao.leiAlteradora ? ` pela ${highlightAlteracao.leiAlteradora}` : ''}${highlightAlteracao.anoAlteracao ? ` em ${highlightAlteracao.anoAlteracao}` : ''}. Trata-se de um texto novo que não existia na versão original da lei.`
                                    : highlightAlteracao.tipoAlteracao === 'Redação'
                                    ? `O texto deste dispositivo foi modificado${highlightAlteracao.leiAlteradora ? ` pela ${highlightAlteracao.leiAlteradora}` : ''}${highlightAlteracao.anoAlteracao ? ` em ${highlightAlteracao.anoAlteracao}` : ''}. A redação atual substitui a versão anterior do texto.`
                                    : `Este dispositivo sofreu uma alteração do tipo "${highlightAlteracao.tipoAlteracao}"${highlightAlteracao.leiAlteradora ? ` pela ${highlightAlteracao.leiAlteradora}` : ''}.`
                                  }
                                </p>
                              </div>
                              {highlightAlteracao.textoCompleto && (
                                <div className="border-t border-purple-500/20 pt-3">
                                  <p className="text-sm font-semibold text-purple-300 mb-2">Texto da alteração:</p>
                                  <p className="text-xs text-foreground/80 leading-relaxed bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                                    {highlightAlteracao.textoCompleto}
                                  </p>
                                </div>
                              )}
                              {highlightAlteracao.textoAnterior && (
                                <div className="border-t border-purple-500/20 pt-3">
                                  <p className="text-sm font-semibold text-purple-300 mb-2">Texto anterior:</p>
                                  <p className="text-xs text-foreground/60 leading-relaxed italic bg-muted/30 p-3 rounded-lg">
                                    {highlightAlteracao.textoAnterior}
                                  </p>
                                </div>
                              )}
                              {highlightAlteracao.urlLeiAlteradora && (
                                <div className="border-t border-purple-500/20 pt-3">
                                  <a
                                    href={highlightAlteracao.urlLeiAlteradora}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 underline decoration-dotted underline-offset-2 transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Ver lei alteradora no Planalto
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : loadingResumo ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                        </div>
                      ) : resumoData?.resumo_markdown ? (
                        <div className="resumo-content space-y-2">
                          {(() => {
                            // Dividir markdown por ## para criar accordion
                            const sections = resumoData.resumo_markdown!.split(/(?=^## )/m).filter(s => s.trim());
                            if (sections.length <= 1) {
                              // Se não tem seções h2, renderizar direto
                              return (
                                <ReactMarkdown
                                  components={{
                                    h1: ({ children }) => <h1 className="text-2xl font-bold text-amber-300 mb-4">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-xl font-bold text-amber-300 mt-6 mb-3">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-lg font-semibold text-amber-300 mt-4 mb-2">{children}</h3>,
                                    p: ({ children }) => <p className="text-foreground/90 leading-relaxed mb-4">{children}</p>,
                                    blockquote: ({ children }) => (
                                      <blockquote className="border-l-4 border-amber-300/50 pl-4 py-2 my-4 bg-amber-300/5 rounded-r-lg italic text-foreground/80">
                                        {children}
                                      </blockquote>
                                    ),
                                    a: ({ href, children }) => (
                                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline underline-offset-2 hover:text-amber-200 inline-flex items-center gap-1">
                                        {children}<ExternalLink className="w-3 h-3 inline" />
                                      </a>
                                    ),
                                    ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 text-foreground/90">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground/90">{children}</ol>,
                                    li: ({ children }) => <li className="text-foreground/90">{children}</li>,
                                    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                                  }}
                                >
                                  {resumoData.resumo_markdown!}
                                </ReactMarkdown>
                              );
                            }
                            // Renderizar como accordion
                            return (
                              <Accordion type="multiple" className="w-full space-y-2">
                                {sections.map((section, idx) => {
                                  const titleMatch = section.match(/^## (.+)/m);
                                  const title = titleMatch ? titleMatch[1].trim() : `Seção ${idx + 1}`;
                                  const content = titleMatch ? section.replace(/^## .+\n?/, '').trim() : section.trim();
                                  return (
                                    <AccordionItem key={idx} value={`exp-${idx}`} className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
                                      <AccordionTrigger className="px-4 py-3 text-left hover:no-underline hover:bg-muted/30">
                                        <span className="text-sm font-semibold text-amber-300">{title}</span>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pb-4">
                                        <ReactMarkdown
                                          components={{
                                            h3: ({ children }) => <h3 className="text-base font-semibold text-amber-300 mt-3 mb-2">{children}</h3>,
                                            p: ({ children }) => <p className="text-foreground/90 leading-relaxed mb-3">{children}</p>,
                                            blockquote: ({ children }) => (
                                              <blockquote className="border-l-4 border-amber-300/50 pl-4 py-2 my-3 bg-amber-300/5 rounded-r-lg italic text-foreground/80">
                                                {children}
                                              </blockquote>
                                            ),
                                            a: ({ href, children }) => (
                                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline underline-offset-2 hover:text-amber-200 inline-flex items-center gap-1">
                                                {children}<ExternalLink className="w-3 h-3 inline" />
                                              </a>
                                            ),
                                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-foreground/90">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-foreground/90">{children}</ol>,
                                            li: ({ children }) => <li className="text-foreground/90">{children}</li>,
                                            strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                                            em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                                          }}
                                        >
                                          {content}
                                        </ReactMarkdown>
                                      </AccordionContent>
                                    </AccordionItem>
                                  );
                                })}
                              </Accordion>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-center">Explicação não disponível para este artigo</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Exemplo */}
                  {activeTab === "exemplo" && (
                    <div style={{ fontSize: `${fontSize}px` }}>
                      {loadingResumo ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                        </div>
                      ) : resumoData?.exemplos ? (
                        <div className="resumo-content space-y-2">
                          {(() => {
                            const parts = resumoData.exemplos!.split(/(?=^## )/m).filter(s => s.trim());
                            if (parts.length <= 1) {
                              return (
                                <ReactMarkdown
                                  components={{
                                    h1: ({ children }) => <h1 className="text-2xl font-bold text-amber-300 mb-4">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-xl font-bold text-amber-300 mt-6 mb-3">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-lg font-semibold text-amber-300 mt-4 mb-2">{children}</h3>,
                                    p: ({ children }) => <p className="text-foreground/90 leading-relaxed mb-4">{children}</p>,
                                    a: ({ href, children }) => (
                                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline underline-offset-2 hover:text-amber-200 inline-flex items-center gap-1">
                                        {children}<ExternalLink className="w-3 h-3 inline" />
                                      </a>
                                    ),
                                    ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 text-foreground/90">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground/90">{children}</ol>,
                                    li: ({ children }) => <li className="text-foreground/90">{children}</li>,
                                    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                                  }}
                                >
                                  {resumoData.exemplos!}
                                </ReactMarkdown>
                              );
                            }
                            return (
                              <Accordion type="multiple" className="w-full space-y-2">
                                {parts.map((part, idx) => {
                                  const titleMatch = part.match(/^## (.+)/m);
                                  const title = titleMatch ? titleMatch[1].trim() : `Caso ${idx + 1}`;
                                  const content = titleMatch ? part.replace(/^## .+\n?/, '').trim() : part.trim();
                                  return (
                                    <AccordionItem key={idx} value={`ex-${idx}`} className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
                                      <AccordionTrigger className="px-4 py-3 text-left hover:no-underline hover:bg-muted/30">
                                        <span className="text-sm font-semibold text-amber-300">📋 {title}</span>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pb-4">
                                        <ReactMarkdown
                                          components={{
                                            h3: ({ children }) => <h3 className="text-base font-semibold text-amber-300 mt-3 mb-2">{children}</h3>,
                                            p: ({ children }) => <p className="text-foreground/90 leading-relaxed mb-3">{children}</p>,
                                            a: ({ href, children }) => (
                                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline underline-offset-2 hover:text-amber-200 inline-flex items-center gap-1">
                                                {children}<ExternalLink className="w-3 h-3 inline" />
                                              </a>
                                            ),
                                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-foreground/90">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-foreground/90">{children}</ol>,
                                            li: ({ children }) => <li className="text-foreground/90">{children}</li>,
                                            strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                                          }}
                                        >
                                          {content}
                                        </ReactMarkdown>
                                      </AccordionContent>
                                    </AccordionItem>
                                  );
                                })}
                              </Accordion>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-center">Exemplo não disponível para este artigo</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Termos */}
                  {activeTab === "termos" && (
                    <div style={{ fontSize: `${fontSize}px` }}>
                      {loadingResumo ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                        </div>
                      ) : resumoData?.termos ? (
                        <div className="resumo-content space-y-2">
                          {(() => {
                            const sections = resumoData.termos!.split(/(?=^## )/m).filter(s => s.trim());
                            if (sections.length <= 1) {
                              return (
                                <ReactMarkdown
                                  components={{
                                    h1: ({ children }) => <h1 className="text-2xl font-bold text-amber-300 mb-4">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-xl font-bold text-amber-300 mt-6 mb-3">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-lg font-semibold text-amber-300 mt-4 mb-2">{children}</h3>,
                                    p: ({ children }) => <p className="text-foreground/90 leading-relaxed mb-4">{children}</p>,
                                    a: ({ href, children }) => (
                                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline underline-offset-2 hover:text-amber-200 inline-flex items-center gap-1">
                                        {children}<ExternalLink className="w-3 h-3 inline" />
                                      </a>
                                    ),
                                    ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 text-foreground/90">{children}</ul>,
                                    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                                  }}
                                >
                                  {resumoData.termos!}
                                </ReactMarkdown>
                              );
                            }
                            return (
                              <Accordion type="multiple" className="w-full space-y-2">
                                {sections.map((section, idx) => {
                                  const titleMatch = section.match(/^## (.+)/m);
                                  const title = titleMatch ? titleMatch[1].trim() : `Termo ${idx + 1}`;
                                  const content = titleMatch ? section.replace(/^## .+\n?/, '').trim() : section.trim();
                                  return (
                                    <AccordionItem key={idx} value={`term-${idx}`} className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
                                      <AccordionTrigger className="px-4 py-3 text-left hover:no-underline hover:bg-muted/30">
                                        <span className="text-sm font-semibold text-amber-300">📖 {title}</span>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pb-4">
                                        <ReactMarkdown
                                          components={{
                                            h3: ({ children }) => <h3 className="text-base font-semibold text-amber-300 mt-3 mb-2">{children}</h3>,
                                            p: ({ children }) => <p className="text-foreground/90 leading-relaxed mb-3">{children}</p>,
                                            a: ({ href, children }) => (
                                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline underline-offset-2 hover:text-amber-200 inline-flex items-center gap-1">
                                                {children}<ExternalLink className="w-3 h-3 inline" />
                                              </a>
                                            ),
                                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-foreground/90">{children}</ul>,
                                            strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                                          }}
                                        >
                                          {content}
                                        </ReactMarkdown>
                                      </AccordionContent>
                                    </AccordionItem>
                                  );
                                })}
                              </Accordion>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <BookMarked className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-center">Termos não disponíveis para este artigo</p>
                        </div>
                      )}
                    </div>
                  )}
              </div>
          </div>
        </div>

        {/* Rodapé fixo estilo BottomNav - esconde no modo destaque */}
        {activeTab === 'artigo' && !highlightAlteracao && !isHighlightMode && (
        <div className="flex-shrink-0 border-t border-amber-900/30 bg-gradient-to-t from-amber-950/95 via-amber-950/80 to-amber-950/70 backdrop-blur-md px-2 py-2 pb-6 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.6),0_-2px_10px_rgba(0,0,0,0.4)] safe-area-bottom">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-5 items-end">
              {/* Estudar */}
              <button
                onClick={() => setShowEstudar(true)}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-white/70 hover:text-white hover:bg-white/10"
              >
                <GraduationCap className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">Estudar</span>
              </button>

              {/* Praticar */}
              <button
                onClick={() => setShowRecursos(true)}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-white/70 hover:text-white hover:bg-white/10"
              >
                <Target className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">Praticar</span>
              </button>

              {/* Narração - Botão central elevado */}
              <div className="flex flex-col items-center -mt-6">
                <button
                  onClick={handleNarracaoClick}
                  className="btn-shine relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-[0_6px_20px_rgba(245,158,11,0.5)] hover:shadow-[0_10px_30px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-90 transition-all duration-300 flex items-center justify-center overflow-hidden"
                >
                  {isPlaying && duration > 0 && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary-foreground/20" />
                      <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="3"
                        strokeDasharray={`${2 * Math.PI * 26}`}
                        strokeDashoffset={`${2 * Math.PI * 26 * (1 - currentTime / duration)}`}
                        className="text-primary-foreground transition-all duration-200" strokeLinecap="round"
                      />
                    </svg>
                  )}
                  {isPlaying ? (
                    <Pause className="w-7 h-7 text-primary-foreground relative z-10" />
                  ) : (
                    <Volume2 className="w-7 h-7 text-primary-foreground relative z-10" />
                  )}
                </button>
                <span className="text-[10px] font-medium text-white mt-1">
                  {isPlaying && narracaoUrls.length > 1 ? `${currentIndex + 1}/${narracaoUrls.length}` : 'Narração'}
                </span>
              </div>

              {/* Anotações */}
              <button
                onClick={handleAnotacaoClick}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all ${
                  hasAnotacao
                    ? 'text-white bg-white/15 ring-1 ring-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <StickyNote className={`w-5 h-5 transition-transform ${hasAnotacao ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-medium leading-tight">Anotações</span>
              </button>

              {/* Perguntar */}
              <button
                onClick={() => onPerguntar?.(conteudo, numeroArtigo)}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-white/70 hover:text-white hover:bg-white/10"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">Perguntar</span>
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Dialog de Recursos (ArtigoActionsMenu) */}
        <AnimatePresence>
          {showRecursos && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, pointerEvents: "auto" as any }}
              exit={{ opacity: 0, pointerEvents: "none" as any }}
              className="fixed inset-0 z-[55] flex items-end justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowRecursos(false)}
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg bg-card rounded-t-2xl p-4 pb-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Praticar</h3>
                  <Button
                    onClick={() => setShowRecursos(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <ArtigoActionsMenu
                  article={article}
                  codigoNome={codeName}
                  onOpenAulaArtigo={() => {
                    setShowRecursos(false);
                    onOpenAulaArtigo?.(conteudo, numeroArtigo);
                  }}
                  onOpenPratica={(tipo) => {
                    setShowRecursos(false);
                    setPraticaTipo(tipo);
                    setPraticaModalOpen(true);
                  }}
                  isEmbedded={true}
                  onShowPremiumCard={() => {
                    setShowRecursos(false);
                    setShowPremiumCard(true);
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div> {/* Fecha wrapper max-w-4xl */}
      </DrawerContent>

      {/* Drawer de Jurisprudência */}
      <JurisprudenciaDrawer
        isOpen={drawerJurisAberto}
        onClose={() => setDrawerJurisAberto(false)}
        item={jurisprudenciaSelecionada}
        currentIndex={jurisprudenciaIndex}
        totalItems={jurisprudencias.length}
        onNavigate={(direction) => {
          if (direction === 'prev' && jurisprudenciaIndex > 0) {
            const newIndex = jurisprudenciaIndex - 1;
            setJurisprudenciaIndex(newIndex);
            setJurisprudenciaSelecionada(jurisprudencias[newIndex]);
          } else if (direction === 'next' && jurisprudenciaIndex < jurisprudencias.length - 1) {
            const newIndex = jurisprudenciaIndex + 1;
            setJurisprudenciaIndex(newIndex);
            setJurisprudenciaSelecionada(jurisprudencias[newIndex]);
          }
        }}
      />

      {/* Barra do modo destaque - apenas instrução + sair + limpar */}
      {isHighlightMode && activeTab === "artigo" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border safe-area-bottom animate-in slide-in-from-bottom duration-200">
          <div className="max-w-md mx-auto p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Highlighter className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">
                Selecione o texto para destacar
              </span>
            </div>
            <div className="flex items-center gap-2">
              {highlights.length > 0 && (
                <button
                  onClick={clearHighlights}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted hover:bg-destructive/20 hover:text-destructive transition-all text-xs font-medium"
                >
                  Limpar
                </button>
              )}
              <button
                onClick={() => setIsHighlightMode(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all text-xs font-semibold"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip do Grifo Mágico — Card centralizado */}
      {magicTooltip && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[79] bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setMagicTooltip(null)}
          />
          {/* Card */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-[80] bg-popover border border-border rounded-2xl shadow-2xl px-5 py-4"
          >
            {/* Close button */}
            <button
              onClick={() => setMagicTooltip(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {/* Category */}
            <div className="flex items-center gap-2 mb-3">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: MAGIC_COLORS[magicTooltip.grifo.cor]?.border }} 
              />
              <span className="uppercase tracking-wider text-[11px] font-semibold text-foreground/70">
                {magicTooltip.grifo.hierarquia || MAGIC_COLORS[magicTooltip.grifo.cor]?.label}
              </span>
            </div>
            {/* Explanation */}
            <p className="text-sm text-foreground/90 leading-relaxed mb-3">
              {magicTooltip.grifo.explicacao}
            </p>
            {/* Original excerpt */}
            <div className="border-t border-border pt-2.5">
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                "{magicTooltip.grifo.trechoExato}"
              </p>
            </div>
          </motion.div>
        </>,
        document.body
      )}

      <AnotacaoDrawer
        open={anotacaoOpen}
        onClose={() => setAnotacaoOpen(false)}
        tabelaCodigo={codeName}
        numeroArtigo={numeroArtigo}
        artigoId={artigoId}
        codeName={codeName}
      />

      {/* Sheet Estudar */}
      <EstudarArtigoSheet
        isOpen={showEstudar}
        onClose={() => setShowEstudar(false)}
        artigo={conteudo}
        numeroArtigo={numeroArtigo}
        codeName={codeName}
        area={codeNameToArea[codeName] || codeName}
      />

      {/* Card Premium para recursos bloqueados - Portal para evitar conflito com Drawer */}
      {showPremiumCard && createPortal(
        <PremiumFloatingCard
          isOpen={showPremiumCard}
          onClose={() => setShowPremiumCard(false)}
          title={premiumCardMessage.title || getNarrationBlockedMessage().title}
          description={premiumCardMessage.description || getNarrationBlockedMessage().description}
          sourceFeature="Artigo - Recurso Premium"
        />,
        document.body
      )}
      {/* Modal de Prática de Artigos */}
      <PraticaArtigoModal
        isOpen={praticaModalOpen}
        onClose={() => setPraticaModalOpen(false)}
        artigo={conteudo}
        numeroArtigo={numeroArtigo}
        codigoTabela={codeName}
        tipo={praticaTipo}
      />
    </Drawer>
  );
};
