import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RadarConfig {
  categoria: string;
  filtros?: string[];
}

const CODIGO_RADAR_MAP: Record<string, RadarConfig> = {
  // Constitucional
  "Constituição Federal": { categoria: "constitucional" },

  // Códigos principais
  "Código Penal": { categoria: "codigos", filtros: ["2.848", "Código Penal"] },
  "Código Civil": { categoria: "codigos", filtros: ["10.406", "Código Civil"] },
  "Código de Processo Civil": { categoria: "codigos", filtros: ["13.105", "Processo Civil"] },
  "Código de Processo Penal": { categoria: "codigos", filtros: ["3.689", "Processo Penal"] },
  "CLT": { categoria: "codigos", filtros: ["5.452", "Leis do Trabalho"] },
  "Código de Defesa do Consumidor": { categoria: "codigos", filtros: ["8.078", "Defesa do Consumidor"] },
  "Código Tributário Nacional": { categoria: "codigos", filtros: ["5.172", "Tributário Nacional"] },
  "Código de Trânsito": { categoria: "codigos", filtros: ["9.503", "Trânsito"] },
  "Código Eleitoral": { categoria: "codigos", filtros: ["4.737", "Eleitoral"] },
  "Código Penal Militar": { categoria: "codigos", filtros: ["1.001", "Penal Militar"] },
  "Código Comercial": { categoria: "codigos", filtros: ["556", "Comercial"] },
  "Código de Águas": { categoria: "codigos", filtros: ["24.643", "Águas"] },
  "Código Brasileiro de Aeronáutica": { categoria: "codigos", filtros: ["7.565", "Aeronáutica"] },
  "Código de Minas": { categoria: "codigos", filtros: ["227", "Minas"] },
  "Código de Processo Penal Militar": { categoria: "codigos", filtros: ["1.002", "Processo Penal Militar"] },
  "Código Brasileiro de Telecomunicações": { categoria: "codigos", filtros: ["4.117", "Telecomunicações"] },
  "Código Florestal": { categoria: "codigos", filtros: ["12.651", "Florestal"] },
  "Código de Caça": { categoria: "codigos", filtros: ["5.197", "Caça"] },
  "Código de Pesca": { categoria: "codigos", filtros: ["11.959", "Pesca"] },
  "Código de Propriedade Industrial": { categoria: "codigos", filtros: ["9.279", "Propriedade Industrial"] },
  "Código de Defesa do Usuário": { categoria: "codigos", filtros: ["13.460", "Defesa do Usuário"] },

  // Estatutos
  "ECA": { categoria: "estatutos", filtros: ["8.069", "Criança"] },
  "Estatuto do Idoso": { categoria: "estatutos", filtros: ["10.741", "Idoso"] },
  "Estatuto da OAB": { categoria: "estatutos", filtros: ["8.906", "OAB"] },
  "Estatuto da Cidade": { categoria: "estatutos", filtros: ["10.257", "Cidade"] },
  "Estatuto da Pessoa com Deficiência": { categoria: "estatutos", filtros: ["13.146", "Deficiência"] },
  "Estatuto do Desarmamento": { categoria: "estatutos", filtros: ["10.826", "Desarmamento"] },
  "Estatuto da Igualdade Racial": { categoria: "estatutos", filtros: ["12.288", "Igualdade Racial"] },
  "Estatuto do Torcedor": { categoria: "estatutos", filtros: ["10.671", "Torcedor"] },
  "Estatuto dos Militares": { categoria: "estatutos", filtros: ["6.880", "Militares"] },
  "Estatuto da Terra": { categoria: "estatutos", filtros: ["4.504", "Terra"] },
  "Estatuto da Migração": { categoria: "estatutos", filtros: ["13.445", "Migração"] },
  "Estatuto da Juventude": { categoria: "estatutos", filtros: ["12.852", "Juventude"] },
  "Estatuto do Índio": { categoria: "estatutos", filtros: ["6.001", "Índio"] },
  "Estatuto do Refugiado": { categoria: "estatutos", filtros: ["9.474", "Refugiado"] },
  "Estatuto da Metrópole": { categoria: "estatutos", filtros: ["13.089", "Metrópole"] },
  "Estatuto do Desporto": { categoria: "estatutos", filtros: ["11.438", "Desporto"] },
  "Estatuto da MPE": { categoria: "estatutos", filtros: ["123", "Microempresa"] },
  "Estatuto Segurança Privada": { categoria: "estatutos", filtros: ["14.967", "Segurança Privada"] },
  "Estatuto Magistério Superior": { categoria: "estatutos", filtros: ["Magistério"] },
  "Estatuto Pessoa com Câncer": { categoria: "estatutos", filtros: ["14.238", "Câncer"] },

  // Legislação Penal Especial
  "Lei de Execução Penal": { categoria: "penal", filtros: ["7.210", "Execução Penal"] },
  "Lei Maria da Penha": { categoria: "penal", filtros: ["11.340", "Maria da Penha"] },
  "Lei de Drogas": { categoria: "penal", filtros: ["11.343", "Drogas"] },
  "Organizações Criminosas": { categoria: "penal", filtros: ["12.850", "Organizações Criminosas"] },
  "Lavagem de Dinheiro": { categoria: "penal", filtros: ["9.613", "Lavagem"] },
  "Interceptação Telefônica": { categoria: "penal", filtros: ["9.296", "Interceptação"] },
  "Crimes Hediondos": { categoria: "penal", filtros: ["8.072", "Hediondos"] },
  "Tortura": { categoria: "penal", filtros: ["9.455", "Tortura"] },
  "Abuso de Autoridade": { categoria: "penal", filtros: ["13.869", "Abuso de Autoridade"] },
  "Juizados Especiais": { categoria: "penal", filtros: ["9.099", "Juizados"] },
  "Pacote Anticrime": { categoria: "penal", filtros: ["13.964", "Anticrime"] },
  "Crimes Contra o Estado Democrático": { categoria: "penal", filtros: ["14.197", "Estado Democrático"] },

  // Leis Ordinárias
  "LINDB": { categoria: "ordinarias", filtros: ["4.657", "LINDB"] },
  "Mandado de Segurança": { categoria: "ordinarias", filtros: ["12.016", "Mandado"] },
  "Habeas Data": { categoria: "ordinarias", filtros: ["9.507", "Habeas Data"] },
  "Marco Civil da Internet": { categoria: "ordinarias", filtros: ["12.965", "Marco Civil"] },
  "Arbitragem": { categoria: "ordinarias", filtros: ["9.307", "Arbitragem"] },
  "Inquilinato": { categoria: "ordinarias", filtros: ["8.245", "Inquilinato"] },
  "Desapropriação": { categoria: "ordinarias", filtros: ["3.365", "Desapropriação"] },
  "Meio Ambiente": { categoria: "ordinarias", filtros: ["6.938", "Meio Ambiente"] },
  "Recuperação e Falência": { categoria: "ordinarias", filtros: ["11.101", "Falência"] },
  "Crimes Ambientais": { categoria: "ordinarias", filtros: ["9.605", "Crimes Ambientais"] },
  "Feminicídio": { categoria: "ordinarias", filtros: ["13.104", "Feminicídio"] },
  "Antiterrorismo": { categoria: "ordinarias", filtros: ["13.260", "Antiterrorismo"] },
  "Crimes Sistema Financeiro": { categoria: "ordinarias", filtros: ["7.492", "Sistema Financeiro"] },
  "Crimes Ordem Tributária": { categoria: "ordinarias", filtros: ["8.137", "Ordem Tributária"] },
  "Ficha Limpa": { categoria: "ordinarias", filtros: ["135", "Ficha Limpa"] },
  "Crimes de Responsabilidade": { categoria: "ordinarias", filtros: ["1.079", "Responsabilidade"] },
  "Crimes Transnacionais": { categoria: "ordinarias", filtros: ["5.015", "Transnacionais"] },
  "Improbidade": { categoria: "ordinarias", filtros: ["8.429", "Improbidade"] },
  "Anticorrupção": { categoria: "ordinarias", filtros: ["12.846", "Anticorrupção"] },
  "Mediação": { categoria: "ordinarias", filtros: ["13.140", "Mediação"] },
  "Licitações": { categoria: "ordinarias", filtros: ["14.133", "Licitações"] },
  "Ação Popular": { categoria: "ordinarias", filtros: ["4.717", "Ação Popular"] },
  "Registros Públicos": { categoria: "ordinarias", filtros: ["6.015", "Registros Públicos"] },
  "Ação Civil Pública": { categoria: "ordinarias", filtros: ["7.347", "Ação Civil Pública"] },
  "Legislação Tributária": { categoria: "ordinarias", filtros: ["9.430", "Legislação Tributária"] },
  "LGPD": { categoria: "ordinarias", filtros: ["13.709", "LGPD", "Dados Pessoais"] },
  "Processo Administrativo": { categoria: "ordinarias", filtros: ["9.784", "Processo Administrativo"] },
  "ADI e ADC": { categoria: "ordinarias", filtros: ["9.868", "ADI"] },
  "Acesso à Informação": { categoria: "ordinarias", filtros: ["12.527", "Acesso"] },
  "LRF": { categoria: "ordinarias", filtros: ["101", "Responsabilidade Fiscal"] },
  "Servidor Público": { categoria: "ordinarias", filtros: ["8.112", "Servidor"] },
  "Contravençoes Penais": { categoria: "ordinarias", filtros: ["3.688", "Contravençoes"] },
  "Prisão Temporária": { categoria: "ordinarias", filtros: ["7.960", "Prisão Temporária"] },
  "Identificação Criminal": { categoria: "ordinarias", filtros: ["12.037", "Identificação Criminal"] },
  "Sociedades Anônimas": { categoria: "ordinarias", filtros: ["6.404", "Sociedades Anônimas"] },
  "Concessões": { categoria: "ordinarias", filtros: ["8.987", "Concessões"] },
  "PPP": { categoria: "ordinarias", filtros: ["11.079", "PPP", "Parceria"] },
  "Ministério Público da União": { categoria: "ordinarias", filtros: ["75", "Ministério Público"] },
  "Defensoria Pública": { categoria: "ordinarias", filtros: ["80", "Defensoria"] },
  "Ética do Servidor": { categoria: "decretos", filtros: ["1.171", "Ética"] },

  // Previdenciário
  "Custeio": { categoria: "previdenciario", filtros: ["8.212", "Custeio"] },
  "Benefícios": { categoria: "previdenciario", filtros: ["8.213", "Benefícios"] },
  "Previdência Complementar": { categoria: "previdenciario" },
};

function findConfig(codigoNome: string): RadarConfig | null {
  // Direct match
  if (CODIGO_RADAR_MAP[codigoNome]) return CODIGO_RADAR_MAP[codigoNome];
  
  // Partial match
  const lower = codigoNome.toLowerCase();
  for (const [key, config] of Object.entries(CODIGO_RADAR_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return config;
    }
  }
  
  return null;
}

export function useRadarInline(codigoNome?: string) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const config = codigoNome ? findConfig(codigoNome) : null;

  const fetchData = useCallback(async () => {
    if (!config) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from("raio_x_legislativo" as any)
        .select("*, resenha_diaria(id, numero_lei, ementa, data_publicacao, url_planalto, artigos, texto_formatado, explicacao_lei)")
        .eq("categoria", config.categoria)
        .order("created_at", { ascending: false })
        .limit(500);

      if (config.filtros) {
        const orFilter = config.filtros.map(f => `lei_afetada.ilike.%${f}%`).join(',');
        query = query.or(orFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Erro ao buscar radar inline:", err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, isLoading, hasConfig: !!config };
}
