import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE = 'https://dadosabertos.camara.leg.br/api/v2/deputados';

async function fetchJSON(url: string) {
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.dados || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idDeputado } = await req.json();
    console.log('Buscando detalhes do deputado:', idDeputado);

    // Fetch all endpoints in parallel
    const [detalhes, orgaos, frentes, profissoes, ocupacoes] = await Promise.all([
      fetchJSON(`${API_BASE}/${idDeputado}`),
      fetchJSON(`${API_BASE}/${idDeputado}/orgaos?itens=100&ordem=DESC&ordenarPor=dataInicio`),
      fetchJSON(`${API_BASE}/${idDeputado}/frentes`),
      fetchJSON(`${API_BASE}/${idDeputado}/profissoes`),
      fetchJSON(`${API_BASE}/${idDeputado}/ocupacoes`),
    ]);

    console.log('Detalhes carregados:', detalhes?.nomeCivil);

    return new Response(JSON.stringify({
      deputado: detalhes || {},
      orgaos: orgaos || [],
      frentes: frentes || [],
      profissoes: profissoes || [],
      ocupacoes: ocupacoes || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do deputado:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
