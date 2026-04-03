import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos de notificação disponíveis
const TIPOS_NOTIFICACAO = [
  'boletim_diario',
  'leis_dia',
  'atualizacoes_leis',
  'livro_dia',
  'filme_dia',
  'dica_estudo',
  'novidades',
  'noticias_concursos',
  'jurisprudencia',
] as const;

type TipoNotificacao = typeof TIPOS_NOTIFICACAO[number];

// Mapeamento tipo -> coluna na tabela de preferências
const TIPO_COLUNA: Record<TipoNotificacao, string> = {
  boletim_diario: 'receber_boletim_diario',
  leis_dia: 'receber_leis_dia',
  atualizacoes_leis: 'receber_atualizacoes_leis',
  livro_dia: 'receber_livro_dia',
  filme_dia: 'receber_filme_dia',
  dica_estudo: 'receber_dica_estudo',
  novidades: 'receber_novidades',
  noticias_concursos: 'receber_noticias_concursos',
  jurisprudencia: 'receber_jurisprudencia',
};

// Enviar mensagem via Evolution API
async function enviarWhatsApp(telefone: string, mensagem: string): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'evelyn';

  if (!evolutionUrl || !evolutionKey) {
    console.error('[disparar-notificacoes] Evolution API não configurada');
    return false;
  }

  let numero = telefone.replace(/\D/g, '');
  if (!numero.endsWith('@s.whatsapp.net')) {
    numero = `${numero}@s.whatsapp.net`;
  }

  try {
    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({ number: numero, text: mensagem }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[disparar-notificacoes] Erro envio ${telefone}:`, error);
      return false;
    }

    console.log(`[disparar-notificacoes] ✅ Enviado para ${telefone}`);
    return true;
  } catch (error) {
    console.error(`[disparar-notificacoes] Erro envio ${telefone}:`, error);
    return false;
  }
}

// ========== FUNÇÕES DE CONTEÚDO ==========

async function buscarBoletimDiario(supabase: any): Promise<string | null> {
  const hoje = new Date().toISOString().split('T')[0];
  
  const { data: noticias } = await supabase
    .from('noticias_juridicas_cache')
    .select('titulo, descricao, fonte')
    .gte('data_publicacao', hoje)
    .order('data_publicacao', { ascending: false })
    .limit(5);

  if (!noticias || noticias.length === 0) return null;

  let msg = `📰 *Boletim Jurídico - ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
  noticias.forEach((n: any, i: number) => {
    msg += `*${i + 1}. ${n.titulo}*\n`;
    if (n.descricao) msg += `${n.descricao.substring(0, 120)}...\n`;
    if (n.fonte) msg += `📌 _${n.fonte}_\n`;
    msg += '\n';
  });
  msg += `\n💡 _Pergunte sobre qualquer tema!_\n✨ _Evelyn_`;
  return msg;
}

async function buscarLeisDia(supabase: any): Promise<string | null> {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  
  const { data: leis } = await supabase
    .from('resenha_diaria')
    .select('numero_lei, ementa, explicacao_lei, area')
    .eq('status', 'ativo')
    .gte('data_publicacao', ontem.toISOString().split('T')[0])
    .order('data_publicacao', { ascending: false })
    .limit(5);

  if (!leis || leis.length === 0) return null;

  let msg = `⚖️ *Leis do Dia - ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
  leis.forEach((lei: any, i: number) => {
    msg += `*${i + 1}. ${lei.numero_lei}*\n`;
    if (lei.area) msg += `📂 ${lei.area}\n`;
    if (lei.ementa) msg += `${lei.ementa.substring(0, 180)}...\n`;
    if (lei.explicacao_lei) msg += `💡 _${lei.explicacao_lei.substring(0, 120)}..._\n`;
    msg += '\n';
  });
  msg += `📚 _Pergunte sobre qualquer lei!_\n✨ _Evelyn_`;
  return msg;
}

async function buscarAtualizacoesLeis(supabase: any): Promise<string | null> {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  
  const { data: alteracoes } = await supabase
    .from('alteracoes_legislativas')
    .select('lei_alterada, lei_alteradora, resumo, tipo_alteracao')
    .gte('created_at', ontem.toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  if (!alteracoes || alteracoes.length === 0) return null;

  let msg = `🔄 *Atualizações em Leis*\n\n`;
  alteracoes.forEach((alt: any, i: number) => {
    msg += `*${i + 1}. ${alt.lei_alterada}*\n`;
    if (alt.tipo_alteracao) msg += `📌 ${alt.tipo_alteracao}\n`;
    if (alt.lei_alteradora) msg += `📜 Alterada por: ${alt.lei_alteradora}\n`;
    if (alt.resumo) msg += `${alt.resumo.substring(0, 150)}...\n`;
    msg += '\n';
  });
  msg += `✨ _Evelyn_`;
  return msg;
}

async function buscarLivroDia(supabase: any): Promise<string | null> {
  // Buscar livro aleatório da biblioteca de clássicos
  const { data: livros } = await supabase
    .from('BIBLIOTECA-CLASSICOS')
    .select('livro, autor, sobre, imagem, area')
    .not('livro', 'is', null)
    .limit(50);

  if (!livros || livros.length === 0) return null;

  const livro = livros[Math.floor(Math.random() * livros.length)];
  
  let msg = `📚 *Livro do Dia*\n\n`;
  msg += `*${livro.livro}*\n`;
  if (livro.autor) msg += `✍️ ${livro.autor}\n`;
  if (livro.area) msg += `📂 ${livro.area}\n\n`;
  if (livro.sobre) msg += `${livro.sobre.substring(0, 300)}${livro.sobre.length > 300 ? '...' : ''}\n\n`;
  msg += `📖 _Disponível na Biblioteca do app!_\n✨ _Evelyn_`;
  return msg;
}

async function buscarFilmeDia(supabase: any): Promise<string | null> {
  const { data: filmes } = await supabase
    .from('juriflix_titulos')
    .select('nome, ano, nota, sinopse, plataforma, tipo, beneficios')
    .not('nome', 'is', null)
    .limit(50);

  if (!filmes || filmes.length === 0) return null;

  const filme = filmes[Math.floor(Math.random() * filmes.length)];
  
  let msg = `🎬 *Filme do Dia*\n\n`;
  msg += `*${filme.nome}*\n`;
  if (filme.ano) msg += `📅 ${filme.ano}`;
  if (filme.nota) msg += ` | ⭐ ${filme.nota}`;
  msg += '\n';
  if (filme.tipo) msg += `🎭 ${filme.tipo}\n`;
  if (filme.plataforma) msg += `📺 ${filme.plataforma}\n\n`;
  if (filme.sinopse) msg += `${filme.sinopse.substring(0, 250)}...\n\n`;
  if (filme.beneficios) msg += `💡 *Por que assistir:*\n${filme.beneficios.substring(0, 200)}...\n\n`;
  msg += `🍿 _Veja mais no JuriFlix do app!_\n✨ _Evelyn_`;
  return msg;
}

async function buscarDicaEstudo(_supabase: any): Promise<string | null> {
  const dicas = [
    "Use a técnica Pomodoro: 25 min de estudo focado + 5 min de pausa. Após 4 ciclos, faça uma pausa maior de 15-30 min.",
    "Leia artigos de lei em voz alta. A repetição oral ajuda na memorização e fixação do conteúdo.",
    "Faça mapas mentais conectando institutos jurídicos. Visualizar conexões melhora a compreensão.",
    "Resolva questões de concursos diariamente. A prática ativa supera a leitura passiva.",
    "Revise flashcards usando repetição espaçada. O cérebro retém melhor com intervalos crescentes.",
    "Estude com a técnica Feynman: explique o conceito como se fosse para uma criança.",
    "Intercale matérias durante o estudo. Alternar temas melhora a retenção a longo prazo.",
    "Antes de dormir, revise brevemente o que estudou. O sono consolida a memória.",
    "Crie acrônimos e mnemônicos para listas e classificações jurídicas.",
    "Estude jurisprudência junto com a lei seca. A aplicação prática fixa o entendimento.",
  ];

  const dica = dicas[Math.floor(Math.random() * dicas.length)];
  
  let msg = `💡 *Dica de Estudo do Dia*\n\n`;
  msg += `${dica}\n\n`;
  msg += `📚 _Bons estudos!_\n✨ _Evelyn_`;
  return msg;
}

async function buscarNovidades(_supabase: any): Promise<string | null> {
  let msg = `🆕 *Novidades do Direito Premium*\n\n`;
  msg += `Confira as últimas atualizações do app:\n\n`;
  msg += `🤖 Evelyn agora envia notificações personalizadas!\n`;
  msg += `📚 Novas aulas interativas disponíveis\n`;
  msg += `⚖️ Vade Mecum atualizado com as últimas alterações\n`;
  msg += `🎮 Novos jogos de estudo para fixação\n\n`;
  msg += `📲 _Abra o app e confira!_\n✨ _Evelyn_`;
  return msg;
}

async function buscarNoticiasConcursos(supabase: any): Promise<string | null> {
  const { data: concursos } = await supabase
    .from('concursos')
    .select('titulo, orgao, banca, inscricoes_ate, salario, vagas')
    .eq('status', 'aberto')
    .gte('inscricoes_ate', new Date().toISOString().split('T')[0])
    .order('created_at', { ascending: false })
    .limit(5);

  if (!concursos || concursos.length === 0) return null;

  let msg = `🎯 *Concursos em Destaque*\n\n`;
  concursos.forEach((c: any, i: number) => {
    msg += `*${i + 1}. ${c.titulo || c.orgao}*\n`;
    if (c.orgao) msg += `🏛️ ${c.orgao}\n`;
    if (c.banca) msg += `📝 Banca: ${c.banca}\n`;
    if (c.vagas) msg += `👥 Vagas: ${c.vagas}\n`;
    if (c.salario) msg += `💰 ${c.salario}\n`;
    if (c.inscricoes_ate) msg += `📅 Até: ${new Date(c.inscricoes_ate).toLocaleDateString('pt-BR')}\n`;
    msg += '\n';
  });
  msg += `✨ _Evelyn_`;
  return msg;
}

async function buscarJurisprudencia(supabase: any): Promise<string | null> {
  // Buscar jurisprudência recente
  const { data } = await supabase
    .from('aprofundamento_noticias')
    .select('titulo, descricao, instituicao')
    .order('created_at', { ascending: false })
    .limit(3);

  if (!data || data.length === 0) return null;

  let msg = `⚖️ *Jurisprudência em Destaque*\n\n`;
  data.forEach((j: any, i: number) => {
    msg += `*${i + 1}. ${j.titulo}*\n`;
    if (j.instituicao) msg += `🏛️ ${j.instituicao}\n`;
    if (j.descricao) msg += `${j.descricao.substring(0, 150)}...\n`;
    msg += '\n';
  });
  msg += `✨ _Evelyn_`;
  return msg;
}

// Mapeamento tipo -> função de busca
const BUSCADORES: Record<TipoNotificacao, (supabase: any) => Promise<string | null>> = {
  boletim_diario: buscarBoletimDiario,
  leis_dia: buscarLeisDia,
  atualizacoes_leis: buscarAtualizacoesLeis,
  livro_dia: buscarLivroDia,
  filme_dia: buscarFilmeDia,
  dica_estudo: buscarDicaEstudo,
  novidades: buscarNovidades,
  noticias_concursos: buscarNoticiasConcursos,
  jurisprudencia: buscarJurisprudencia,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const tipo: TipoNotificacao = body.tipo;
    const telefones: string[] | undefined = body.telefones; // Para testes admin

    if (!tipo || !TIPOS_NOTIFICACAO.includes(tipo)) {
      return new Response(
        JSON.stringify({ success: false, error: `Tipo inválido. Válidos: ${TIPOS_NOTIFICACAO.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[disparar-notificacoes] Tipo: ${tipo}, Telefones: ${telefones?.length || 'todos'}`);

    // 1. Buscar conteúdo
    const buscador = BUSCADORES[tipo];
    const conteudo = await buscador(supabase);

    if (!conteudo) {
      return new Response(
        JSON.stringify({ success: true, message: `Nenhum conteúdo disponível para ${tipo}`, enviados: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar destinatários
    let destinatarios: string[] = [];

    if (telefones && telefones.length > 0) {
      // Envio manual (admin teste)
      destinatarios = telefones;
    } else {
      // Buscar quem tem a preferência ativa
      const coluna = TIPO_COLUNA[tipo];
      const { data: prefs } = await supabase
        .from('evelyn_preferencias_notificacao')
        .select('telefone')
        .eq('ativo', true)
        .eq(coluna, true);

      if (prefs) {
        destinatarios = prefs.map((p: any) => p.telefone);
      }
    }

    if (destinatarios.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum destinatário encontrado', enviados: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[disparar-notificacoes] ${destinatarios.length} destinatários`);

    // 3. Enviar e registrar log
    let enviados = 0;
    let erros = 0;
    const logs: any[] = [];

    for (const tel of destinatarios) {
      const sucesso = await enviarWhatsApp(tel, conteudo);
      
      logs.push({
        tipo,
        telefone: tel,
        conteudo_resumo: conteudo.substring(0, 200),
        status: sucesso ? 'enviado' : 'erro',
        erro: sucesso ? null : 'Falha no envio',
      });

      if (sucesso) enviados++;
      else erros++;

      // Delay entre envios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Inserir logs em batch
    if (logs.length > 0) {
      await supabase.from('evelyn_notificacoes_log').insert(logs);
    }

    console.log(`[disparar-notificacoes] ✅ ${enviados} enviados, ${erros} erros`);

    return new Response(
      JSON.stringify({ success: true, tipo, enviados, erros, total: destinatarios.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[disparar-notificacoes] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
