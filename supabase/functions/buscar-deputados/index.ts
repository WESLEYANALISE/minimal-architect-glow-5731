import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: Record<string, any> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { nome, siglaUf, siglaPartido, idLegislatura, salvarCache = false } = body;
    console.log('Buscando deputados com filtros:', { nome, siglaUf, siglaPartido, idLegislatura, salvarCache });

    const params = new URLSearchParams();
    if (nome) params.append('nome', nome);
    if (siglaUf) params.append('siglaUf', siglaUf);
    if (siglaPartido) params.append('siglaPartido', siglaPartido);
    if (idLegislatura) params.append('idLegislatura', idLegislatura.toString());
    params.append('ordem', 'ASC');
    params.append('ordenarPor', 'nome');
    params.append('itens', '600');

    const url = `https://dadosabertos.camara.leg.br/api/v2/deputados?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    const deputados = data.dados || [];
    console.log(`${deputados.length} deputados encontrados`);

    let cacheResult: { processados: number } | null = null;

    if (salvarCache) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const registros = deputados.map((dep: any) => ({
        id: dep.id,
        nome: dep.nome,
        sigla_partido: dep.siglaPartido,
        sigla_uf: dep.siglaUf,
        url_foto: dep.urlFoto,
        email: dep.email,
        uri: dep.uri,
        legislatura: dep.idLegislatura,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('deputados_cache')
        .upsert(registros, { onConflict: 'id' });

      if (error) throw error;

      cacheResult = { processados: registros.length };
      console.log(`Cache atualizado com ${registros.length} deputados`);
    }

    return new Response(JSON.stringify({ deputados, cache: cacheResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar deputados:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
