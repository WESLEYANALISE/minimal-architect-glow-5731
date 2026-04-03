import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function calcularRelevanciaGemini(noticias: any[], apiKey: string): Promise<any[]> {
  if (!noticias || noticias.length === 0) return [];
  
  try {
    const titulos = noticias.map((n, i) => `${i + 1}. ${n.titulo}`).join('\n');
    
    const prompt = `Você é um especialista em direito e concursos públicos. Analise estas notícias jurídicas e atribua uma pontuação de relevância de 1 a 100 para cada uma, considerando:
- Impacto para estudantes de direito e concurseiros
- Importância para a prática jurídica
- Atualidade e urgência da informação
- Interesse geral do público jurídico

Notícias:
${titulos}

Responda APENAS com os números de relevância separados por vírgula, na mesma ordem das notícias. Exemplo: 85,72,90,45,60`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!response.ok) {
      console.warn('Erro na API Gemini, usando relevância padrão');
      return noticias.map(n => ({ ...n, relevancia: 50 }));
    }

    const data = await response.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extrair números da resposta
    const numeros = texto.match(/\d+/g)?.map(Number) || [];
    
    return noticias.map((n, i) => ({
      ...n,
      relevancia: numeros[i] && numeros[i] >= 1 && numeros[i] <= 100 ? numeros[i] : 50
    }));
  } catch (error) {
    console.error('Erro ao calcular relevância:', error);
    return noticias.map(n => ({ ...n, relevancia: 50 }));
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const GEMINI_KEY = Deno.env.get('GEMINI_KEY_1') || Deno.env.get('DIREITO_PREMIUM_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('🔍 Verificando cache de notícias...');
    
    // Verificar se há notícias recentes (últimos 10 minutos)
    const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: noticiasRecentes, error: errorRecentes } = await supabase
      .from('noticias_juridicas_cache')
      .select('id')
      .gte('created_at', dezMinutosAtras)
      .limit(1);

    // Se não há notícias recentes, chamar função de atualização
    if (!errorRecentes && (!noticiasRecentes || noticiasRecentes.length === 0)) {
      console.log('⚡ Cache desatualizado. Atualizando notícias da planilha...');
      try {
        const atualizarResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/atualizar-noticias-juridicas`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (atualizarResponse.ok) {
          const resultado = await atualizarResponse.json();
          console.log(`✅ Cache atualizado: ${resultado.noticiasAdicionadas} notícias adicionadas`);
        } else {
          console.warn('⚠️ Erro ao atualizar cache, usando dados existentes');
        }
      } catch (updateError) {
        console.warn('⚠️ Falha na atualização automática:', updateError);
      }
    } else {
      console.log('✓ Cache está atualizado');
    }
    
    // Buscar notícias dos últimos 7 dias
    // Ordenação: data_publicacao DESC, created_at DESC para garantir ordem correta
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: noticias, error } = await supabase
      .from('noticias_juridicas_cache')
      .select('id, titulo, link, imagem, fonte, categoria, data_publicacao, created_at, analise_ia, relevancia')
      .gte('data_publicacao', seteDiasAtras)
      .order('data_publicacao', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      console.error('❌ Erro ao buscar notícias:', error);
      throw error;
    }

    // Mapear para formato esperado pelo frontend
    let noticiasFormatadas = (noticias || []).map((noticia) => ({
      id: noticia.id.toString(),
      categoria: noticia.categoria || 'Geral',
      portal: noticia.fonte || 'Portal Jurídico',
      titulo: noticia.titulo,
      capa: noticia.imagem || '',
      link: noticia.link,
      dataHora: noticia.data_publicacao || new Date().toISOString(),
      analise_ia: noticia.analise_ia,
      relevancia: noticia.relevancia || 50,
    }));

    // Calcular relevância para notícias sem pontuação (se tiver API key)
    if (GEMINI_KEY) {
      const noticiasSemRelevancia = noticiasFormatadas.filter(n => !n.relevancia || n.relevancia === 50);
      
      if (noticiasSemRelevancia.length > 0 && noticiasSemRelevancia.length <= 30) {
        console.log(`🤖 Calculando relevância para ${noticiasSemRelevancia.length} notícias...`);
        const noticiasComRelevancia = await calcularRelevanciaGemini(noticiasSemRelevancia, GEMINI_KEY);
        
        // Atualizar no cache para próximas requisições (fire and forget)
        for (const noticia of noticiasComRelevancia) {
          supabase
            .from('noticias_juridicas_cache')
            .update({ relevancia: noticia.relevancia })
            .eq('id', noticia.id)
            .then(() => {});
        }
        
        // Mesclar notícias atualizadas
        const mapaRelevancia = new Map(noticiasComRelevancia.map(n => [n.id, n.relevancia]));
        noticiasFormatadas = noticiasFormatadas.map(n => ({
          ...n,
          relevancia: mapaRelevancia.get(n.id) || n.relevancia
        }));
      }
    }

    console.log(`${noticiasFormatadas.length} notícias encontradas (últimos 7 dias)`);

    return new Response(
      JSON.stringify(noticiasFormatadas),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na função buscar-noticias-juridicas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
