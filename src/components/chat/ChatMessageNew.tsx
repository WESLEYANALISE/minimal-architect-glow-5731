import { memo, useState, useMemo, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Brain, User, BookOpen, X, HelpCircle, Layers, ChevronDown, Loader2, Copy, Check, Sparkles, GraduationCap, Lightbulb, MessageCircle, FileText, BookMarked, ExternalLink, Scale, Crown, Table, Bot } from "lucide-react";
import ChatComparativoModal from "@/components/ChatComparativoModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { QuadroComparativoVisual, extrairTabelaDoMarkdown } from "@/components/oab/QuadroComparativoVisual";
import { ArtigoPopover } from "@/components/conceitos/ArtigoPopover";
import { useSubscription } from "@/contexts/SubscriptionContext";

// Regex para detectar referências a artigos de lei
const ARTIGO_REGEX = /\b(Art\.?\s*\d+[º°]?(?:[-–]\w+)?(?:\s*,?\s*(?:§|§§|parágrafo|parágrafos?)\s*(?:único|\d+)[º°]?)?(?:\s*,?\s*(?:inciso|incisos?)\s+[IVXLCDM]+(?:\s+e\s+[IVXLCDM]+)?)?(?:\s*,?\s*(?:alínea|alíneas?)\s*["']?[a-z]["']?)?(?:\s+do\s+(?:CP|CC|CPC|CPP|CDC|CLT|CF|ECA|CTN|CTB))?)\b/gi;

interface TermoJuridico {
  termo: string;
  definicao: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  termos?: TermoJuridico[]; // Termos extraídos dinamicamente pela API
  isStreaming?: boolean;
  onTopicClick?: (topic: string) => void;
  isWelcome?: boolean;
}

// Dicionário de termos jurídicos com definições reais
const DICIONARIO_TERMOS: Record<string, string> = {
  // Direito Penal - Geral
  "legítima defesa": "Excludente de ilicitude prevista no Art. 25 do CP. Ocorre quando alguém, usando moderadamente dos meios necessários, repele injusta agressão, atual ou iminente, a direito seu ou de outrem.",
  "iminente": "Que está prestes a acontecer; próximo no tempo. No Direito Penal, refere-se a uma situação de perigo imediato que justifica ação defensiva antes que o dano ocorra.",
  "ilicitude": "Qualidade daquilo que é contrário ao direito; antijuridicidade. É um dos elementos do crime, junto com a tipicidade e a culpabilidade.",
  "excludente": "Causa que afasta ou exclui a responsabilidade penal do agente. As excludentes de ilicitude são: legítima defesa, estado de necessidade, estrito cumprimento do dever legal e exercício regular de direito.",
  "tipicidade": "Adequação da conduta ao tipo penal descrito em lei. É um dos elementos do crime.",
  "culpabilidade": "Juízo de reprovação pessoal sobre o autor do fato típico e ilícito. Exige imputabilidade, potencial consciência da ilicitude e exigibilidade de conduta diversa.",
  "dolo": "Vontade consciente de praticar o crime. O agente quer o resultado ou assume o risco de produzi-lo.",
  "culpa": "Inobservância do dever de cuidado objetivo, manifestada por negligência, imprudência ou imperícia.",
  "crime": "Fato típico, ilícito e culpável. Conduta humana que viola a lei penal.",
  "pena": "Sanção imposta pelo Estado ao autor de uma infração penal. Pode ser privativa de liberdade, restritiva de direitos ou multa.",
  "furto": "Crime previsto no Art. 155 do CP. Consiste em subtrair coisa alheia móvel para si ou para outrem. Pena: reclusão de 1 a 4 anos e multa.",
  "furto qualificado": "Furto praticado com circunstâncias agravantes (Art. 155, §4º CP): destruição de obstáculo, abuso de confiança, mediante fraude, escalada, destreza, chave falsa ou concurso de pessoas. Pena: reclusão de 2 a 8 anos.",
  "roubo": "Crime previsto no Art. 157 do CP. Subtrair coisa móvel alheia mediante grave ameaça ou violência. Pena: reclusão de 4 a 10 anos e multa.",
  "latrocínio": "Roubo seguido de morte (Art. 157, §3º CP). É crime hediondo. Pena: reclusão de 20 a 30 anos.",
  "estelionato": "Crime previsto no Art. 171 do CP. Obter vantagem ilícita mediante artifício, ardil ou qualquer meio fraudulento. Pena: reclusão de 1 a 5 anos e multa.",
  "homicídio": "Crime previsto no Art. 121 do CP. Matar alguém. Pode ser simples, qualificado, privilegiado ou culposo.",
  "lesão corporal": "Crime previsto no Art. 129 do CP. Ofender a integridade corporal ou a saúde de outrem.",
  "responsabilidade civil": "Obrigação de reparar o dano causado a outrem. Pode ser contratual ou extracontratual (aquiliana).",
  "responsabilidade civil objetiva": "Modalidade de responsabilidade civil que independe de culpa do agente. Basta a comprovação do dano e do nexo causal.",
  "responsabilidade civil subjetiva": "Modalidade de responsabilidade civil que exige a comprovação de culpa ou dolo do agente causador do dano.",
  "dano moral": "Lesão aos direitos da personalidade, como honra, imagem, nome e intimidade. Gera direito à indenização.",
  "dano material": "Prejuízo patrimonial sofrido pela vítima. Compreende os danos emergentes e os lucros cessantes.",
  "nexo causal": "Relação de causa e efeito entre a conduta do agente e o dano sofrido pela vítima.",
  "usucapião": "Modo originário de aquisição da propriedade pela posse prolongada do bem.",
  "contraditório": "Princípio constitucional que garante às partes o direito de serem ouvidas.",
  "ampla defesa": "Princípio constitucional que assegura ao acusado todos os meios de defesa.",
  "devido processo legal": "Princípio que garante que ninguém será privado de seus bens ou liberdade sem o devido processo.",
  "presunção de inocência": "Princípio pelo qual ninguém será considerado culpado até o trânsito em julgado.",
  "habeas corpus": "Remédio constitucional que protege a liberdade de locomoção contra ilegalidade ou abuso de poder.",
  "mandado de segurança": "Remédio constitucional que protege direito líquido e certo não amparado por habeas corpus ou habeas data.",
  "cláusula pétrea": "Dispositivo constitucional que não pode ser abolido por emenda constitucional (Art. 60, §4º CF).",
  "controle de constitucionalidade": "Mecanismo de verificação da compatibilidade de leis com a Constituição Federal.",
};

// Extrair termos jurídicos do texto com definições reais
const extractTerms = (content: string): { termo: string; definicao: string }[] => {
  const terms: { termo: string; definicao: string }[] = [];
  const contentLower = content.toLowerCase();
  const foundTerms = new Set<string>();
  
  for (const [termo, definicao] of Object.entries(DICIONARIO_TERMOS)) {
    if (contentLower.includes(termo.toLowerCase()) && !foundTerms.has(termo)) {
      foundTerms.add(termo);
      terms.push({ termo, definicao });
    }
  }
  
  return terms.slice(0, 10);
};

// Extrair tópicos clicáveis (bullet points)
const extractClickableTopics = (content: string): string[] => {
  const topics: string[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-•*]\s+/.test(trimmed)) {
      const topic = trimmed.replace(/^[-•*]\s+/, '').trim();
      if (topic.length > 5 && topic.length < 150) {
        topics.push(topic);
      }
    }
  }
  
  return topics;
};

interface Questao {
  pergunta: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
}

interface Flashcard {
  front: string;
  back: string;
}

export const ChatMessageNew = memo(({ role, content, termos: propTermos, isStreaming, onTopicClick, isWelcome }: ChatMessageProps) => {
  const isUser = role === "user";
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const [activeTab, setActiveTab] = useState<"tecnico" | "termos">("tecnico");
  const [selectedTerm, setSelectedTerm] = useState<{ termo: string; definicao: string } | null>(null);
  const [termDeepening, setTermDeepening] = useState<string | null>(null);
  const [deepeningContent, setDeepeningContent] = useState<string>("");
  const [loadingDeepening, setLoadingDeepening] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Estados para os modais flutuantes
  const [showQuestoes, setShowQuestoes] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [currentQuestaoIndex, setCurrentQuestaoIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingAula, setLoadingAula] = useState(false);
  const [loadingExemplo, setLoadingExemplo] = useState(false);
  const [showComparativo, setShowComparativo] = useState(false);
  const [showExemploModal, setShowExemploModal] = useState(false);
  const [exemploContent, setExemploContent] = useState("");
  
  
  // Formatar conteúdo - SEMPRE aplicar formatação, mesmo durante streaming
  const formattedContent = useMemo(() => {
    if (!content) return '';
    return content
      .replace(/(\n)(##\s)/g, '\n\n$2')
      .replace(/(\n)(\*\*[^*]+\*\*:)/g, '\n\n$2')
      .replace(/(\n)([-•]\s)/g, '\n$2');
  }, [content]);

  // Usar termos da API se disponíveis, senão extrair do conteúdo
  const terms = useMemo(() => {
    if (!isStreaming && propTermos && propTermos.length > 0) {
      return propTermos;
    }
    return !isStreaming ? extractTerms(content) : [];
  }, [content, isStreaming, propTermos]);
  const clickableTopics = useMemo(() => !isStreaming ? extractClickableTopics(content) : [], [content, isStreaming]);

  // Copiar texto formatado
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Texto copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  // Não precisa mais gerar descomplicado - já vem da API

  // Aprofundar termo
  const handleAprofundarTermo = async (termo: string) => {
    setLoadingDeepening(true);
    setTermDeepening(termo);
    try {
      const { data, error } = await supabase.functions.invoke('chat-professora', {
        body: {
          messages: [{ role: 'user', content: `Explique detalhadamente o termo jurídico "${termo}" com:\n1. Definição técnica completa\n2. Fundamento legal (artigos de lei)\n3. Um exemplo prático do dia a dia\n4. Jurisprudência relevante (se houver)\n\nSeja didático e completo.` }],
          mode: 'study',
          linguagemMode: 'tecnico',
          responseLevel: 'complete'
        }
      });
      
      if (error) throw error;
      
      if (data && typeof data === 'string') {
        setDeepeningContent(data);
      }
    } catch (error) {
      console.error('Erro ao aprofundar termo:', error);
      toast.error('Erro ao aprofundar termo');
    } finally {
      setLoadingDeepening(false);
    }
  };

  const [showPremiumCard, setShowPremiumCard] = useState(false);

  const checkPremiumAccess = (featureName: string): boolean => {
    if (!isPremium) {
      setShowPremiumCard(true);
      return false;
    }
    return true;
  };

  // Funções de ação
  const handleAprofundar = () => {
    if (!checkPremiumAccess('Aprofundar')) return;
    if (onTopicClick) {
      onTopicClick(`Aprofunde DETALHADAMENTE o seguinte conteúdo, incluindo doutrina, jurisprudência atualizada, exemplos práticos e análise crítica. Seja extenso e completo (mínimo 2000 palavras):\n\n${content.substring(0, 500)}`);
    }
  };

  const handleGerarQuestoes = async () => {
    if (!checkPremiumAccess('Questões')) return;
    setLoadingQuestoes(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-questoes-chat', {
        body: { conteudo: content }
      });
      
      if (error) throw error;
      
      if (data?.questoes && data.questoes.length > 0) {
        setQuestoes(data.questoes);
        setCurrentQuestaoIndex(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setShowQuestoes(true);
      } else {
        toast.error('Não foi possível gerar questões');
      }
    } catch (error) {
      console.error('Erro ao gerar questões:', error);
      toast.error('Erro ao gerar questões');
    } finally {
      setLoadingQuestoes(false);
    }
  };

  const handleGerarFlashcards = async () => {
    if (!checkPremiumAccess('Flashcards')) return;
    setLoadingFlashcards(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-flashcards', {
        body: { content }
      });
      
      if (error) throw error;
      
      if (data?.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
        setShowFlashcards(true);
      } else {
        toast.error('Não foi possível gerar flashcards');
      }
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
      toast.error('Erro ao gerar flashcards');
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const handleCompartilhar = () => {
    const text = encodeURIComponent(`📚 *Estudando com a Professora*\n\n${content}\n\n_App Direito_`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Gerar PDF ABNT
  const handleGerarPDFABNT = async () => {
    if (!checkPremiumAccess('PDF ABNT')) return;
    setLoadingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('exportar-pdf-abnt', {
        body: { 
          content: content,
          titulo: "Trabalho Acadêmico - Professora Jurídica",
          autor: "Estudante",
          instituicao: "Instituição de Ensino",
          local: "Brasil",
          ano: new Date().getFullYear().toString(),
        }
      });
      
      if (error) throw error;
      
      window.open(data.pdfUrl, '_blank');
      toast.success('PDF ABNT gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  

  // Gerar Exemplo (abre em modal flutuante)
  const handleGerarExemplo = async () => {
    if (!checkPremiumAccess('Exemplo')) return;
    setLoadingExemplo(true);
    setShowExemploModal(true);
    setExemploContent("");
    
    try {
      const tema = content.substring(0, 500).replace(/[#*_\n]/g, ' ').trim();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-professora`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ 
              role: 'user', 
              content: `Crie um EXEMPLO PRÁTICO muito detalhado e completo para o seguinte tema jurídico:\n\n${tema}\n\n⚠️ IMPORTANTE:\n- Crie UMA história completa e detalhada (mínimo 800 palavras)\n- Use personagens com nomes (João, Maria, etc)\n- Descreva a situação do início ao fim\n- Explique CADA passo do que acontece juridicamente\n- Mostre como os artigos de lei se aplicam\n- Indique os prazos, procedimentos e consequências\n- Termine com o desfecho do caso\n\nSeja MUITO detalhado e didático. Conte uma história real que ilustre perfeitamente o tema.` 
            }],
            mode: 'study',
            linguagemMode: 'descomplicado',
            responseLevel: 'complete'
          })
        }
      );
      
      if (!response.ok) throw new Error('Erro');
      
      const result = await response.json();
      const texto = result?.data || result?.content || result?.generatedText || '';
      
      setExemploContent(texto || 'Não foi possível gerar o exemplo.');
    } catch (error) {
      console.error('Erro ao gerar exemplo:', error);
      toast.error('Erro ao gerar exemplo');
      setShowExemploModal(false);
    } finally {
      setLoadingExemplo(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
  };

  const handleNextQuestao = () => {
    if (currentQuestaoIndex < questoes.length - 1) {
      setCurrentQuestaoIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  // Renderizar conteúdo com suporte a tabelas visuais
  const renderContentWithTables = (text: string) => {
    // Verificar se há tabela válida no conteúdo
    const tabelaData = extrairTabelaDoMarkdown(text);
    
    if (tabelaData && tabelaData.cabecalhos.length > 0 && tabelaData.linhas.length > 0) {
      // Separar texto antes e depois da tabela
      const lines = text.split('\n');
      let beforeTable = '';
      let afterTable = '';
      let inTable = false;
      let tableEnded = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        const hasPipes = (trimmed.match(/\|/g) || []).length >= 2;
        
        if (hasPipes) {
          inTable = true;
        } else if (inTable && !hasPipes && trimmed !== '') {
          inTable = false;
          tableEnded = true;
        }
        
        if (!inTable && !tableEnded) {
          beforeTable += line + '\n';
        } else if (tableEnded && !inTable) {
          afterTable += line + '\n';
        }
      }
      
      return (
        <>
          {beforeTable.trim() && renderMarkdownContent(beforeTable)}
          <QuadroComparativoVisual 
            cabecalhos={tabelaData.cabecalhos}
            linhas={tabelaData.linhas}
            titulo="Quadro Comparativo"
          />
          {afterTable.trim() && renderMarkdownContent(afterTable)}
        </>
      );
    }
    
    // Se não tem tabela válida, renderizar como markdown normal
    // mas remover linhas que parecem tabelas malformadas (só ----)
    const cleanedText = text
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        // Remover linhas que são só separadores de tabela
        return !/^[\|\s\-:]+$/.test(trimmed) || trimmed === '';
      })
      .join('\n');
    
    return renderMarkdownContent(cleanedText);
  };

  // Componente de citação legal (Art. X, §, inciso)
  const CitacaoLegal = ({ children }: { children: React.ReactNode }) => (
    <div className="my-4 p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg">
      <div className="flex items-start gap-3">
        <Scale className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-amber-100 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );

  // Componente de exemplo prático
  const ExemploPratico = ({ children }: { children: React.ReactNode }) => (
    <div className="my-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="text-purple-100 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );

  // Detectar se o texto é uma citação legal
  const isLegalCitation = (text: string): boolean => {
    const patterns = [
      /Art\.\s*\d+/i,
      /§\s*\d+/,
      /inciso\s+[IVXLCDM]+/i,
      /alínea\s+[a-z]/i,
      /Lei\s+n[º°]?\s*[\d.]+/i,
      /Código\s+(Civil|Penal|Processo|Tributário)/i,
      /CF\/88/i,
      /Constituição\s+Federal/i,
    ];
    return patterns.some(p => p.test(text));
  };

  // Detectar se o texto é um exemplo prático
  const isPracticalExample = (text: string): boolean => {
    const patterns = [
      /^(Exemplo|Ex\.?|💡|🔍|Caso\s+prático|Na\s+prática)[\s:]/i,
      /^(Imagine|Suponha|Considere|Veja\s+o\s+caso)/i,
    ];
    return patterns.some(p => p.test(text.trim()));
  };

  // Processar texto para substituir referências de artigos por ArtigoPopover clicável
  const processArtigoReferences = (children: ReactNode): ReactNode => {
    if (typeof children !== 'string') {
      // Se for um array de children, processar cada um
      if (Array.isArray(children)) {
        return children.map((child, index) => {
          if (typeof child === 'string') {
            return processArtigoReferencesInString(child, index);
          }
          return child;
        });
      }
      return children;
    }
    return processArtigoReferencesInString(children, 0);
  };

  // Processar string para encontrar referências de artigos
  const processArtigoReferencesInString = (text: string, keyPrefix: number): ReactNode => {
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;
    
    // Reset regex
    ARTIGO_REGEX.lastIndex = 0;
    
    while ((match = ARTIGO_REGEX.exec(text)) !== null) {
      // Adicionar texto antes do match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Adicionar ArtigoPopover
      const artigoRef = match[1];
      parts.push(
        <ArtigoPopover key={`artigo-${keyPrefix}-${key++}`} artigo={artigoRef}>
          {artigoRef}
        </ArtigoPopover>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Adicionar texto restante
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? <>{parts}</> : text;
  };

  // Renderizar conteúdo markdown com suporte a citações e exemplos
  const renderMarkdownContent = (text: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-primary mt-4 mb-2 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-foreground mt-3 mb-1.5">
            {children}
          </h3>
        ),
        p: ({ children }) => {
          const textContent = String(children);
          
          // Verificar se é uma citação legal
          if (isLegalCitation(textContent)) {
            return <CitacaoLegal>{children}</CitacaoLegal>;
          }
          
          // Verificar se é um exemplo prático
          if (isPracticalExample(textContent)) {
            return <ExemploPratico>{children}</ExemploPratico>;
          }
          
          return (
            <p className="mb-3 leading-relaxed">
              {processArtigoReferences(children)}
            </p>
          );
        },
        ul: ({ children }) => (
          <div className="my-3 space-y-2">
            {children}
          </div>
        ),
        li: ({ children }) => {
          const text = String(children).replace(/,$/g, '').trim();
          const isClickable = clickableTopics.some(t => text.includes(t.substring(0, 20)));
          
          if (isClickable && onTopicClick && !isStreaming) {
            return (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onTopicClick(text)}
                className="flex items-start gap-2 w-full text-left p-2.5 rounded-lg bg-primary/5 hover:bg-primary/15 border border-primary/20 transition-all group"
              >
                <span className="text-primary mt-0.5">•</span>
                <span className="text-foreground group-hover:text-primary transition-colors">
                  {processArtigoReferences(children)}
                </span>
              </motion.button>
            );
          }
          
          return (
            <div className="flex items-start gap-2 pl-1">
              <span className="text-primary mt-0.5">•</span>
              <span>{processArtigoReferences(children)}</span>
            </div>
          );
        },
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{processArtigoReferences(children)}</strong>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-4 p-4 bg-muted/50 border-l-4 border-primary/50 rounded-r-lg">
            <div className="italic text-muted-foreground">
              {children}
            </div>
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isInline = !className;
          return isInline ? (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ) : (
            <code className="block bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto my-2">
              {children}
            </code>
          );
        },
        // Não renderizar tabelas no markdown - já renderizamos com QuadroComparativoVisual
        table: () => null,
        thead: () => null,
        tbody: () => null,
        tr: () => null,
        th: () => null,
        td: () => null
      }}
    >
      {text}
    </ReactMarkdown>
  );

  const currentQuestao = questoes[currentQuestaoIndex];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "flex flex-col gap-2.5 p-4 rounded-xl",
          isUser 
            ? "bg-primary/10 ml-12" 
            : "bg-muted/50 mr-4"
        )}
      >
        {/* Avatar e botão copiar - no topo */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
            )}>
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {isUser ? "Você" : "Professora"}
            </span>
          </div>
          
          {/* Botões copiar e compartilhar - só para assistente, não na welcome */}
          {!isUser && !isStreaming && content && !isWelcome && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                title="Copiar"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCompartilhar}
                className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                title="Compartilhar no WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>
          )}
        </motion.div>

        {/* Conteúdo */}
        <div className="pl-0 min-w-0 overflow-hidden">
          {isUser ? (
            <div className="text-[15px] text-foreground break-words leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <>
              {/* Tabs: Técnico, Descomplicado, Termos - não na welcome */}
              {!isStreaming && content && isWelcome ? (
                <div className="text-[15px] leading-[1.7] text-foreground/90">
                  {renderMarkdownContent(formattedContent)}
                </div>
              ) : !isStreaming && content ? (
                <Tabs value={activeTab} onValueChange={(v) => {
                  setActiveTab(v as "tecnico" | "termos");
                }} className="w-full">
                  <TabsList className="h-9 mb-3 bg-background/50 w-full justify-start">
                    <TabsTrigger value="tecnico" className="text-xs gap-1.5 px-3 py-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Técnico
                    </TabsTrigger>
                    <TabsTrigger value="termos" className="text-xs gap-1.5 px-3 py-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Termos ({terms.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Tab Técnico */}
                  <TabsContent value="tecnico" className="mt-0">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[15px] leading-[1.7] text-foreground/90"
                    >
                      {renderContentWithTables(formattedContent)}
                    </motion.div>
                  </TabsContent>
                  
                  {/* Tab Termos */}
                  <TabsContent value="termos" className="mt-0">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-2"
                    >
                      {terms.length > 0 ? (
                        terms.map((term, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-3 bg-background/50 rounded-lg border border-border/50"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-primary mb-1 capitalize">{term.termo}</p>
                                <p className="text-xs text-muted-foreground">{term.definicao}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAprofundarTermo(term.termo)}
                                disabled={loadingDeepening && termDeepening === term.termo}
                                className="h-7 text-xs gap-1 shrink-0"
                              >
                                {loadingDeepening && termDeepening === term.termo ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                Aprofundar
                              </Button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhum termo jurídico identificado</p>
                        </div>
                      )}
                    </motion.div>
                  </TabsContent>
                </Tabs>
              ) : (
                // Durante streaming: renderização com Markdown em tempo real - SEM animação para evitar flickering
                // CORREÇÃO: Usar text-[15px] igual ao modo finalizado para evitar mudança de tamanho
                <div className="text-[15px] leading-[1.7] text-foreground/90">
                  {content ? (
                    isStreaming ? (
                      // Durante streaming: Markdown em tempo real SEM animação de opacidade no container
                      <div className="streaming-markdown prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Parágrafos sem animação durante streaming para evitar flickering
                            p: ({ children }) => (
                              <p className="mb-3">
                                {children}
                              </p>
                            ),
                            // Headers sem animação
                            h1: ({ children }) => (
                              <h1 className="text-lg font-bold mt-4 mb-2 text-primary">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-bold mt-4 mb-2 text-foreground">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-semibold mt-3 mb-2 text-foreground/90">
                                {children}
                              </h3>
                            ),
                            // Listas sem animação
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 mb-3 space-y-1">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-5 mb-3 space-y-1">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="mb-1">
                                {children}
                              </li>
                            ),
                            // Blockquotes com estilo especial
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-amber-500/50 bg-amber-500/10 pl-4 py-2 my-3 italic text-foreground/80">
                                {children}
                              </blockquote>
                            ),
                            // Negrito e ênfase
                            strong: ({ children }) => (
                              <strong className="font-bold text-primary/90">{children}</strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-foreground/80">{children}</em>
                            ),
                            // Código inline
                            code: ({ children }) => (
                              <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono text-primary">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {formattedContent}
                        </ReactMarkdown>
                        <span 
                          className="inline-block w-1.5 h-5 bg-primary/70 ml-0.5 rounded-sm animate-pulse"
                        />
                      </div>
                    ) : (
                      renderMarkdownContent(formattedContent)
                    )
                  ) : null}
                  {isStreaming && !content && (
                    <span 
                      className="inline-block w-1.5 h-5 bg-primary/70 ml-0.5 rounded-sm animate-pulse"
                    />
                  )}
                </div>
              )}

              {/* Botões de ação - 3 por linha, Aprofundar destacado - não na welcome */}
              {!isStreaming && content && !isWelcome && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 pt-3 border-t border-border/30"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {/* Aprofundar - Destacado */}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAprofundar}
                      className="h-9 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium relative"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      Aprofundar
                      {!isPremium && <Crown className="w-3 h-3 text-amber-400 absolute top-1 right-1" />}
                    </Button>
                    
                    {/* Questões */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGerarQuestoes}
                      disabled={loadingQuestoes}
                      className="h-9 text-xs gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 border-0 relative"
                    >
                      {loadingQuestoes ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <HelpCircle className="w-3.5 h-3.5" />
                      )}
                      Questões
                      {!isPremium && <Crown className="w-3 h-3 text-amber-400 absolute top-1 right-1" />}
                    </Button>
                    
                    {/* Flashcards */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGerarFlashcards}
                      disabled={loadingFlashcards}
                      className="h-9 text-xs gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border-0 relative"
                    >
                      {loadingFlashcards ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Layers className="w-3.5 h-3.5" />
                      )}
                      Flashcards
                      {!isPremium && <Crown className="w-3 h-3 text-amber-400 absolute top-1 right-1" />}
                    </Button>
                    
                    {/* Tabela Comparativa */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { if (!checkPremiumAccess('Tabela')) return; setShowComparativo(true); }}
                      className="h-9 text-xs gap-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 border-0 relative"
                    >
                      <Table className="w-3.5 h-3.5" />
                      Tabela
                      {!isPremium && <Crown className="w-3 h-3 text-amber-400 absolute top-1 right-1" />}
                    </Button>
                    
                    {/* Exemplo - Novo */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGerarExemplo}
                      disabled={loadingExemplo}
                      className="h-9 text-xs gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 border-0 relative"
                    >
                      {loadingExemplo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <BookMarked className="w-3.5 h-3.5" />
                      )}
                      Exemplo
                      {!isPremium && <Crown className="w-3 h-3 text-amber-400 absolute top-1 right-1" />}
                    </Button>
                    
                    {/* PDF ABNT - Novo */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGerarPDFABNT}
                      disabled={loadingPDF}
                      className="h-9 text-xs gap-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-600 border-0 relative"
                    >
                      {loadingPDF ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      PDF
                      {!isPremium && <Crown className="w-3 h-3 text-amber-400 absolute top-1 right-1" />}
                    </Button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Modal de aprofundamento de termo */}
      <AnimatePresence>
        {termDeepening && deepeningContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setTermDeepening(null);
              setDeepeningContent("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground capitalize">{termDeepening}</h3>
                </div>
                <button
                  onClick={() => {
                    setTermDeepening(null);
                    setDeepeningContent("");
                  }}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-[15px] leading-relaxed">
                  {renderMarkdownContent(deepeningContent)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal flutuante para Questões */}
      <AnimatePresence>
        {showQuestoes && currentQuestao && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuestoes(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Questão {currentQuestaoIndex + 1}/{questoes.length}</h3>
                </div>
                <button
                  onClick={() => setShowQuestoes(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <p className="text-[15px] font-medium text-foreground leading-relaxed">
                  {currentQuestao.pergunta}
                </p>

                <div className="space-y-2">
                  {currentQuestao.alternativas.map((alt, idx) => {
                    const isCorrect = idx === currentQuestao.resposta_correta;
                    const isSelected = selectedAnswer === idx;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        disabled={selectedAnswer !== null}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all text-sm",
                          selectedAnswer === null && "hover:bg-muted/50 hover:border-primary/50",
                          isSelected && isCorrect && "bg-emerald-500/20 border-emerald-500 text-emerald-600",
                          isSelected && !isCorrect && "bg-red-500/20 border-red-500 text-red-600",
                          !isSelected && selectedAnswer !== null && isCorrect && "bg-emerald-500/10 border-emerald-500/50",
                          !isSelected && selectedAnswer !== null && !isCorrect && "opacity-50"
                        )}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + idx)})</span>
                        {alt}
                      </button>
                    );
                  })}
                </div>

                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-muted/50 rounded-lg"
                  >
                    <p className="text-sm font-medium text-foreground mb-2">💡 Explicação:</p>
                    <p className="text-sm text-muted-foreground">{currentQuestao.explicacao}</p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              {showExplanation && currentQuestaoIndex < questoes.length - 1 && (
                <div className="p-4 border-t border-border">
                  <Button onClick={handleNextQuestao} className="w-full">
                    Próxima Questão
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal flutuante para Flashcards */}
      <AnimatePresence>
        {showFlashcards && flashcards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFlashcards(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Flashcards ({flashcards.length})</h3>
                </div>
                <button
                  onClick={() => setShowFlashcards(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                <FlashcardViewer flashcards={flashcards} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal flutuante para Exemplo Prático */}
      <AnimatePresence>
        {showExemploModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => !loadingExemplo && setShowExemploModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <BookMarked className="w-4 h-4 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Exemplo Prático</h3>
                </div>
                <button
                  onClick={() => setShowExemploModal(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {loadingExemplo ? (
                  <div className="flex items-center justify-center py-12 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    <span className="text-sm text-muted-foreground">Gerando exemplo prático...</span>
                  </div>
                ) : (
                  <div className="text-[15px] leading-relaxed">
                    {renderMarkdownContent(exemploContent)}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Tabela Comparativa */}
      <ChatComparativoModal
        isOpen={showComparativo}
        onClose={() => setShowComparativo(false)}
        content={content}
      />
    </>
  );
});

ChatMessageNew.displayName = "ChatMessageNew";
