import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 0. Recuperar itens travados em "gerando" há mais de 24h
    const { data: travados, error: travadosError } = await supabase
      .from('aulas_geracao_fila')
      .update({ 
        status: 'pendente', 
        erro_msg: 'Reset automático: travado em gerando por mais de 24h' 
      })
      .eq('status', 'gerando')
      .lt('updated_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .select('id, tema');

    if (travados && travados.length > 0) {
      console.log(`[Cron] ♻️ Resetados ${travados.length} itens travados em "gerando"`);
    }

    // 1. Verificar se está pausado
    const { data: config } = await supabase
      .from('aulas_geracao_config')
      .select('pausado')
      .eq('id', 'main')
      .single();

    if (config?.pausado) {
      console.log('[Cron] Pipeline pausado, ignorando execução');
      return new Response(JSON.stringify({ skipped: true, reason: 'pausado', resetados: travados?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Verificar se já tem alguma matéria em processamento
    const { data: emProcessamento } = await supabase
      .from('aulas_geracao_fila')
      .select('id, tema, status')
      .in('status', ['processando', 'extraindo', 'identificando'])
      .limit(1);

    if (emProcessamento && emProcessamento.length > 0) {
      console.log(`[Cron] Matéria "${emProcessamento[0].tema}" ainda em ${emProcessamento[0].status}, aguardando`);
      return new Response(JSON.stringify({ skipped: true, reason: 'em_processamento', materia: emProcessamento[0].tema }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Buscar próxima matéria pendente na fila
    const { data: proximaFila } = await supabase
      .from('aulas_geracao_fila')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!proximaFila) {
      console.log('[Cron] Nenhuma matéria pendente na fila');
      return new Response(JSON.stringify({ skipped: true, reason: 'fila_vazia' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Cron] ▶️ Processando: "${proximaFila.tema}" (área: ${proximaFila.area})`);

    // 4. Marcar como processando
    await supabase
      .from('aulas_geracao_fila')
      .update({ status: 'processando' })
      .eq('id', proximaFila.id);

    // 5. Criar registro em categorias_materias
    const { data: materiaExistente } = await supabase
      .from('categorias_materias')
      .select('id')
      .eq('categoria', proximaFila.area)
      .eq('nome', proximaFila.tema)
      .limit(1)
      .single();

    let materiaId: number;

    if (materiaExistente) {
      materiaId = materiaExistente.id;
      console.log(`[Cron] Matéria já existe: ID ${materiaId}`);
    } else {
      // Buscar próxima ordem
      const { data: maxOrdem } = await supabase
        .from('categorias_materias')
        .select('ordem')
        .eq('categoria', proximaFila.area)
        .order('ordem', { ascending: false })
        .limit(1)
        .single();

      const novaOrdem = (maxOrdem?.ordem || 0) + 1;

      const { data: novaMateria, error: insertError } = await supabase
        .from('categorias_materias')
        .insert({
          categoria: proximaFila.area,
          nome: proximaFila.tema,
          pdf_url: proximaFila.pdf_url,
          capa_url: proximaFila.capa_url,
          ordem: novaOrdem,
          status_processamento: 'processando'
        })
        .select('id')
        .single();

      if (insertError) throw new Error(`Erro ao criar matéria: ${insertError.message}`);
      materiaId = novaMateria.id;
      console.log(`[Cron] Matéria criada: ID ${materiaId}`);
    }

    // Salvar materia_id na fila
    await supabase
      .from('aulas_geracao_fila')
      .update({ materia_id: materiaId, status: 'extraindo' })
      .eq('id', proximaFila.id);

    // 6. Chamar processar-pdf-categorias
    console.log(`[Cron] 📄 Extraindo PDF...`);
    const processarRes = await fetch(`${supabaseUrl}/functions/v1/processar-pdf-categorias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ materiaId, pdfUrl: proximaFila.pdf_url }),
    });

    const processarData = await processarRes.json();
    if (!processarData.success) {
      throw new Error(`Erro ao extrair PDF: ${processarData.error || 'desconhecido'}`);
    }
    console.log(`[Cron] ✅ PDF extraído: ${processarData.totalPaginas} páginas`);

    // 7. Atualizar status e chamar identificar-temas
    await supabase
      .from('aulas_geracao_fila')
      .update({ status: 'identificando' })
      .eq('id', proximaFila.id);

    console.log(`[Cron] 🔍 Identificando temas...`);
    const identificarRes = await fetch(`${supabaseUrl}/functions/v1/identificar-temas-categorias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ materiaId }),
    });

    const identificarData = await identificarRes.json();
    if (!identificarData.success) {
      throw new Error(`Erro ao identificar temas: ${identificarData.error || 'desconhecido'}`);
    }
    console.log(`[Cron] ✅ ${identificarData.temas?.length || 0} temas identificados`);

    const temas = identificarData.temas || [];

    // 8. Confirmar temas automaticamente
    console.log(`[Cron] 📝 Confirmando temas automaticamente...`);
    const confirmarRes = await fetch(`${supabaseUrl}/functions/v1/confirmar-temas-categorias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ materiaId, temas }),
    });

    const confirmarData = await confirmarRes.json();
    if (!confirmarData.success) {
      throw new Error(`Erro ao confirmar temas: ${confirmarData.error || 'desconhecido'}`);
    }
    console.log(`[Cron] ✅ ${confirmarData.totalTopicos} tópicos confirmados`);

    // 9. Buscar tópicos pendentes e disparar geração
    const { data: topicos } = await supabase
      .from('categorias_topicos')
      .select('id, titulo')
      .eq('materia_id', materiaId)
      .eq('status', 'pendente');

    const totalTopicos = topicos?.length || 0;

    // Se não há tópicos pendentes, verificar se todos já foram concluídos
    if (totalTopicos === 0) {
      const { count: totalExistentes } = await supabase
        .from('categorias_topicos')
        .select('*', { count: 'exact', head: true })
        .eq('materia_id', materiaId);

      const { count: totalConcluidos } = await supabase
        .from('categorias_topicos')
        .select('*', { count: 'exact', head: true })
        .eq('materia_id', materiaId)
        .eq('status', 'concluido');

      console.log(`[Cron] Matéria já processada: ${totalConcluidos}/${totalExistentes} tópicos concluídos`);

      await supabase
        .from('aulas_geracao_fila')
        .update({
          status: 'concluido',
          topicos_total: totalExistentes || 0,
          topicos_concluidos: totalConcluidos || 0,
        })
        .eq('id', proximaFila.id);

      console.log(`[Cron] ✅ Matéria "${proximaFila.tema}" marcada como concluída (sem pendentes)`);

      return new Response(
        JSON.stringify({ success: true, materia: proximaFila.tema, already_completed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Cron] 🚀 Disparando geração para ${totalTopicos} tópicos...`);

    // Disparar todos - o sistema de fila do gerar-conteudo-categorias já limita a 5 simultâneos
    if (topicos) {
      for (const topico of topicos) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/gerar-conteudo-categorias`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ topico_id: topico.id }),
          });
          console.log(`[Cron] Disparado: ${topico.titulo}`);
        } catch (e) {
          console.error(`[Cron] Erro ao disparar tópico ${topico.id}:`, e);
        }
      }
    }

    // 10. Atualizar fila
    await supabase
      .from('aulas_geracao_fila')
      .update({
        status: 'gerando',
        topicos_total: totalTopicos,
        topicos_concluidos: 0,
      })
      .eq('id', proximaFila.id);

    console.log(`[Cron] ✅ Matéria "${proximaFila.tema}" em geração (${totalTopicos} tópicos)`);

    return new Response(
      JSON.stringify({
        success: true,
        materia: proximaFila.tema,
        area: proximaFila.area,
        materiaId,
        totalTopicos,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Cron] ❌ Erro:', error);

    // Marcar erro na fila
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Try to update the current processing item
    await supabase
      .from('aulas_geracao_fila')
      .update({ status: 'erro', erro_msg: errorMsg })
      .in('status', ['processando', 'extraindo', 'identificando']);

    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
