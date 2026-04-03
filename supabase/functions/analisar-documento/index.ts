import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REVISION = "v2.0.0";
const MODEL = "gemini-2.5-flash-lite";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de fallback com 4 chaves API
async function chamarGeminiComFallback(parts: any[], config: any): Promise<string> {
  const API_KEYS = [
    { name: 'GEMINI_KEY_1', key: Deno.env.get('GEMINI_KEY_1') },
    { name: 'GEMINI_KEY_2', key: Deno.env.get('GEMINI_KEY_2') },
    { name: 'DIREITO_PREMIUM_API_KEY', key: Deno.env.get('DIREITO_PREMIUM_API_KEY') }
  ].filter(k => k.key);

  if (API_KEYS.length === 0) {
    throw new Error('Nenhuma API key configurada');
  }

  console.log(`🔑 ${API_KEYS.length} chaves API disponíveis`);

  for (const { name, key } of API_KEYS) {
    try {
      console.log(`📝 Tentando ${name}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: config
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log(`✅ Sucesso com ${name}`);
        return result;
      }
      
      const errorText = await response.text();
      
      if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
        console.log(`⚠️ Quota excedida em ${name}, tentando próxima...`);
        continue;
      }
      
      console.error(`❌ Erro ${response.status} em ${name}: ${errorText.substring(0, 200)}`);
      continue;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Exceção em ${name}: ${msg}`);
      continue;
    }
  }
  
  throw new Error(`Todas as ${API_KEYS.length} chaves API falharam`);
}

serve(async (req) => {
  console.log(`📍 Function: analisar-documento@${REVISION} | Model: ${MODEL}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, fileBase64, fileName } = await req.json();

    // Definir o prompt baseado no tipo de análise
    let systemPrompt = '';
    
    switch (tipo) {
      case 'documento':
        systemPrompt = 'Você é um assistente jurídico especializado em análise de documentos. Analise o documento fornecido de forma SUPER DETALHADA e COMPLETA usando Markdown.\n\nESTRUTURA OBRIGATÓRIA:\n\n# 📄 Análise do Documento\n\n## 🔍 Natureza do Documento\n[Identificar tipo e características]\n\n## 👥 Partes Envolvidas\n[Listar e detalhar cada parte]\n\n## 📋 Principais Cláusulas/Disposições\n[Analisar cada cláusula relevante com detalhes]\n\n## ⚠️ Pontos de Atenção\n[Destacar aspectos críticos]\n\n## 🚨 Riscos Identificados\n[Enumerar riscos com severidade]\n\n## 💡 Recomendações\n[Sugestões práticas e ações]\n\nUse negrito, listas, subtítulos e emojis para organização visual.';
        break;
      case 'peticao':
        systemPrompt = 'Você é um assistente jurídico especializado em análise de petições. Analise de forma SUPER DETALHADA usando Markdown.\n\nESTRUTURA OBRIGATÓRIA:\n\n# ⚖️ Análise da Petição\n\n## 👥 Partes\n### Autor(es)\n[Detalhar]\n### Réu(s)\n[Detalhar]\n\n## 📝 Pedidos Principais\n[Listar e analisar cada pedido]\n\n## 📚 Fundamentos Jurídicos\n[Analisar base legal e jurisprudencial]\n\n## 📎 Provas Anexadas\n[Detalhar documentos]\n\n## ⏰ Prazos Relevantes\n[Identificar prazos críticos]\n\n## 🏗️ Estrutura e Qualidade\n[Avaliar organização e técnica]\n\n## 💡 Recomendações\n[Sugestões de melhoria]\n\nUse formatação rica com negrito, listas e emojis.';
        break;
      case 'prova':
        systemPrompt = 'Você é um corretor de provas jurídicas. Avalie de forma SUPER DETALHADA usando Markdown.\n\nESTRUTURA OBRIGATÓRIA:\n\n# 📝 Correção da Prova\n\n## 📊 Análise Geral\n[Visão geral do desempenho]\n\n## ✅ Pontos Fortes\n[Destacar acertos e qualidades]\n\n## ❌ Pontos a Melhorar\n[Identificar erros e fragilidades]\n\n## ⚖️ Correção Técnica\n[Avaliar precisão jurídica]\n\n## 📚 Fundamentação Jurídica\n[Analisar base legal]\n\n## 💬 Clareza e Organização\n[Avaliar estrutura e comunicação]\n\n## 📈 Nota e Justificativa\n[Nota estimada com explicação]\n\n## 💡 Sugestões de Melhoria\n[Recomendações práticas]\n\nUse formatação rica e detalhada.';
        break;
      case 'resumo':
        systemPrompt = 'Você é um especialista em criar resumos estruturados de textos jurídicos. Crie um resumo SUPER DETALHADO e ORGANIZADO usando Markdown.\n\nESTRUTURA OBRIGATÓRIA:\n\n# 📚 Resumo do Documento\n\n## 🎯 Tema Principal\n[Identificar assunto central]\n\n## 📋 Tópicos Principais\n### 1️⃣ [Primeiro Tópico]\n- Subtópicos detalhados\n- Pontos-chave\n\n### 2️⃣ [Segundo Tópico]\n- Subtópicos detalhados\n- Pontos-chave\n\n[Continue numerando...]\n\n## 💡 Conceitos-Chave\n[Definir termos importantes]\n\n## 🔗 Conexões e Relações\n[Mostrar relações entre tópicos]\n\n## 📌 Conclusões\n[Síntese final]\n\nUse hierarquia clara e formatação visual.';
        break;
      case 'contrato':
        systemPrompt = 'Você é um especialista em análise de contratos. Analise de forma SUPER DETALHADA usando Markdown.\n\nESTRUTURA OBRIGATÓRIA:\n\n# 📑 Análise Contratual\n\n## 📝 Tipo de Contrato\n[Identificar natureza]\n\n## 👥 Partes Contratantes\n[Detalhar qualificação]\n\n## 🎯 Objeto do Contrato\n[Descrever em detalhes]\n\n## ✅ Cláusulas Essenciais\n[Analisar cada cláusula importante]\n\n## ⚠️ Cláusulas Problemáticas\n[Identificar cláusulas abusivas ou arriscadas]\n\n## 🚨 Riscos Identificados\n[Enumerar riscos com níveis]\n\n## ⚖️ Aspectos Legais\n[Conformidade legal]\n\n## 💡 Recomendações\n[Sugestões práticas]\n\nUse negrito, tabelas e listas detalhadas.';
        break;
      case 'ocr':
        systemPrompt = 'Você é um especialista em OCR de documentos jurídicos. Extraia o texto de forma PRECISA mantendo a estrutura usando Markdown.\n\n# 📄 Texto Extraído\n\n[Extrair todo o texto preservando:\n- Parágrafos\n- Listas\n- Numeração\n- Estrutura hierárquica\n- Formatação visual]\n\nUse Markdown para organizar o texto extraído de forma clara e legível.';
        break;
      default:
        systemPrompt = 'Você é um assistente jurídico. Analise o documento fornecido de forma SUPER DETALHADA usando Markdown com estrutura clara, negrito, listas e emojis.';
    }

    console.log('Iniciando análise:', { tipo, fileName });

    // Extrair apenas os dados base64 da imagem
    const base64Data = fileBase64.includes('base64,') 
      ? fileBase64.split('base64,')[1] 
      : fileBase64;

    // Determinar o mime type
    let mimeType = 'image/jpeg';
    if (fileBase64.includes('image/png')) mimeType = 'image/png';
    else if (fileBase64.includes('image/webp')) mimeType = 'image/webp';
    else if (fileBase64.includes('application/pdf')) mimeType = 'application/pdf';

    // Preparar o conteúdo para a API do Gemini
    const parts: any[] = [
      { text: systemPrompt + `\n\nAnalise este documento: ${fileName}` },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      }
    ];

    const resultado = await chamarGeminiComFallback(parts, {
      temperature: 0.7,
      maxOutputTokens: 2000,
    });

    console.log('Análise concluída com sucesso');

    return new Response(
      JSON.stringify({ 
        resultado,
        tipo,
        fileName 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
