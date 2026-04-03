import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_PHONE = '5511991897603';

// Mapas de leitura amigável
const perfilMap: Record<string, string> = {
  faculdade: '🎓 Faculdade de Direito',
  oab: '⚖️ OAB',
  universitario: '🎓 Universitário',
  concurseiro: '🎯 Concurseiro',
  advogado: '💼 Advogado',
};

const semestrelMap: Record<string, string> = {
  '1': '1º semestre', '2': '2º semestre', '3': '3º semestre',
  '4': '4º semestre', '5': '5º semestre', '6': '6º semestre',
  '7': '7º semestre', '8': '8º semestre', '9': '9º semestre',
  '10': '10º semestre', 'pretendo-cursar': 'Pretende cursar',
};

const faseOabMap: Record<string, string> = {
  '1a-fase': '1ª Fase',
  '2a-fase': '2ª Fase',
};

const dificuldadeMap: Record<string, string> = {
  'sem-material': 'Sem material de estudo',
  'material-desatualizado': 'Material desatualizado',
  'sem-plano': 'Sem plano de estudo',
  'nao-consigo-focar': 'Não consigo focar',
  'sem-simulados': 'Sem simulados práticos',
  'sem-material-atualizado': 'Sem material atualizado',
  'sem-revisao': 'Sem revisão eficiente',
};

const faixaEtariaMap: Record<string, string> = {
  '18-25': '18–25 anos',
  '26-35': '26–35 anos',
  '36+': '36 anos ou mais',
};

// Mapa de funcionalidades para análise comportamental
const funcionalidadeKeywords: Record<string, string[]> = {
  'legislação': ['/vade-mecum', '/constituicao', '/codigos', '/estatutos'],
  'revisão por flashcards': ['/flashcards'],
  'questões e simulados': ['/ferramentas/questoes', '/oab-trilhas'],
  'estudo por resumos': ['/resumos-juridicos'],
  'videoaulas': ['/videoaulas'],
  'bibliotecas': ['/bibliotecas'],
  'preparação OAB': ['/oab-trilhas'],
};

function gerarAnalise(topFuncionalidades: { page_path: string; page_title: string; count: number }[]): string {
  if (!topFuncionalidades || topFuncionalidades.length === 0) {
    return 'Usuário novo, sem dados de uso suficientes para análise.';
  }

  const paths = topFuncionalidades.map(f => f.page_path);
  const focos: string[] = [];

  // Detectar focos baseado nas funcionalidades mais acessadas
  if (paths.some(p => ['/vade-mecum', '/constituicao', '/codigos', '/estatutos'].some(k => p.includes(k)))) {
    focos.push('estudo de legislação');
  }
  if (paths.some(p => p.includes('/flashcards'))) {
    focos.push('revisão por flashcards');
  }
  if (paths.some(p => p.includes('/questoes') || p.includes('/oab-trilhas'))) {
    focos.push('prática com questões');
  }
  if (paths.some(p => p.includes('/resumos'))) {
    focos.push('estudo por resumos');
  }
  if (paths.some(p => p.includes('/videoaulas'))) {
    focos.push('videoaulas');
  }
  if (paths.some(p => p.includes('/bibliotecas'))) {
    focos.push('leitura de livros');
  }

  // Detectar perfil
  let perfil = '';
  if (paths.some(p => p.includes('/oab'))) {
    perfil = 'Perfil de candidato OAB.';
  } else if (paths.some(p => p.includes('/advogado'))) {
    perfil = 'Perfil de advogado em atuação.';
  } else {
    perfil = 'Perfil de estudante de Direito.';
  }

  const totalAcessos = topFuncionalidades.reduce((sum, f) => sum + f.count, 0);
  const frequencia = totalAcessos > 50 ? 'alta frequência de uso' : totalAcessos > 20 ? 'uso moderado' : 'uso inicial';

  const focosTexto = focos.length > 0 ? `Focado em ${focos.join(' e ')}` : 'Explorando diversas funcionalidades';

  return `${focosTexto}, ${frequencia}. ${perfil}`;
}

function formatarTempoConversao(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    const horasRestantes = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${diffDays} dia${diffDays > 1 ? 's' : ''}${horasRestantes > 0 ? ` e ${horasRestantes}h` : ''}`;
  } else if (diffHours > 0) {
    const minutosRestantes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours} hora${diffHours > 1 ? 's' : ''}${minutosRestantes > 0 ? ` e ${minutosRestantes}min` : ''}`;
  }
  return `${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, dados } = await req.json();
    console.log('Notificação admin:', tipo, dados);

    if (!tipo || !dados) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: tipo, dados' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'direitopremium';

    if (!evolutionUrl || !evolutionKey) {
      throw new Error('Evolution API não configurada');
    }

    let mensagem = '';

    // ── Helper para formatar dispositivo ────────────────────────────────────
    const formatarDispositivo = (dispositivo?: string, device_info?: Record<string, string>) => {
      if (device_info && typeof device_info === 'object') {
        const os = device_info.os || '';
        const model = device_info.device_name || device_info.model || '';
        const osLower = os.toLowerCase();
        const osEmoji = osLower.includes('ios') || osLower.includes('ipad') ? '🍎'
          : osLower.includes('android') ? '🤖'
          : osLower.includes('windows') ? '🪟'
          : osLower.includes('mac') ? '🍎'
          : '💻';
        return `${osEmoji} ${os}${model ? ' · ' + model : ''}`.trim();
      }
      if (dispositivo) {
        const d = dispositivo.toLowerCase();
        return d.includes('iphone') || d.includes('ios') ? '🍎 iPhone'
          : d.includes('android') ? '🤖 Android'
          : d.includes('windows') || d.includes('mac') || d.includes('desktop') ? '💻 Computador'
          : `📱 ${dispositivo}`;
      }
      return '❓ Desconhecido';
    };

    // ── novo_cadastro_quiz (onboarding novo) ────────────────────────────────
    if (tipo === 'novo_cadastro_quiz') {
      const {
        nome, email,
        perfil, semestre, fase_oab, dificuldade, faixa_etaria,
        created_at, dispositivo, device_info,
      } = dados;

      const dataHora = new Date(created_at || Date.now()).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const dispositivoLabel = formatarDispositivo(dispositivo, device_info);

      let linhaContextual = '';
      if (perfil === 'faculdade' && semestre) {
        linhaContextual = `\n   📚 Semestre: ${semestrelMap[semestre] || semestre}`;
      } else if (perfil === 'oab' && fase_oab) {
        linhaContextual = `\n   📋 Fase OAB: ${faseOabMap[fase_oab] || fase_oab}`;
      }

      mensagem = `📱 *Novo Cadastro no App*

👤 *Nome:* ${nome || 'Não informado'}
📧 *E-mail:* ${email || 'Não informado'}

📋 *Respostas do Quiz:*
   🎓 Perfil: ${perfilMap[perfil] || perfil || '—'}${linhaContextual}
   😓 Maior dificuldade: ${dificuldadeMap[dificuldade] || dificuldade || '—'}
   🎂 Faixa etária: ${faixaEtariaMap[faixa_etaria] || faixa_etaria || '—'}

📲 *Dispositivo:* ${dispositivoLabel}
🕐 *Data/Hora:* ${dataHora}`;

    // ── novo_cadastro (trigger legado — mantido por compatibilidade) ─────────
    } else if (tipo === 'novo_cadastro') {
      const { nome, email, telefone, dispositivo, area, created_at, device_info } = dados;
      const dataHora = new Date(created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const dispositivoLabel = formatarDispositivo(dispositivo, device_info);

      let areaLabel = area ? (perfilMap[area.toLowerCase()] || area) : 'Não informado';

      mensagem = `📱 *Novo Cadastro no App*

👤 *Nome:* ${nome || 'Não informado'}
📧 *E-mail:* ${email}
📞 *Telefone:* ${telefone || 'Não informado'}
🎓 *Perfil:* ${areaLabel}
📲 *Dispositivo:* ${dispositivoLabel}
🕐 *Data/Hora:* ${dataHora}`;

    // ── novo_premium (MENSAGEM RICA) ─────────────────────────────────────────
    } else if (tipo === 'novo_premium') {
      const { userId, nome, email, telefone, plano, valor, payment_method } = dados;
      const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

      const planoLabel: Record<string, string> = {
        mensal: 'Mensal',
        trimestral: 'Trimestral',
        anual: 'Anual',
        vitalicio: 'Vitalício',
      };
      const metodoLabel = payment_method === 'pix' ? 'PIX' : payment_method === 'card' || payment_method === 'credit_card' ? 'Cartão de crédito' : payment_method || 'Não informado';

      // Buscar dados enriquecidos do banco
      let faixaEtaria = '—';
      let tempoConversao = '—';
      let tempoEmTela = 0;
      let topFuncionalidades: { page_path: string; page_title: string; count: number }[] = [];

      if (userId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Buscar faixa etária do quiz
        try {
          const { data: quizData } = await supabase
            .from('onboarding_quiz_respostas')
            .select('faixa_etaria')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (quizData?.faixa_etaria) {
            faixaEtaria = faixaEtariaMap[quizData.faixa_etaria] || quizData.faixa_etaria;
          }
        } catch (e) {
          console.error('Erro ao buscar quiz:', e);
        }

        // Buscar created_at do perfil para tempo de conversão
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', userId)
            .maybeSingle();

          if (profileData?.created_at) {
            tempoConversao = formatarTempoConversao(profileData.created_at);
          }
        } catch (e) {
          console.error('Erro ao buscar profile:', e);
        }

        // Buscar tempo em tela (total de page views)
        try {
          const { count } = await supabase
            .from('page_views')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

          tempoEmTela = count || 0;
        } catch (e) {
          console.error('Erro ao buscar page_views count:', e);
        }

        // Buscar top 5 funcionalidades mais acessadas
        try {
          const { data: pageData } = await supabase
            .from('page_views')
            .select('page_path, page_title')
            .eq('user_id', userId);

          if (pageData && pageData.length > 0) {
            // Agrupar e contar manualmente (supabase JS não tem GROUP BY)
            const counts: Record<string, { title: string; count: number }> = {};
            for (const pv of pageData) {
              const path = pv.page_path;
              if (!path || path === '/') continue; // Ignorar home
              if (!counts[path]) {
                counts[path] = { title: pv.page_title || path, count: 0 };
              }
              counts[path].count++;
            }
            topFuncionalidades = Object.entries(counts)
              .map(([path, data]) => ({ page_path: path, page_title: data.title, count: data.count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);
          }
        } catch (e) {
          console.error('Erro ao buscar top funcionalidades:', e);
        }
      }

      // Montar top 5 funcionalidades
      let topFuncText = '';
      if (topFuncionalidades.length > 0) {
        topFuncText = topFuncionalidades
          .map((f, i) => `${i + 1}. ${f.page_title} (${f.count} acessos)`)
          .join('\n');
      } else {
        topFuncText = 'Sem dados de uso ainda';
      }

      // Gerar análise comportamental
      const analise = gerarAnalise(topFuncionalidades);

      mensagem = `💎💎💎💎💎 *NOVA ASSINATURA!*

👤 *Nome:* ${nome || 'Não informado'}
📧 *E-mail:* ${email || 'Não informado'}
📞 *Telefone:* ${telefone || 'Não informado'}

💰 *Detalhes:*
• Plano: ${planoLabel[plano] || plano}
• Valor: R$ ${valor?.toFixed(2)?.replace('.', ',') || '0,00'}
• Método: ${metodoLabel}
• Data/Hora: ${dataHora}

🎂 *Faixa etária:* ${faixaEtaria}
⏱️ *Tempo até conversão:* ${tempoConversao}
📊 *Tempo em tela:* ${tempoEmTela} visitas

📱 *Top 5 funcionalidades:*
${topFuncText}

💬 *Análise:* ${analise}`;

    } else {
      return new Response(
        JSON.stringify({ error: 'Tipo de notificação desconhecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar via Evolution API
    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: `${ADMIN_PHONE}@s.whatsapp.net`,
        text: mensagem,
      }),
    });

    const result = await response.json();
    console.log('Resultado envio admin:', result);

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao enviar mensagem para admin');
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.key?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro notificação admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
