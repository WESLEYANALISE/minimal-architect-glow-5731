import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Loader2, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  useEstatisticasGerais,
  useMetricasPremium,
  useOnlineAgoraRealtime,
  useOnline30MinRealtime,
  useCadastrosHoje,
  useCadastrosMes,
  usePaginasPopulares,
  useDistribuicaoDispositivos,
  useDistribuicaoIntencoes,
} from '@/hooks/useAdminControleStats';
import { useEstatisticasProfessora } from '@/hooks/useAdminProfessoraStats';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AdminProfessoraChatProps {
  open: boolean;
  onClose: () => void;
}

const AdminProfessoraChat = ({ open, onClose }: AdminProfessoraChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hooks de métricas
  const { data: statsGerais } = useEstatisticasGerais(7);
  const { data: metricasPremium } = useMetricasPremium(7);
  const { onlineAgora } = useOnlineAgoraRealtime();
  const { online30Min } = useOnline30MinRealtime();
  const { data: cadastrosHoje } = useCadastrosHoje();
  const { data: cadastrosMes } = useCadastrosMes();
  const { data: paginas } = usePaginasPopulares(7);
  const { data: dispositivos } = useDistribuicaoDispositivos();
  const { data: intencoes } = useDistribuicaoIntencoes();
  const { data: statsProfessora } = useEstatisticasProfessora();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildMetricsContext = () => {
    const parts: string[] = [];

    parts.push('=== MÉTRICAS EM TEMPO REAL DO APP ===');
    parts.push(`Data/hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);

    if (statsGerais) {
      parts.push(`\n--- TRÁFEGO (últimos 7 dias) ---`);
      parts.push(`Total de usuários cadastrados: ${statsGerais.totalUsuarios}`);
      parts.push(`Novos no período: ${statsGerais.novosNoPeriodo}`);
      parts.push(`Ativos no período: ${statsGerais.ativosNoPeriodo}`);
      parts.push(`Page views: ${statsGerais.totalPageViews}`);
    }

    parts.push(`\n--- ONLINE ---`);
    parts.push(`Online agora (5min): ${onlineAgora}`);
    parts.push(`Online últimos 30min: ${online30Min}`);

    if (cadastrosHoje !== undefined || cadastrosMes !== undefined) {
      parts.push(`\n--- CADASTROS ---`);
      parts.push(`Cadastros hoje: ${cadastrosHoje ?? 0}`);
      parts.push(`Cadastros no mês: ${cadastrosMes ?? 0}`);
    }

    if (metricasPremium) {
      parts.push(`\n--- PREMIUM / RECEITA ---`);
      parts.push(`Assinantes premium: ${metricasPremium.totalPremium}`);
      parts.push(`Taxa de conversão: ${metricasPremium.taxaConversao?.toFixed(2)}%`);
      parts.push(`Receita total: R$ ${metricasPremium.receitaTotal?.toFixed(2)}`);
      parts.push(`Receita hoje: R$ ${metricasPremium.receitaHoje?.toFixed(2)}`);
      parts.push(`Receita mês atual: R$ ${metricasPremium.receitaMesAtual?.toFixed(2)}`);
      parts.push(`Assinaturas hoje: ${metricasPremium.assinaturasHoje}`);
      parts.push(`Receita mensal (planos mensais): R$ ${metricasPremium.receitaMensal?.toFixed(2)}`);
      parts.push(`Receita anual (planos anuais): R$ ${metricasPremium.receitaAnual?.toFixed(2)}`);
      parts.push(`Receita vitalício: R$ ${metricasPremium.receitaVitalicio?.toFixed(2)}`);
    }

    if (paginas && paginas.length > 0) {
      parts.push(`\n--- PÁGINAS MAIS ACESSADAS (7d) ---`);
      paginas.slice(0, 10).forEach((p: any, i: number) => {
        parts.push(`${i + 1}. ${p.page_path} — ${p.total} views`);
      });
    }

    if (dispositivos) {
      parts.push(`\n--- DISPOSITIVOS ---`);
      Object.entries(dispositivos).forEach(([key, val]) => {
        parts.push(`${key}: ${val} usuários`);
      });
    }

    if (intencoes) {
      parts.push(`\n--- INTENÇÕES DOS USUÁRIOS ---`);
      Object.entries(intencoes).forEach(([key, val]) => {
        parts.push(`${key}: ${val} usuários`);
      });
    }

    if (statsProfessora) {
      parts.push(`\n--- USO DA PROFESSORA (IA) ---`);
      parts.push(`Total de mensagens no chat IA: ${statsProfessora.totalMensagens}`);
      parts.push(`Usuários únicos que usaram: ${statsProfessora.usuariosUnicos}`);
      parts.push(`Média diária de mensagens: ${statsProfessora.mediaDiaria}`);
    }

    return parts.join('\n');
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const metrics = buildMetricsContext();
      const history = messages.map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');

      const systemPrompt = `Você é uma analista de métricas e estrategista de produto de um aplicativo jurídico educacional chamado "Direito Premium". 
Seu nome é Professora. Responda SEMPRE em português do Brasil.
Você tem acesso às métricas em tempo real do app abaixo. Use esses dados para responder com análises, insights e sugestões estratégicas.

REGRAS DE FORMATAÇÃO (OBRIGATÓRIAS):
- Use títulos com ## e ### para criar hierarquia clara
- Use tabelas markdown comparativas sempre que possível (ex: período atual vs anterior, planos, métricas)
- Use listas numeradas para rankings e passos
- Use listas com bullet points para insights
- Use **negrito** para dados numéricos importantes
- Use > blockquote para conclusões e recomendações finais
- Seja objetiva e organize a resposta em seções bem definidas
- Sempre que comparar dados, use uma tabela markdown

${metrics}

${history ? `\n=== HISTÓRICO DA CONVERSA ===\n${history}` : ''}`;

      const fullMessage = `${systemPrompt}\n\nPergunta do admin: ${text}`;

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { message: fullMessage },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data?.response || 'Não consegui gerar uma resposta.',
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Erro no chat:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erro ao processar. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/95 backdrop-blur-lg">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-sm font-bold">Chat Estratégico</h2>
            <p className="text-[10px] text-muted-foreground">Professora • Métricas em tempo real</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <Bot className="w-12 h-12 mx-auto text-primary/40" />
            <p className="text-sm text-muted-foreground">
              Pergunte sobre métricas, estratégias ou análises do app.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              {[
                'Como está o crescimento essa semana?',
                'Analise a taxa de conversão',
                'Quais páginas performam melhor?',
                'Sugira estratégias para aumentar receita',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 border border-border'
            }`}>
              {msg.role === 'assistant' ? (
              <div className="prose prose-invert prose-xs max-w-none prose-p:my-1 prose-p:leading-relaxed prose-p:text-[13px] prose-strong:text-foreground prose-li:text-foreground prose-li:text-[13px] prose-headings:text-foreground prose-h2:text-sm prose-h3:text-[13px] prose-table:text-[12px] prose-th:text-[12px] prose-td:text-[12px] prose-th:px-2 prose-td:px-2 prose-th:py-1 prose-td:py-1 prose-blockquote:text-[13px] prose-blockquote:border-primary/50">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-[13px]">{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-card/95 backdrop-blur-lg p-3">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Pergunte sobre métricas, estratégias..."
            className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="rounded-xl shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfessoraChat;
