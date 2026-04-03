import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try Firecrawl first, fallback to direct fetch
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY_1') || Deno.env.get('FIRECRAWL_API_KEY');

    const { inicio, fim } = await req.json();
    const startNum = inicio || 870;
    const endNum = fim || 881;

    const results: any[] = [];
    const errors: any[] = [];

    for (let num = startNum; num <= endNum; num++) {
      try {
        // Check if already exists with notas
        const { data: existing } = await supabase
          .from('informativos_jurisprudencia')
          .select('id, informativos_notas(count)')
          .eq('tribunal', 'STJ')
          .eq('numero_edicao', num)
          .maybeSingle();

        if (existing && (existing as any).informativos_notas?.[0]?.count > 2) {
          console.log(`STJ ${num} já existe com notas, pulando`);
          continue;
        }

        console.log(`Raspando STJ Informativo ${num}...`);
        const url = `https://scon.stj.jus.br/jurisprudencia/externo/informativo/?acao=pesquisarumaedicao&livre=%27${num}%27.cod.`;

        let html = '';
        let usedFirecrawl = false;

        // Try Firecrawl if available
        if (firecrawlKey) {
          try {
            const fcResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url, formats: ['html'], onlyMainContent: true, waitFor: 5000 }),
            });

            const fcData = await fcResp.json();
            if (fcResp.ok && fcData.success) {
              html = fcData.data?.html || fcData.html || '';
              usedFirecrawl = true;
            }
          } catch (e) {
            console.log(`Firecrawl fallback for STJ ${num}`);
          }
        }

        // Direct fetch fallback
        if (!html) {
          const resp = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml',
              'Accept-Language': 'pt-BR,pt;q=0.9',
            },
          });
          if (resp.ok) {
            html = await resp.text();
          } else {
            errors.push({ numero: num, error: `HTTP ${resp.status}` });
            continue;
          }
        }

        if (!html || html.length < 200) {
          errors.push({ numero: num, error: 'Conteúdo vazio' });
          continue;
        }

        const parsed = parseSTJHtml(html, num);

        const { data: infoData, error: infoError } = await supabase
          .from('informativos_jurisprudencia')
          .upsert({
            tribunal: 'STJ',
            numero_edicao: num,
            data_publicacao: parsed.data,
            titulo_edicao: `Informativo de Jurisprudência STJ nº ${num}`,
            tipo: 'regular',
          }, { onConflict: 'tribunal,numero_edicao' })
          .select('id')
          .single();

        if (infoError) {
          errors.push({ numero: num, error: infoError.message });
          continue;
        }

        await supabase.from('informativos_notas').delete().eq('informativo_id', infoData.id);

        if (parsed.notas.length > 0) {
          const notasToInsert = parsed.notas.map((nota: any, idx: number) => ({
            informativo_id: infoData.id,
            orgao_julgador: nota.orgao || null,
            ramo_direito: nota.ramo || null,
            tema: nota.tema || null,
            destaque: nota.destaque || null,
            inteiro_teor: nota.teor || null,
            processo: nota.processo || null,
            relator: nota.relator || null,
            link_processo: nota.linkProcesso || null,
            link_audio: nota.linkAudio || null,
            link_video: nota.linkVideo || null,
            ordem: idx + 1,
          }));

          await supabase.from('informativos_notas').insert(notasToInsert);
        }

        results.push({ numero: num, notas: parsed.notas.length, data: parsed.data, firecrawl: usedFirecrawl });
        console.log(`STJ ${num}: ${parsed.notas.length} notas (${usedFirecrawl ? 'firecrawl' : 'direct'})`);

        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        console.error(`Erro STJ ${num}:`, e);
        errors.push({ numero: num, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ success: true, results, errors, total: results.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseSTJHtml(html: string, numero: number) {
  // Extract date
  const dateMatch = html.match(/(?:Per[ií]odo|publica[çc][ãa]o)[:\s]*(\d{1,2})\s+(?:a\s+\d{1,2}\s+)?de\s+(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i)
    || html.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

  let dataPublicacao: string | null = null;
  if (dateMatch) {
    const meses: Record<string, string> = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
      'abril': '04', 'maio': '05', 'junho': '06', 'julho': '07',
      'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };
    const mesStr = dateMatch[2].toLowerCase();
    const mes = meses[mesStr] || mesStr.padStart(2, '0');
    dataPublicacao = `${dateMatch[3]}-${mes}-${dateMatch[1].padStart(2, '0')}`;
  }

  const text = stripHtml(html);
  const notas: any[] = [];
  const lines = text.split('\n');
  let currentOrgao = '';
  let currentRamo = '';
  let currentNota: any = null;
  let currentTeor = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect orgao julgador
    const orgaoMatch = line.match(/^(?:Corte\s+Especial|Primeira\s+(?:Turma|Se[çc][ãa]o)|Segunda\s+(?:Turma|Se[çc][ãa]o)|Terceira\s+(?:Turma|Se[çc][ãa]o)|Quarta\s+Turma|Quinta\s+Turma|Sexta\s+Turma|Plen[áa]rio)$/i);
    if (orgaoMatch) {
      currentOrgao = line.trim();
      continue;
    }

    // Detect ramo do direito
    if (/^DIREITO\s+/i.test(line) && line.length < 100) {
      currentRamo = line.replace(/[-–—]\s*$/, '').trim();
      continue;
    }

    // Detect processo reference line
    const processoLine = line.match(/^Processo[:\s]*((?:REsp|AREsp|AgInt|EREsp|HC|RMS|CC|EDcl|RHC|AgRg|Pet|Rcl|EAREsp|EDcl)\s*[\d.\/\-]+)/i);
    if (processoLine && currentNota) {
      currentNota.processo = processoLine[1].trim();
      continue;
    }

    // Detect relator
    const relatorLine = line.match(/^Rel(?:ator(?:a)?|\.?)[:\s]*(?:Min(?:istro|istra|\.?)\s+)?([^,\n]+)/i);
    if (relatorLine && currentNota) {
      currentNota.relator = relatorLine[1].trim();
      continue;
    }

    // Detect tema/title (typically longer lines that serve as case titles)
    const isTema = (
      line.length > 15 && line.length < 300 &&
      !line.startsWith('Processo') && !line.startsWith('Rel') && !line.startsWith('Órgão') &&
      !line.startsWith('Data') && !line.startsWith('Resumo') && !line.startsWith('ODS') &&
      !line.startsWith('DIREITO') &&
      !/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line) &&
      (
        (line === line.toUpperCase() && /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{5,}/.test(line)) ||
        (line.endsWith('.') && line.length > 40 && line.length < 200 && /[a-záéíóúâêôãõç]/.test(line))
      )
    );

    if (isTema) {
      if (currentNota) {
        currentNota.teor = currentTeor.trim().substring(0, 5000);
        if (currentNota.tema && currentNota.tema.length > 5) notas.push(currentNota);
      }

      currentNota = {
        orgao: currentOrgao || null,
        ramo: currentRamo || null,
        tema: line.trim(),
        destaque: null,
        teor: '',
        processo: null,
        relator: null,
        linkProcesso: null,
        linkAudio: null,
        linkVideo: null,
      };
      currentTeor = '';
      continue;
    }

    if (currentNota) {
      currentTeor += line + '\n';

      if (!currentNota.destaque && line.length > 30 && line.length < 500) {
        if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(line) && line.includes('.')) {
          currentNota.destaque = line.substring(0, 500);
        }
      }
    }
  }

  if (currentNota) {
    currentNota.teor = currentTeor.trim().substring(0, 5000);
    if (currentNota.tema && currentNota.tema.length > 5) notas.push(currentNota);
  }

  return {
    data: dataPublicacao,
    notas: notas.slice(0, 50),
  };
}
