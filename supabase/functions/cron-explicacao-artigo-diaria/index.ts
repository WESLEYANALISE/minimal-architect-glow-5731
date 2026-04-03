import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Verificar se já existe uma explicação sendo gerada
    const { data: gerando } = await supabase
      .from('explicacoes_artigos_diarias')
      .select('id')
      .eq('status', 'gerando')
      .limit(1)

    if (gerando && gerando.length > 0) {
      console.log('[cron-explicacao] Já existe uma explicação sendo gerada, pulando...')
      return new Response(JSON.stringify({ skipped: true, reason: 'gerando' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Verificar se já foi gerado hoje
    const hoje = new Date().toISOString().split('T')[0]
    const { data: geradoHoje } = await supabase
      .from('explicacoes_artigos_diarias')
      .select('id')
      .eq('data_publicacao', hoje)
      .eq('status', 'concluido')
      .limit(1)

    if (geradoHoje && geradoHoje.length > 0) {
      console.log('[cron-explicacao] Já existe explicação de hoje, pulando...')
      return new Response(JSON.stringify({ skipped: true, reason: 'ja_gerado_hoje' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Buscar o último artigo gerado para saber o próximo
    const { data: ultimo } = await supabase
      .from('explicacoes_artigos_diarias')
      .select('numero_artigo')
      .eq('codigo', 'cp')
      .eq('status', 'concluido')
      .order('id', { ascending: false })
      .limit(1)

    // Determinar próximo artigo
    let proximoNumero = '1º'
    if (ultimo && ultimo.length > 0) {
      const ultimoNum = ultimo[0].numero_artigo
      // Extrair número e incrementar
      const match = ultimoNum.match(/^(\d+)/)
      if (match) {
        const num = parseInt(match[1]) + 1
        proximoNumero = `${num}º`
      }
    }

    console.log(`[cron-explicacao] Gerando explicação para Art. ${proximoNumero} do CP...`)

    // 4. Invocar a edge function de geração
    const resp = await fetch(`${supabaseUrl}/functions/v1/gerar-explicacao-artigo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ numero_artigo: proximoNumero, codigo: 'cp' }),
    })

    const result = await resp.json()
    console.log(`[cron-explicacao] Resultado:`, JSON.stringify(result))

    return new Response(JSON.stringify({ success: true, artigo: proximoNumero, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('[cron-explicacao] Erro:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
