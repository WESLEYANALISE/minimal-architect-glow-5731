import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2'
const TIPOS = ['PL', 'PLP', 'PEC', 'MPV', 'PDC', 'PRC']

async function fetchJSON(url: string) {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

async function buscarFotoDeputado(nomeAutor: string): Promise<string | null> {
  try {
    const data = await fetchJSON(`${CAMARA_API}/deputados?nome=${encodeURIComponent(nomeAutor)}&ordem=ASC&ordenarPor=nome`)
    if (data?.dados?.length > 0) {
      return data.dados[0].urlFoto || null
    }

    const partes = nomeAutor.split(' ').filter(p => p.length > 2)
    if (partes.length >= 2) {
      const nomeParcial = `${partes[0]} ${partes[partes.length - 1]}`
      const data2 = await fetchJSON(`${CAMARA_API}/deputados?nome=${encodeURIComponent(nomeParcial)}&ordem=ASC&ordenarPor=nome`)
      if (data2?.dados?.length > 0) {
        return data2.dados[0].urlFoto || null
      }
    }

    return null
  } catch {
    return null
  }
}

// Cache de senadores para evitar múltiplas chamadas à API do Senado
let senadoresCache: Array<{ nome: string; foto: string }> | null = null

async function buscarFotoSenador(nomeSenador: string): Promise<string | null> {
  try {
    // Carregar lista de senadores se não estiver em cache
    if (!senadoresCache) {
      const res = await fetch('https://legis.senado.leg.br/dadosabertos/senador/lista/atual', {
        headers: { 'Accept': 'application/json' }
      })
      if (res.ok) {
        const data = await res.json()
        const parlamentares = data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || []
        senadoresCache = parlamentares.map((p: any) => ({
          nome: p.IdentificacaoParlamentar?.NomeParlamentar || '',
          foto: p.IdentificacaoParlamentar?.UrlFotoParlamentar || '',
        }))
      } else {
        senadoresCache = []
      }
    }

    // Buscar pelo nome (parcial, case-insensitive)
    const nomeNorm = nomeSenador.toLowerCase().trim()
    const found = senadoresCache.find(s => {
      const sNorm = s.nome.toLowerCase()
      return sNorm === nomeNorm || sNorm.includes(nomeNorm) || nomeNorm.includes(sNorm)
    })

    return found?.foto || null
  } catch {
    return null
  }
}

async function resolverFotoAutor(autorNome: string, autorUri: string | null): Promise<{ foto: string | null; partido: string | null; uf: string | null; nome: string | null }> {
  let foto: string | null = null
  let partido: string | null = null
  let uf: string | null = null
  let nome: string | null = autorNome

  // Se é senador (nome começa com "Senado Federal - ")
  const senadorMatch = autorNome.match(/^Senado Federal\s*-\s*(.+)/i)
  if (senadorMatch) {
    const nomeSenador = senadorMatch[1].replace(/^Senador[a]?\s+/i, '').trim()
    foto = await buscarFotoSenador(nomeSenador)
    return { foto, partido, uf, nome }
  }

  // Se tem URI de deputado
  if (autorUri && autorUri.includes('/deputados/')) {
    try {
      const depData = await fetchJSON(autorUri)
      if (depData?.dados) {
        foto = depData.dados.ultimoStatus?.urlFoto || null
        partido = depData.dados.ultimoStatus?.siglaPartido || null
        uf = depData.dados.ultimoStatus?.siglaUf || null
        if (!nome) nome = depData.dados.ultimoStatus?.nomeEleitoral || depData.dados.nomeCivil || null
      }
    } catch {
      if (autorNome) foto = await buscarFotoDeputado(autorNome)
    }
  } else if (autorNome) {
    // Fallback: buscar na API da Câmara pelo nome
    foto = await buscarFotoDeputado(autorNome)
  }

  return { foto, partido, uf, nome }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const resultados: Record<string, number> = {}

    // 1. Processar novas proposições
    for (const tipo of TIPOS) {
      try {
        const hoje = new Date().toISOString().split('T')[0]
        const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const propData = await fetchJSON(
          `${CAMARA_API}/proposicoes?siglaTipo=${tipo}&dataInicio=${seteDiasAtras}&dataFim=${hoje}&ordem=DESC&ordenarPor=id&itens=20`
        )

        if (!propData?.dados?.length) {
          resultados[tipo] = 0
          continue
        }

        let processadas = 0

        for (const prop of propData.dados) {
          try {
            const autoresData = await fetchJSON(`${CAMARA_API}/proposicoes/${prop.id}/autores`)
            let autorNome: string | null = null
            let autorUri: string | null = null

            if (autoresData?.dados?.length > 0) {
              const autor = autoresData.dados[0]
              autorNome = autor.nome || null
              autorUri = autor.uri || null
            }

            const resolved = autorNome
              ? await resolverFotoAutor(autorNome, autorUri)
              : { foto: null, partido: null, uf: null, nome: null }

            const { error } = await supabase
              .from('cache_proposicoes_recentes')
              .upsert({
                id_proposicao: prop.id,
                sigla_tipo: tipo,
                numero: prop.numero,
                ano: prop.ano,
                ementa: prop.ementa || '',
                data_apresentacao: prop.dataApresentacao || null,
                autor_principal_nome: resolved.nome || autorNome,
                autor_principal_foto: resolved.foto,
                autor_principal_partido: resolved.partido,
                autor_principal_uf: resolved.uf,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id_proposicao' })

            if (!error) processadas++
          } catch {
            // Continua com próxima proposição
          }

          await new Promise(r => setTimeout(r, 200))
        }

        resultados[tipo] = processadas
      } catch {
        resultados[tipo] = -1
      }
    }

    // 2. Retry: buscar fotos para registros onde autor_principal_foto IS NULL
    let retryCount = 0
    try {
      const { data: semFoto } = await supabase
        .from('cache_proposicoes_recentes')
        .select('id, id_proposicao, autor_principal_nome')
        .is('autor_principal_foto', null)
        .not('autor_principal_nome', 'is', null)
        .limit(30)

      if (semFoto?.length) {
        for (const row of semFoto) {
          const nome = row.autor_principal_nome
          if (!nome) continue

          const resolved = await resolverFotoAutor(nome, null)
          if (resolved.foto) {
            const updateData: Record<string, any> = { autor_principal_foto: resolved.foto }
            if (resolved.partido) updateData.autor_principal_partido = resolved.partido
            if (resolved.uf) updateData.autor_principal_uf = resolved.uf

            await supabase
              .from('cache_proposicoes_recentes')
              .update(updateData)
              .eq('id', row.id)

            retryCount++
          }

          await new Promise(r => setTimeout(r, 300))
        }
      }
    } catch {
      // Retry silencioso
    }

    return new Response(JSON.stringify({ ok: true, resultados, fotos_recuperadas: retryCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
