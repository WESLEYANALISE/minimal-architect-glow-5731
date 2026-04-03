import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REVISION = "v1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`🚀 [extrair-lei-planalto ${REVISION}] Iniciando...`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resenha_id, url_planalto } = await req.json();

    if (!resenha_id || !url_planalto) {
      return new Response(
        JSON.stringify({ success: false, error: "resenha_id e url_planalto são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`📍 URL: ${url_planalto}`);
    console.log(`📋 Resenha ID: ${resenha_id}`);

    // Chamar raspar-planalto-browserless para obter dados
    console.log('🔄 Chamando raspar-planalto-browserless...');
    const { data: raspData, error: raspError } = await supabase.functions.invoke('raspar-planalto-browserless', {
      body: { urlPlanalto: url_planalto }
    });

    if (raspError || !raspData?.success) {
      console.error('❌ Erro ao raspar:', raspError || raspData?.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: raspData?.error || raspError?.message || "Erro ao raspar lei do Planalto"
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Raspagem OK: ${raspData.artigos?.length || 0} artigos`);

    // Montar texto formatado
    let textoFormatado = '';
    if (raspData.artigos && raspData.artigos.length > 0) {
      textoFormatado = raspData.artigos
        .map((art: { texto: string }) => art.texto)
        .join('\n\n');
    }

    // Formatar artigos para o padrão esperado pelo frontend
    const artigosFormatados = (raspData.artigos || []).map((art: any) => ({
      numero: art.numeroCompleto ? `Art. ${art.numeroCompleto}°` : `Art. ${art.numero}°`,
      texto: art.texto || '',
      capitulo: art.capitulo || null,
      secao: art.secao || null,
    }));

    // Atualizar resenha_diaria com os dados extraídos
    const ementaReal = raspData.metadados?.ementa || null;
    const updateData: any = {
      artigos: artigosFormatados,
      texto_formatado: textoFormatado,
      updated_at: new Date().toISOString(),
    };
    if (ementaReal && ementaReal.length > 20) {
      updateData.ementa = ementaReal;
    }

    const { error: updateError } = await supabase
      .from('resenha_diaria')
      .update(updateData)
      .eq('id', resenha_id);

    if (updateError) {
      console.error('❌ Erro ao atualizar resenha_diaria:', updateError);
      // Still return data even if save fails
    }

    console.log(`✅ Lei extraída: ${artigosFormatados.length} artigos`);

    return new Response(
      JSON.stringify({
        success: true,
        revisao: REVISION,
        artigos: artigosFormatados,
        ementa: ementaReal,
        texto_formatado: textoFormatado,
        total_artigos: artigosFormatados.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro geral: ${errorMessage}`);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
