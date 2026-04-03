import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de fallback com 3 chaves API
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

async function chamarGeminiComFallback(prompt: string, config: any): Promise<any> {
  let lastError = '';
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    console.log(`Tentando chave ${i + 1}/${API_KEYS.length}`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: config
          })
        }
      );

      if (response.ok) {
        console.log(`Chave ${i + 1} funcionou!`);
        return await response.json();
      }
      
      const errorText = await response.text();
      lastError = errorText;
      console.log(`Chave ${i + 1} falhou: ${response.status}`);
      
      if (response.status === 429 || response.status === 403 || errorText.includes('quota') || errorText.includes('rate')) {
        continue;
      }
      continue;
    } catch (err) {
      console.error(`Erro com chave ${i + 1}:`, err);
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }
  }
  
  throw new Error(`Todas as chaves falharam. Último erro: ${lastError}`);
}

// Determinar tipo de adversário baseado na área
const getTipoAdversario = (area: string): { tipo: string; prefixo: string; funcao: string } => {
  const areaLower = area.toLowerCase();
  if (areaLower.includes('penal') || areaLower.includes('código penal') || areaLower.includes('cp -')) {
    return { tipo: 'promotor', prefixo: 'Promotor', funcao: 'Ministério Público' };
  }
  return { tipo: 'advogado_particular', prefixo: 'Dr(a).', funcao: 'parte contrária' };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, tema, nivel_dificuldade = 'Médio', modo = 'advogado', genero_jogador = 'masculino' } = await req.json();
    
    console.log('📋 Gerando caso:', { area, tema, nivel_dificuldade, modo, genero_jogador });

    if (!area || !tema) {
      throw new Error('Área e tema são obrigatórios');
    }

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API Gemini configurada');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Credenciais do Supabase não configuradas');
    }

    // Usar área diretamente como nome da tabela
    const tabelaArtigos = area;
    console.log('📚 Buscando artigos da tabela:', tabelaArtigos);
    
    // Determinar tipo de adversário
    const adversarioInfo = getTipoAdversario(area);

    const respostaArtigos = await fetch(
      `${SUPABASE_URL}/rest/v1/${encodeURIComponent(tabelaArtigos)}?select=*&limit=100`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        }
      }
    );

    if (!respostaArtigos.ok) {
      console.error('Erro ao buscar artigos:', await respostaArtigos.text());
      throw new Error('Erro ao buscar artigos');
    }

    const artigosDisponiveis = await respostaArtigos.json();
    console.log(`✅ ${artigosDisponiveis.length} artigos encontrados`);

    // Preparar contexto para IA
    const artigosContexto = artigosDisponiveis.slice(0, 20).map((a: any) => 
      `${a['Número do Artigo']}: ${a.Artigo?.substring(0, 200)}...`
    ).join('\n\n');

const promptGeracao = `Você é um especialista em ${area} e precisa criar um caso jurídico realista e educativo para simulação de audiência.

**CONTEXTO:**
- Área: ${area}
- Tema: ${tema}
- Nível: ${nivel_dificuldade}
- Modo: ${modo === 'juiz' ? 'O usuário atuará como juiz' : 'O usuário atuará como advogado'}
- Gênero do Jogador: ${genero_jogador}
- Tipo de Adversário: ${adversarioInfo.tipo === 'promotor' ? 'Promotor do Ministério Público' : 'Advogado particular da parte contrária'}

**ARTIGOS DISPONÍVEIS NESTA ÁREA:**
${artigosContexto}

**INSTRUÇÕES CRÍTICAS:**
1. Use APENAS artigos da área ${area} (tabela: ${tabelaArtigos})
2. Crie um caso com turnos dinâmicos e realistas
3. contexto_inicial NÃO deve conter saudações - apenas descrição do caso
4. A saudação será gerada dinamicamente no jogo
5. Crie 3-4 turnos com perguntas progressivamente mais complexas
6. Cada turno deve ter 3 opções de resposta (forte/média/fraca) com refutações do adversário
7. Inclua provas visuais que serão geradas por IA (descreva-as bem)
8. Crie uma sentença detalhada (300-500 palavras)

**SOBRE PROVAS VISUAIS:**
- Cada prova terá uma imagem gerada por IA
- Descreva DETALHADAMENTE como a prova deve ser (será usada para gerar imagem)
- Tipos aceitos: documental, pericial, fotografia
- Inclua prompt_imagem para cada prova

**ESTRUTURA OBRIGATÓRIA (JSON):**
{
  "area": "${area}",
  "tema": "${tema}",
  "titulo_caso": "Título curto e descritivo do caso",
  "contexto_inicial": "APENAS descrição objetiva do caso sem saudações. Exemplo: 'Trata-se de ação de indenização movida por João contra empresa XYZ, alegando danos morais decorrentes de...' (150-250 palavras, SEM 'Bom dia', SEM 'Vamos iniciar')",
  "nome_cliente": "Nome do cliente",
  "perfil_cliente": "Breve descrição do perfil",
  "nome_reu": "${modo === 'advogado' ? 'Nome da parte contrária' : 'Nome do réu'}",
  "perfil_reu": "Breve descrição",
  "nome_juiza": "Dra. [Nome Completo]",
  "perfil_juiza": "Estilo da juíza (rigorosa, conciliadora, equilibrada)",
  "nome_advogado_reu": "${adversarioInfo.tipo === 'promotor' ? 'Promotor [Nome Completo]' : 'Dr(a). [Nome Completo]'}",
  "perfil_advogado_reu": "${adversarioInfo.tipo === 'promotor' ? 'Estilo do promotor (rigoroso, técnico, equilibrado)' : 'Estilo do advogado adversário'}",
  "genero_advogado_reu": "masculino ou feminino",
  "tipo_adversario": "${adversarioInfo.tipo}",
  "genero_jogador": "${genero_jogador}",
  "modo": "${modo}",
  "nivel_dificuldade": "${nivel_dificuldade}",
  "estrutura_audiencia": {
    "turnos": [
      {
        "ordem": 1,
        "tipo": "juiza_pergunta",
        "texto": "${modo === 'advogado' ? 'Doutor(a), gostaria de ouvir suas alegações iniciais sobre o caso.' : 'Dr. Advogado, apresente suas razões iniciais.'}",
        "respostas_possiveis": [
          {
            "texto": "Resposta forte, bem fundamentada com artigos específicos. Exemplo: 'Excelência, com base no Art. X, entendo que...'",
            "pontos": 25,
            "forca": "forte",
            "artigos_citados": [1, 2],
            "refutacao_adversario": "Resposta detalhada do advogado da ré contestando esse argumento de forma técnica"
          },
          {
            "texto": "Resposta média com fundamentação parcial",
            "pontos": 15,
            "forca": "media",
            "artigos_citados": [1],
            "refutacao_adversario": "Contestação moderada do adversário"
          },
          {
            "texto": "Resposta fraca sem fundamentação adequada",
            "pontos": 5,
            "forca": "fraca",
            "artigos_citados": [],
            "refutacao_adversario": "Contestação contundente do adversário apontando as falhas"
          }
        ]
      },
      {
        "ordem": 2,
        "tipo": "apresentacao_provas",
        "texto": "Doutor(a), apresente as provas que sustentam sua tese.",
        "provas": [
          {
            "nome": "Nome específico da prova",
            "descricao": "Descrição DETALHADA do que a prova contém",
            "tipo": "documental",
            "relevancia": "alta",
            "pontos": 20,
            "prompt_imagem": "Descrição detalhada para gerar a imagem da prova. Ex: 'Contrato formal de prestação de serviços assinado em 15/03/2024, com cabeçalho da empresa XYZ, cláusulas numeradas, assinaturas e carimbos'"
          }
        ]
      },
      {
        "ordem": 3,
        "tipo": "juiza_pergunta",
        "texto": "Considerando as provas apresentadas, como o senhor(a) rebate os argumentos da defesa?",
        "respostas_possiveis": [
          {
            "texto": "Resposta forte rebatendo os argumentos",
            "pontos": 25,
            "forca": "forte",
            "artigos_citados": [3],
            "refutacao_adversario": "Tréplica do adversário"
          },
          {
            "texto": "Resposta média",
            "pontos": 15,
            "forca": "media",
            "artigos_citados": [],
            "refutacao_adversario": "Contestação"
          },
          {
            "texto": "Resposta fraca",
            "pontos": 5,
            "forca": "fraca",
            "artigos_citados": [],
            "refutacao_adversario": "Contestação forte"
          }
        ]
      },
      {
        "ordem": 4,
        "tipo": "consideracoes_finais",
        "texto": "Peço que as partes façam suas considerações finais."
      }
    ]
  },
  "artigos_relacionados": [
    {
      "id": 123,
      "numero": "Art. X",
      "texto": "Texto completo do artigo",
      "tabela_origem": "${tabelaArtigos}"
    }
  ],
  "sentenca_esperada_merito": "Sentença completa e fundamentada (300-500 palavras) com análise do mérito, citação de artigos e conclusão",
  "metricas": {
    "pontuacao_minima_deferimento": 70,
    "pontuacao_deferimento_parcial": 50
  },
  "feedback_positivo": ["Pontos fortes que o jogador demonstrou", "Aspectos bem executados"],
  "feedback_negativo": ["Áreas que precisam melhorar", "Argumentos que faltaram"],
  "dicas": ["Sugestões práticas para próxima simulação", "Artigos que deveria ter estudado melhor"]
}

**CRÍTICO:** 
- NÃO inclua saudações em contexto_inicial
- CADA resposta_possivel deve ter refutacao_adversario única e específica
- CADA prova deve ter prompt_imagem detalhado para geração de imagem
- Texto das respostas deve ser em 1ª pessoa quando for fala do advogado

**RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.**`;

    console.log('🤖 Gerando caso com IA...');

    const dadosIA = await chamarGeminiComFallback(promptGeracao, {
      temperature: 1.0,
      maxOutputTokens: 8000,
    });

    let textoResposta = dadosIA.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textoResposta) {
      throw new Error('Resposta inválida da IA');
    }

    // Extrair JSON da resposta
    const matchJSON = textoResposta.match(/\{[\s\S]*\}/);
    if (!matchJSON) {
      console.error('JSON não encontrado na resposta:', textoResposta);
      throw new Error('Formato inválido retornado pela IA');
    }

    const casoGerado = JSON.parse(matchJSON[0]);
    console.log('✅ Caso gerado:', casoGerado.titulo_caso);

    // Extrair IDs dos artigos mencionados
    const artigos_ids = casoGerado.artigos_relacionados?.map((a: any) => a.id) || [];

    // Inserir no banco
    const respostaInsert = await fetch(
      `${SUPABASE_URL}/rest/v1/SIMULACAO_CASOS`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          area: casoGerado.area,
          tema: casoGerado.tema,
          titulo_caso: casoGerado.titulo_caso,
          contexto_inicial: casoGerado.contexto_inicial,
          nome_cliente: casoGerado.nome_cliente,
          perfil_cliente: casoGerado.perfil_cliente,
          nome_reu: casoGerado.nome_reu,
          perfil_reu: casoGerado.perfil_reu,
          nome_juiza: casoGerado.nome_juiza,
          perfil_juiza: casoGerado.perfil_juiza,
          nome_advogado_reu: casoGerado.nome_advogado_reu,
          perfil_advogado_reu: casoGerado.perfil_advogado_reu,
          genero_advogado_reu: casoGerado.genero_advogado_reu,
          tipo_adversario: casoGerado.tipo_adversario || adversarioInfo.tipo,
          genero_jogador: casoGerado.genero_jogador || genero_jogador,
          modo: casoGerado.modo,
          nivel_dificuldade: casoGerado.nivel_dificuldade,
          estrutura_audiencia: casoGerado.estrutura_audiencia,
          artigos_relacionados: casoGerado.artigos_relacionados,
          artigos_ids: artigos_ids,
          tabela_artigos: tabelaArtigos,
          sentenca_esperada_merito: casoGerado.sentenca_esperada_merito,
          pontuacao_maxima: 100,
          feedback_positivo: casoGerado.feedback_positivo || [],
          feedback_negativo: casoGerado.feedback_negativo || [],
          dicas: casoGerado.dicas || []
        })
      }
    );

    if (!respostaInsert.ok) {
      const erroTexto = await respostaInsert.text();
      console.error('Erro ao inserir caso:', erroTexto);
      throw new Error('Erro ao salvar caso no banco');
    }

    const dadosCaso = await respostaInsert.json();
    console.log('💾 Caso salvo no banco:', dadosCaso[0]?.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        caso: dadosCaso[0],
        message: 'Caso gerado com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Erro ao gerar caso:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
