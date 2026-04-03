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

    const { inicio, fim, modo } = await req.json();
    const startNum = inicio || 1200;
    const endNum = fim || 1208;

    const results: any[] = [];
    const errors: any[] = [];

    for (let num = startNum; num <= endNum; num++) {
      try {
        // Check if already exists with notas
        const { data: existing } = await supabase
          .from('informativos_jurisprudencia')
          .select('id, informativos_notas(count)')
          .eq('tribunal', 'STF')
          .eq('numero_edicao', num)
          .maybeSingle();

        if (existing && (existing as any).informativos_notas?.[0]?.count > 2) {
          console.log(`STF ${num} já existe com notas, pulando`);
          continue;
        }

        console.log(`Raspando STF Informativo ${num} via fetch direto...`);
        const url = `https://www.stf.jus.br/arquivo/informativo/documento/informativo${num}.htm`;

        const resp = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          },
        });

        if (!resp.ok) {
          console.log(`HTTP ${resp.status} for STF ${num}`);
          errors.push({ numero: num, error: `HTTP ${resp.status}` });
          continue;
        }

        const html = await resp.text();
        if (!html || html.length < 200) {
          errors.push({ numero: num, error: 'Conteúdo vazio' });
          continue;
        }

        const parsed = parseSTFHtml(html, num);

        // Upsert informativo
        const { data: infoData, error: infoError } = await supabase
          .from('informativos_jurisprudencia')
          .upsert({
            tribunal: 'STF',
            numero_edicao: num,
            data_publicacao: parsed.data,
            titulo_edicao: `Informativo STF nº ${num}`,
            tipo: 'regular',
          }, { onConflict: 'tribunal,numero_edicao' })
          .select('id')
          .single();

        if (infoError) {
          errors.push({ numero: num, error: infoError.message });
          continue;
        }

        // Delete existing notas and re-insert
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
            ordem: idx + 1,
          }));

          await supabase.from('informativos_notas').insert(notasToInsert);
        }

        results.push({ numero: num, notas: parsed.notas.length, data: parsed.data });
        console.log(`STF ${num}: ${parsed.notas.length} notas`);

        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error(`Erro STF ${num}:`, e);
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

function parseSTFHtml(html: string, numero: number) {
  // Extract date
  const dateMatch = html.match(/(?:Brasília|divulga[çc][ãa]o|Data)[,:\s]*(\d{1,2})\s+(?:a\s+\d{1,2}\s+)?de\s+(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i);

  let dataPublicacao: string | null = null;
  if (dateMatch) {
    const meses: Record<string, string> = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
      'abril': '04', 'maio': '05', 'junho': '06', 'julho': '07',
      'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };
    const mes = meses[dateMatch[2].toLowerCase()] || '01';
    dataPublicacao = `${dateMatch[3]}-${mes}-${dateMatch[1].padStart(2, '0')}`;
  }

  const text = stripHtml(html);
  const notas: any[] = [];
  const lines = text.split('\n');
  let currentOrgao = 'Plenário';
  let currentRamo = '';
  let currentNota: any = null;
  let currentTeor = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect orgao julgador
    if (/^(?:\d+\s+)?PLEN[AÁ]RIO$/i.test(line)) { currentOrgao = 'Plenário'; continue; }
    if (/^(?:\d+\s+)?(?:PRIMEIRA|1[ªa])\s+TURMA$/i.test(line)) { currentOrgao = 'Primeira Turma'; continue; }
    if (/^(?:\d+\s+)?(?:SEGUNDA|2[ªa])\s+TURMA$/i.test(line)) { currentOrgao = 'Segunda Turma'; continue; }
    if (/^REPERCUSS[ÃA]O\s+GERAL$/i.test(line)) continue;
    if (/^SUM[ÁA]RIO$/i.test(line)) continue;
    if (/^Inova[çc][õo]es\s+Legislativas/i.test(line)) break;
    if (/^Outras\s+Informa[çc][õo]es/i.test(line)) break;

    // Detect ramo do direito
    if (/^DIREITO\s+/i.test(line) && line === line.toUpperCase() && line.length < 150) {
      currentRamo = line.trim();
      continue;
    }

    // Detect tema - lines that are titles (typically all caps or specific patterns)
    const isTema = (
      (line.length > 15 && line.length < 300 && /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{5,}/.test(line) && !/^\d/.test(line) && 
       !line.startsWith('DIREITO') && !line.startsWith('PLEN') && !line.startsWith('TURMA') &&
       !line.startsWith('REPERCUSS') && !line.startsWith('SUMÁRIO') &&
       line === line.toUpperCase())
    );

    // Also detect by HTML patterns - bold titles
    const boldTemaMatch = line.match(/^(.{15,250})$/);
    const isLikelyTema = isTema || (
      boldTemaMatch && 
      lines[i+1]?.trim()?.length === 0 && 
      /^(RE|ADI|ADPF|ADC|HC|MS|RMS|Rcl|ARE|AI|AP|Pet|Inq|ACO|IF|SL|SS|STA|ADO)\s/i.test(lines[i+2]?.trim() || '')
    );

    if (isTema) {
      if (currentNota) {
        currentNota.teor = currentTeor.trim().substring(0, 5000);
        notas.push(currentNota);
      }

      currentNota = {
        orgao: currentOrgao,
        ramo: currentRamo || null,
        tema: line.trim(),
        destaque: null,
        teor: '',
        processo: null,
        relator: null,
      };
      currentTeor = '';
      continue;
    }

    if (currentNota) {
      currentTeor += line + '\n';

      if (!currentNota.relator) {
        const relMatch = line.match(/(?:relator[a]?)\s+Minist(?:ro|ra)\s+([^,\n]+)/i);
        if (relMatch) currentNota.relator = relMatch[1].trim();
      }

      if (!currentNota.processo) {
        const procMatch = line.match(/((?:RE|ADI|ADPF|ADC|HC|MS|RMS|Rcl|ARE|AI|AP|Pet|Inq|ACO|IF|SL|SS|STA|ADO)\s*[\d.\/\-]+(?:\/\w{2})?)/);
        if (procMatch) currentNota.processo = procMatch[1].trim();
      }

      if (!currentNota.destaque && line.length > 30 && line.length < 500) {
        if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(line) && line.includes('.') && !line.startsWith('(')) {
          currentNota.destaque = line.substring(0, 500);
        }
      }
    }
  }

  if (currentNota) {
    currentNota.teor = currentTeor.trim().substring(0, 5000);
    notas.push(currentNota);
  }

  return {
    data: dataPublicacao,
    notas: notas.filter(n => n.tema && n.tema.length > 5).slice(0, 50),
  };
}
