import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CODIGOS_CONFIG: Record<string, {
  nome: string;
  sigla: string;
  url_planalto: string;
  lei_afetada_texto: string;
}> = {
  cp: {
    nome: "Código Penal",
    sigla: "CP",
    url_planalto: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
    lei_afetada_texto: "o Decreto-Lei nº 2.848",
  },
  cc: {
    nome: "Código Civil",
    sigla: "CC",
    url_planalto: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
    lei_afetada_texto: "a Lei nº 10.406",
  },
  cpc: {
    nome: "Código de Processo Civil",
    sigla: "CPC",
    url_planalto: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm",
    lei_afetada_texto: "a Lei nº 13.105",
  },
  cpp: {
    nome: "Código de Processo Penal",
    sigla: "CPP",
    url_planalto: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm",
    lei_afetada_texto: "o Decreto-Lei nº 3.689",
  },
  clt: {
    nome: "Consolidação das Leis do Trabalho",
    sigla: "CLT",
    url_planalto: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm",
    lei_afetada_texto: "a Consolidação das Leis do Trabalho, aprovada pelo Decreto-Lei nº 5.452",
  },
  cdc: {
    nome: "Código de Defesa do Consumidor",
    sigla: "CDC",
    url_planalto: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
    lei_afetada_texto: "a Lei nº 8.078",
  },
  ctn: {
    nome: "Código Tributário Nacional",
    sigla: "CTN",
    url_planalto: "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm",
    lei_afetada_texto: "a Lei nº 5.172",
  },
  ctb: {
    nome: "Código de Trânsito Brasileiro",
    sigla: "CTB",
    url_planalto: "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm",
    lei_afetada_texto: "a Lei nº 9.503",
  },
  ce: {
    nome: "Código Eleitoral",
    sigla: "CE",
    url_planalto: "https://www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm",
    lei_afetada_texto: "a Lei nº 4.737",
  },
  cpm: {
    nome: "Código Penal Militar",
    sigla: "CPM",
    url_planalto: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del1001compilado.htm",
    lei_afetada_texto: "o Decreto-Lei nº 1.001",
  },
};

interface Alteracao {
  numero_lei: string;
  tipo: string;
  url: string;
  data_texto: string;
}

function extrairAlteracoes(html: string): Alteracao[] {
  const alteracoes = new Map<string, Alteracao>();

  // Remove tags HTML, normalize all whitespace including newlines
  const texto = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8239;/g, " ")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&atilde;/gi, "ã")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&Aacute;/gi, "Á")
    .replace(/&ordf;/gi, "ª")
    .replace(/&ordm;/gi, "º")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ");

  console.log("Texto normalizado (primeiros 500 chars):", texto.substring(0, 500));

  // Search for patterns - very flexible whitespace
  const LEI_REF = `((?:Lei|Decreto-Lei|Lei\\s+Complementar|Medida\\s+Provis.ria)\\s+n[ºo°]\\s*[\\d.]+(?:[,\\s]+de\\s+[\\d.]+(?:\\.[\\d]+)?)?)`;
  
  const padroes = [
    { regex: new RegExp(`\\(\\s*Reda.{1,5}o\\s+dada\\s+pel[ao]\\s+${LEI_REF}`, "gi"), tipo: "alteracao" },
    { regex: new RegExp(`\\(\\s*Inclu.do\\s+pel[ao]\\s+${LEI_REF}`, "gi"), tipo: "inclusao" },
    { regex: new RegExp(`\\(\\s*Revogado\\s+pel[ao]\\s+${LEI_REF}`, "gi"), tipo: "revogacao" },
    { regex: new RegExp(`\\(\\s*Acrescentado\\s+pel[ao]\\s+${LEI_REF}`, "gi"), tipo: "inclusao" },
    { regex: new RegExp(`\\(\\s*Vide\\s+${LEI_REF}`, "gi"), tipo: "vide" },
  ];

  for (const { regex, tipo } of padroes) {
    let match;
    while ((match = regex.exec(texto)) !== null) {
      const leiTexto = match[1].trim().replace(/\s+/g, " ");
      
      // Extrair número
      const numMatch = leiTexto.match(/n[ºo°]\s*([\d.]+)/);
      if (!numMatch) continue;
      const numero = numMatch[1];

      // Extrair data
      const dataMatch = leiTexto.match(/,\s*de\s*([\d.]+(?:\.\d+)?)/);
      const dataTxt = dataMatch ? dataMatch[1] : "";

      // Normalizar nome da lei como chave
      const tipoLei = leiTexto.match(/(Lei Complementar|Decreto-Lei|Medida Provis[oó]ria|Lei)/i)?.[1] || "Lei";
      const chave = `${tipoLei} nº ${numero}`.toLowerCase();
      
      if (!alteracoes.has(chave)) {
        // Construir URL
        const numLimpo = numero.replace(/\./g, "");
        let url: string;
        if (tipoLei.toLowerCase().includes("decreto")) {
          url = `https://www.planalto.gov.br/ccivil_03/decreto-lei/del${numLimpo}.htm`;
        } else if (tipoLei.toLowerCase().includes("complementar")) {
          url = `https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp${numLimpo}.htm`;
        } else {
          url = `https://www.planalto.gov.br/ccivil_03/leis/l${numLimpo}.htm`;
        }

        alteracoes.set(chave, {
          numero_lei: `${tipoLei} nº ${numero}`,
          tipo,
          url,
          data_texto: dataTxt,
        });
      }
    }
  }

  return Array.from(alteracoes.values());
}

function parseDataPlanalto(dataTxt: string): string | null {
  if (!dataTxt) return null;
  // Formato: "11.7.1984" ou "1.7.2020" ou "21.12.2023"
  const parts = dataTxt.split(".");
  if (parts.length === 3) {
    const dia = parts[0].padStart(2, "0");
    const mes = parts[1].padStart(2, "0");
    const ano = parts[2];
    if (ano.length === 4) return `${ano}-${mes}-${dia}`;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const codigosParaProcessar = body.codigos 
      ? (body.codigos as string[]) 
      : Object.keys(CODIGOS_CONFIG);

    const resultados: Record<string, { total: number; novos: number; erro?: string }> = {};

    for (const codigoId of codigosParaProcessar) {
      const config = CODIGOS_CONFIG[codigoId];
      if (!config) {
        resultados[codigoId] = { total: 0, novos: 0, erro: "Código não encontrado" };
        continue;
      }

      try {
        console.log(`Processando ${config.sigla} - ${config.url_planalto}`);
        
        // Fetch with proper Latin-1 encoding (Planalto uses ISO-8859-1)
        const response = await fetch(config.url_planalto, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; JurisBot/1.0)" },
        });

        if (!response.ok) {
          resultados[codigoId] = { total: 0, novos: 0, erro: `HTTP ${response.status}` };
          continue;
        }

        // Decode as Latin-1 (ISO-8859-1) since Planalto pages use this encoding
        const buffer = await response.arrayBuffer();
        const html = new TextDecoder("iso-8859-1").decode(buffer);
        console.log(`${config.sigla}: HTML com ${html.length} caracteres`);

        const alteracoes = extrairAlteracoes(html);
        console.log(`${config.sigla}: ${alteracoes.length} leis alteradoras encontradas`);

        // Log primeiras 5 para debug
        for (const a of alteracoes.slice(0, 5)) {
          console.log(`  - ${a.numero_lei} (${a.tipo}) ${a.data_texto}`);
        }

        let novosInseridos = 0;

        for (const alt of alteracoes) {
          // Verificar se já existe
          const { data: existente } = await supabase
            .from("resenha_diaria")
            .select("id")
            .eq("numero_lei", alt.numero_lei)
            .ilike("ementa", `%${config.sigla}%`)
            .limit(1);

          if (existente && existente.length > 0) continue;

          const dataPub = parseDataPlanalto(alt.data_texto);

          // Inserir na resenha_diaria
          const { data: resenha, error: errResenha } = await supabase
            .from("resenha_diaria")
            .insert({
              numero_lei: alt.numero_lei,
              ementa: `${alt.numero_lei} - ${alt.tipo === "inclusao" ? "Inclui dispositivos" : alt.tipo === "revogacao" ? "Revoga dispositivos" : alt.tipo === "vide" ? "Referência" : "Altera"} ${config.nome} (${config.sigla})`,
              data_publicacao: dataPub,
              url_planalto: alt.url,
              status: "processado",
            })
            .select("id")
            .single();

          if (errResenha) {
            console.error(`Erro inserindo resenha para ${alt.numero_lei}:`, errResenha);
            continue;
          }

          // Inserir no raio_x_legislativo
          const { error: errRaioX } = await supabase
            .from("raio_x_legislativo")
            .insert({
              resenha_id: resenha.id,
              categoria: "codigos",
              tipo_alteracao: alt.tipo,
              lei_afetada: config.lei_afetada_texto,
              artigos_afetados: [],
              relevancia: "media",
              resumo_alteracao: `${alt.numero_lei} - ${alt.tipo === "inclusao" ? "Inclui dispositivos no" : alt.tipo === "revogacao" ? "Revoga dispositivos do" : alt.tipo === "vide" ? "Referência ao" : "Altera"} ${config.nome}`,
            });

          if (errRaioX) {
            console.error(`Erro inserindo raio-x:`, errRaioX);
          } else {
            novosInseridos++;
          }
        }

        resultados[codigoId] = { total: alteracoes.length, novos: novosInseridos };
      } catch (err) {
        console.error(`Erro processando ${codigoId}:`, err);
        resultados[codigoId] = { total: 0, novos: 0, erro: String(err) };
      }
    }

    return new Response(JSON.stringify({ success: true, resultados }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro geral:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
