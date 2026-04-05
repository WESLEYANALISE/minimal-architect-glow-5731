/**
 * Mapeamento Universal de Códigos - FONTE ÚNICA DA VERDADE
 * 
 * Objeto unificado com: slug → { tableName, displayName, lawNumber }
 * Usado por CodigoView, EstatutoView (migrado), SumulaView (migrado), e demais componentes.
 */

export interface LawMetadata {
  tableName: string;
  displayName: string;
  lawNumber?: string;
  /** Código curto legado usado por edge functions (ex: 'cp', 'eca') */
  codigoEdge?: string;
  /** Tipo da legislação para agrupamento */
  tipo?: 'codigo' | 'estatuto' | 'sumula' | 'lei' | 'decreto';
  /** Label customizado para itens (ex: "Súmula", "Enunciado") */
  itemLabel?: string;
  /** Campo de texto no banco (para súmulas que usam campo diferente) */
  textField?: string;
  /** Campo de título no banco (para súmulas) */
  titleField?: string;
}

export const LAW_METADATA: Record<string, LawMetadata> = {
  // ===== CÓDIGOS =====
  cc: { tableName: 'CC - Código Civil', displayName: 'Código Civil', lawNumber: 'Lei nº 10.406/2002', tipo: 'codigo' },
  cp: { tableName: 'CP - Código Penal', displayName: 'Código Penal', lawNumber: 'Decreto-Lei nº 2.848/1940', tipo: 'codigo' },
  cpc: { tableName: 'CPC – Código de Processo Civil', displayName: 'Código de Processo Civil', lawNumber: 'Lei nº 13.105/2015', tipo: 'codigo' },
  cpp: { tableName: 'CPP – Código de Processo Penal', displayName: 'Código de Processo Penal', lawNumber: 'Decreto-Lei nº 3.689/1941', tipo: 'codigo' },
  cf: { tableName: 'CF - Constituição Federal', displayName: 'Constituição Federal', lawNumber: 'de 5 de outubro de 1988', tipo: 'codigo' },
  clt: { tableName: 'CLT - Consolidação das Leis do Trabalho', displayName: 'Consolidação das Leis do Trabalho', lawNumber: 'Decreto-Lei nº 5.452/1943', tipo: 'codigo' },
  cdc: { tableName: 'CDC – Código de Defesa do Consumidor', displayName: 'Código de Defesa do Consumidor', lawNumber: 'Lei nº 8.078/1990', tipo: 'codigo' },
  ctn: { tableName: 'CTN – Código Tributário Nacional', displayName: 'Código Tributário Nacional', lawNumber: 'Lei nº 5.172/1966', tipo: 'codigo' },
  ctb: { tableName: 'CTB Código de Trânsito Brasileiro', displayName: 'Código de Trânsito Brasileiro', lawNumber: 'Lei nº 9.503/1997', tipo: 'codigo' },
  ce: { tableName: 'CE – Código Eleitoral', displayName: 'Código Eleitoral', lawNumber: 'Lei nº 4.737/1965', tipo: 'codigo' },
  ca: { tableName: 'CA - Código de Águas', displayName: 'Código de Águas', lawNumber: 'Decreto nº 24.643/1934', tipo: 'codigo' },
  cba: { tableName: 'CBA Código Brasileiro de Aeronáutica', displayName: 'Código Brasileiro de Aeronáutica', lawNumber: 'Lei nº 7.565/1986', tipo: 'codigo' },
  cbt: { tableName: 'CBT Código Brasileiro de Telecomunicações', displayName: 'Código Brasileiro de Telecomunicações', lawNumber: 'Lei nº 4.117/1962', tipo: 'codigo' },
  ccom: { tableName: 'CCOM – Código Comercial', displayName: 'Código Comercial', lawNumber: 'Lei nº 556/1850', tipo: 'codigo' },
  cdm: { tableName: 'CDM – Código de Minas', displayName: 'Código de Minas', lawNumber: 'Decreto-Lei nº 227/1967', tipo: 'codigo' },
  cpm: { tableName: 'CPM – Código Penal Militar', displayName: 'Código Penal Militar', lawNumber: 'Decreto-Lei nº 1.001/1969', tipo: 'codigo' },
  cppm: { tableName: 'CPPM – Código de Processo Penal Militar', displayName: 'Código de Processo Penal Militar', lawNumber: 'Decreto-Lei nº 1.002/1969', tipo: 'codigo' },
  cflorestal: { tableName: 'CF - Código Florestal', displayName: 'Código Florestal', lawNumber: 'Lei nº 12.651/2012', tipo: 'codigo' },
  ccaca: { tableName: 'CC - Código de Caça', displayName: 'Código de Caça', lawNumber: 'Lei nº 5.197/1967', tipo: 'codigo' },
  cpesca: { tableName: 'CP - Código de Pesca', displayName: 'Código de Pesca', lawNumber: 'Lei nº 11.959/2009', tipo: 'codigo' },
  cpi: { tableName: 'CPI - Código de Propriedade Industrial', displayName: 'Código de Propriedade Industrial', lawNumber: 'Lei nº 9.279/1996', tipo: 'codigo' },
  cdus: { tableName: 'CDUS - Código de Defesa do Usuário', displayName: 'Código de Defesa do Usuário', lawNumber: 'Lei nº 13.460/2017', tipo: 'codigo' },

  // ===== LEIS ORDINÁRIAS E ESPECIAIS =====
  'lei-beneficios': { tableName: 'LEI 8213 - Benefícios', displayName: 'Lei de Benefícios da Previdência Social', lawNumber: 'Lei nº 8.213/1991', tipo: 'lei' },
  'lei-custeio': { tableName: 'LEI 8212 - Custeio', displayName: 'Lei de Custeio da Previdência Social', lawNumber: 'Lei nº 8.212/1991', tipo: 'lei' },
  'lei-improbidade': { tableName: 'LEI 8429 - IMPROBIDADE', displayName: 'Lei de Improbidade Administrativa', lawNumber: 'Lei nº 8.429/1992', tipo: 'lei' },
  'lei-acesso-informacao': { tableName: 'LEI 12527 - ACESSO INFORMACAO', displayName: 'Lei de Acesso à Informação', lawNumber: 'Lei nº 12.527/2011', tipo: 'lei' },
  'lei-anticorrupcao': { tableName: 'LEI 12846 - ANTICORRUPCAO', displayName: 'Lei Anticorrupção', lawNumber: 'Lei nº 12.846/2013', tipo: 'lei' },
  'lei-mediacao': { tableName: 'LEI 13140 - MEDIACAO', displayName: 'Lei de Mediação', lawNumber: 'Lei nº 13.140/2015', tipo: 'lei' },
  'lei-lgpd': { tableName: 'LEI 13709 - LGPD', displayName: 'Lei Geral de Proteção de Dados', lawNumber: 'Lei nº 13.709/2018', tipo: 'lei' },
  'lei-lrf': { tableName: 'LC 101 - LRF', displayName: 'Lei de Responsabilidade Fiscal', lawNumber: 'LC nº 101/2000', tipo: 'lei' },
  'lei-licitacoes': { tableName: 'LEI 14133 - LICITACOES', displayName: 'Lei de Licitações e Contratos', lawNumber: 'Lei nº 14.133/2021', tipo: 'lei' },
  'lei-acao-popular': { tableName: 'LEI 4717 - ACAO POPULAR', displayName: 'Lei da Ação Popular', lawNumber: 'Lei nº 4.717/1965', tipo: 'lei' },
  'lei-registros-publicos': { tableName: 'LEI 6015 - REGISTROS PUBLICOS', displayName: 'Lei de Registros Públicos', lawNumber: 'Lei nº 6.015/1973', tipo: 'lei' },
  'lei-acao-civil-publica': { tableName: 'LEI 7347 - ACAO CIVIL PUBLICA', displayName: 'Lei da Ação Civil Pública', lawNumber: 'Lei nº 7.347/1985', tipo: 'lei' },
  'lei-juizados-civeis': { tableName: 'LEI 9099 - JUIZADOS CIVEIS', displayName: 'Lei dos Juizados Especiais', lawNumber: 'Lei nº 9.099/1995', tipo: 'lei' },
  'lei-legislacao-tributaria': { tableName: 'LEI 9430 - LEGISLACAO TRIBUTARIA', displayName: 'Lei da Legislação Tributária', lawNumber: 'Lei nº 9.430/1996', tipo: 'lei' },
  'lei-processo-administrativo': { tableName: 'LEI 9784 - PROCESSO ADMINISTRATIVO', displayName: 'Lei do Processo Administrativo', lawNumber: 'Lei nº 9.784/1999', tipo: 'lei' },
  'lei-adi-adc': { tableName: 'LEI 9868 - ADI E ADC', displayName: 'Lei da ADI e ADC', lawNumber: 'Lei nº 9.868/1999', tipo: 'lei' },

  // Legislação Penal Especial
  'lei-lep': { tableName: 'Lei 7.210 de 1984 - Lei de Execução Penal', displayName: 'Lei de Execução Penal', lawNumber: 'Lei nº 7.210/1984', tipo: 'lei' },
  'lei-drogas': { tableName: 'Lei 11.343 de 2006 - Lei de Drogas', displayName: 'Lei de Drogas', lawNumber: 'Lei nº 11.343/2006', tipo: 'lei' },
  'lei-maria-penha': { tableName: 'Lei 11.340 de 2006 - Maria da Penha', displayName: 'Lei Maria da Penha', lawNumber: 'Lei nº 11.340/2006', tipo: 'lei' },
  'lei-crimes-hediondos': { tableName: 'Lei 8.072 de 1990 - Crimes Hediondos', displayName: 'Lei de Crimes Hediondos', lawNumber: 'Lei nº 8.072/1990', tipo: 'lei' },
  'lei-tortura': { tableName: 'Lei 9.455 de 1997 - Tortura', displayName: 'Lei de Tortura', lawNumber: 'Lei nº 9.455/1997', tipo: 'lei' },
  'lei-organizacoes-criminosas': { tableName: 'Lei 12.850 de 2013 - Organizações Criminosas', displayName: 'Lei de Organizações Criminosas', lawNumber: 'Lei nº 12.850/2013', tipo: 'lei' },
  'lei-interceptacao-telefonica': { tableName: 'Lei 9.296 de 1996 - Interceptação Telefônica', displayName: 'Lei de Interceptação Telefônica', lawNumber: 'Lei nº 9.296/1996', tipo: 'lei' },
  'lei-lavagem-dinheiro': { tableName: 'LLD - Lei de Lavagem de Dinheiro', displayName: 'Lei de Lavagem de Dinheiro', lawNumber: 'Lei nº 9.613/1998', tipo: 'lei' },
  'lei-crimes-democraticos': { tableName: 'Lei 14.197 de 2021 - Crimes Contra o Estado Democrático', displayName: 'Lei de Crimes Democráticos', lawNumber: 'Lei nº 14.197/2021', tipo: 'lei' },
  'lei-abuso-autoridade': { tableName: 'Lei 13.869 de 2019 - Abuso de Autoridade', displayName: 'Lei de Abuso de Autoridade', lawNumber: 'Lei nº 13.869/2019', tipo: 'lei' },
  'lei-pacote-anticrime': { tableName: 'Lei 13.964 de 2019 - Pacote Anticrime', displayName: 'Pacote Anticrime', lawNumber: 'Lei nº 13.964/2019', tipo: 'lei' },
  'lei-juizados-especiais': { tableName: 'Lei 9.099 de 1995 - Juizados Especiais', displayName: 'Juizados Especiais Cíveis e Criminais', lawNumber: 'Lei nº 9.099/1995', tipo: 'lei' },
  'lei-crimes-ambientais': { tableName: 'LEI 9605 - Crimes Ambientais', displayName: 'Lei de Crimes Ambientais', lawNumber: 'Lei nº 9.605/1998', tipo: 'lei' },
  'lei-falencia': { tableName: 'LEI 11101 - Recuperação e Falência', displayName: 'Lei de Recuperação e Falência', lawNumber: 'Lei nº 11.101/2005', tipo: 'lei' },
  'lei-feminicidio': { tableName: 'LEI 13104 - Feminicídio', displayName: 'Lei do Feminicídio', lawNumber: 'Lei nº 13.104/2015', tipo: 'lei' },
  'lei-antiterrorismo': { tableName: 'LEI 13260 - Antiterrorismo', displayName: 'Lei Antiterrorismo', lawNumber: 'Lei nº 13.260/2016', tipo: 'lei' },
  'lei-crimes-financeiro': { tableName: 'LEI 7492 - Crimes Sistema Financeiro', displayName: 'Crimes contra o Sistema Financeiro', lawNumber: 'Lei nº 7.492/1986', tipo: 'lei' },
  'lei-crimes-tributario': { tableName: 'LEI 8137 - Crimes Ordem Tributária', displayName: 'Crimes contra a Ordem Tributária', lawNumber: 'Lei nº 8.137/1990', tipo: 'lei' },
  'lei-ficha-limpa': { tableName: 'LC 135 - Ficha Limpa', displayName: 'Lei da Ficha Limpa', lawNumber: 'LC nº 135/2010', tipo: 'lei' },
  'lei-crimes-responsabilidade': { tableName: 'LEI 1079 - Crimes Responsabilidade', displayName: 'Crimes de Responsabilidade', lawNumber: 'Lei nº 1.079/1950', tipo: 'lei' },
  'lei-crimes-transnacionais': { tableName: 'LEI 5015 - Crimes Transnacionais', displayName: 'Crimes Transnacionais', lawNumber: 'Lei nº 5.015/2004', tipo: 'lei' },

  // Novas Leis de Prioridade Alta
  'lei-servidor': { tableName: 'LEI 8112 - SERVIDOR PUBLICO', displayName: 'Estatuto do Servidor Público Federal', lawNumber: 'Lei nº 8.112/1990', tipo: 'lei' },
  'lei-contravencoes': { tableName: 'DL 3688 - CONTRAVENCOES PENAIS', displayName: 'Lei das Contravenções Penais', lawNumber: 'DL nº 3.688/1941', tipo: 'lei' },
  'lei-prisao-temporaria': { tableName: 'LEI 7960 - PRISAO TEMPORARIA', displayName: 'Lei de Prisão Temporária', lawNumber: 'Lei nº 7.960/1989', tipo: 'lei' },
  'lei-identificacao-criminal': { tableName: 'LEI 12037 - IDENTIFICACAO CRIMINAL', displayName: 'Lei de Identificação Criminal', lawNumber: 'Lei nº 12.037/2009', tipo: 'lei' },
  'lei-sa': { tableName: 'LEI 6404 - SOCIEDADES ANONIMAS', displayName: 'Lei das Sociedades Anônimas', lawNumber: 'Lei nº 6.404/1976', tipo: 'lei' },
  'lei-concessoes': { tableName: 'LEI 8987 - CONCESSOES', displayName: 'Lei de Concessões', lawNumber: 'Lei nº 8.987/1995', tipo: 'lei' },
  'lei-ppp': { tableName: 'LEI 11079 - PPP', displayName: 'Lei das PPPs', lawNumber: 'Lei nº 11.079/2004', tipo: 'lei' },
  'lei-mpu': { tableName: 'LC 75 - MINISTERIO PUBLICO UNIAO', displayName: 'Lei Orgânica do Ministério Público da União', lawNumber: 'LC nº 75/1993', tipo: 'lei' },
  'lei-defensoria': { tableName: 'LC 80 - DEFENSORIA PUBLICA', displayName: 'Lei Orgânica da Defensoria Pública', lawNumber: 'LC nº 80/1994', tipo: 'lei' },
  'decreto-etica': { tableName: 'DECRETO 1171 - ETICA SERVIDOR', displayName: 'Código de Ética do Servidor Público', lawNumber: 'Decreto nº 1.171/1994', tipo: 'decreto' },
  'complementar': { tableName: 'LC 109 - PREVIDENCIA COMPLEMENTAR', displayName: 'Lei da Previdência Complementar', lawNumber: 'LC nº 109/2001', tipo: 'lei' },

  // ===== ESTATUTOS =====
  'estatuto-cidade': { tableName: 'ESTATUTO - CIDADE', displayName: 'Estatuto da Cidade', lawNumber: 'Lei nº 10.257/2001', tipo: 'estatuto', codigoEdge: 'cidade' },
  'estatuto-desarmamento': { tableName: 'ESTATUTO - DESARMAMENTO', displayName: 'Estatuto do Desarmamento', lawNumber: 'Lei nº 10.826/2003', tipo: 'estatuto', codigoEdge: 'desarmamento' },
  'estatuto-eca': { tableName: 'ESTATUTO - ECA', displayName: 'Estatuto da Criança e do Adolescente', lawNumber: 'Lei nº 8.069/1990', tipo: 'estatuto', codigoEdge: 'eca' },
  'estatuto-idoso': { tableName: 'ESTATUTO - IDOSO', displayName: 'Estatuto do Idoso', lawNumber: 'Lei nº 10.741/2003', tipo: 'estatuto', codigoEdge: 'idoso' },
  'estatuto-igualdade-racial': { tableName: 'ESTATUTO - IGUALDADE RACIAL', displayName: 'Estatuto da Igualdade Racial', lawNumber: 'Lei nº 12.288/2010', tipo: 'estatuto', codigoEdge: 'racial' },
  'estatuto-oab': { tableName: 'ESTATUTO - OAB', displayName: 'Estatuto da OAB', lawNumber: 'Lei nº 8.906/1994', tipo: 'estatuto', codigoEdge: 'oab' },
  'estatuto-pessoa-deficiencia': { tableName: 'ESTATUTO - PESSOA COM DEFICIÊNCIA', displayName: 'Estatuto da Pessoa com Deficiência', lawNumber: 'Lei nº 13.146/2015', tipo: 'estatuto', codigoEdge: 'pcd' },
  'estatuto-torcedor': { tableName: 'ESTATUTO - TORCEDOR', displayName: 'Estatuto do Torcedor', lawNumber: 'Lei nº 10.671/2003', tipo: 'estatuto', codigoEdge: 'torcedor' },
  'estatuto-militares': { tableName: 'EST - Estatuto dos Militares', displayName: 'Estatuto dos Militares', lawNumber: 'Lei nº 6.880/1980', tipo: 'estatuto', codigoEdge: 'emilitares' },
  'estatuto-terra': { tableName: 'EST - Estatuto da Terra', displayName: 'Estatuto da Terra', lawNumber: 'Lei nº 4.504/1964', tipo: 'estatuto', codigoEdge: 'eterra' },
  'estatuto-migracao': { tableName: 'EST - Estatuto da Migração', displayName: 'Estatuto da Migração', lawNumber: 'Lei nº 13.445/2017', tipo: 'estatuto', codigoEdge: 'emigracao' },
  'estatuto-juventude': { tableName: 'EST - Estatuto da Juventude', displayName: 'Estatuto da Juventude', lawNumber: 'Lei nº 12.852/2013', tipo: 'estatuto', codigoEdge: 'ejuventude' },
  'estatuto-indio': { tableName: 'EST - Estatuto do Índio', displayName: 'Estatuto do Índio', lawNumber: 'Lei nº 6.001/1973', tipo: 'estatuto', codigoEdge: 'eindio' },
  'estatuto-refugiado': { tableName: 'EST - Estatuto do Refugiado', displayName: 'Estatuto do Refugiado', lawNumber: 'Lei nº 9.474/1997', tipo: 'estatuto', codigoEdge: 'erefugiado' },
  'estatuto-metropole': { tableName: 'EST - Estatuto da Metrópole', displayName: 'Estatuto da Metrópole', lawNumber: 'Lei nº 13.089/2015', tipo: 'estatuto', codigoEdge: 'emetropole' },
  'estatuto-desporto': { tableName: 'EST - Estatuto do Desporto', displayName: 'Estatuto do Desporto', lawNumber: 'Lei nº 9.615/1998', tipo: 'estatuto', codigoEdge: 'edesporto' },
  'estatuto-mpe': { tableName: 'EST - Estatuto da MPE', displayName: 'Estatuto da Micro e Pequena Empresa', lawNumber: 'LC nº 123/2006', tipo: 'estatuto', codigoEdge: 'empe' },
  'estatuto-seguranca-privada': { tableName: 'EST - Estatuto Segurança Privada', displayName: 'Estatuto da Segurança Privada', lawNumber: 'Lei nº 14.967/2024', tipo: 'estatuto', codigoEdge: 'eseguranca' },
  'estatuto-magisterio': { tableName: 'EST - Estatuto Magistério Superior', displayName: 'Estatuto do Magistério Superior', lawNumber: 'Lei nº 12.772/2012', tipo: 'estatuto', codigoEdge: 'emagisterio' },
  'estatuto-cancer': { tableName: 'EST - Estatuto Pessoa com Câncer', displayName: 'Estatuto da Pessoa com Câncer', lawNumber: 'Lei nº 14.238/2021', tipo: 'estatuto', codigoEdge: 'ecancer' },

  // ===== SÚMULAS =====
  'sumula-vinculantes': { tableName: 'SUMULAS VINCULANTES', displayName: 'Súmulas Vinculantes STF', tipo: 'sumula', itemLabel: 'Súmula', textField: 'Texto da Súmula', titleField: 'Título da Súmula' },
  'sumula-stf': { tableName: 'SUMULAS STF', displayName: 'Súmulas STF', tipo: 'sumula', itemLabel: 'Súmula', textField: 'Texto da Súmula', titleField: 'Título da Súmula' },
  'sumula-stj': { tableName: 'SUMULAS STJ', displayName: 'Súmulas STJ', tipo: 'sumula', itemLabel: 'Súmula', textField: 'Texto da Súmula', titleField: 'Título da Súmula' },
  'sumula-tst': { tableName: 'SUMULAS TST', displayName: 'Súmulas TST', tipo: 'sumula', itemLabel: 'Súmula', textField: 'Texto da Súmula', titleField: 'Título da Súmula' },
  'sumula-tse': { tableName: 'SUMULAS TSE', displayName: 'Súmulas TSE', tipo: 'sumula', itemLabel: 'Súmula', textField: 'Texto da Súmula', titleField: 'Título da Súmula' },
  'sumula-stm': { tableName: 'SUMULAS STM', displayName: 'Súmulas STM', tipo: 'sumula', itemLabel: 'Súmula', textField: 'Texto da Súmula', titleField: 'Título da Súmula' },
  'sumula-tcu': { tableName: 'SUMULAS TCU', displayName: 'Súmulas TCU', tipo: 'sumula', itemLabel: 'Súmula', textField: 'Texto da Súmula', titleField: 'Título da Súmula' },
  'sumula-cnmp': { tableName: 'ENUNCIADOS CNMP', displayName: 'Enunciados CNMP', tipo: 'sumula', itemLabel: 'Enunciado', textField: 'Texto da Súmula', titleField: 'Título da Súmula' },
  'sumula-cnj': { tableName: 'ENUNCIADOS CNJ', displayName: 'Enunciados CNJ', tipo: 'sumula', itemLabel: 'Enunciado', textField: 'Texto da Súmula', titleField: 'Título da Súmula' },
};

// ===== COMPAT: Mapeamento legado slug curto → nome de tabela (usado por edge functions) =====
export const CODIGO_TO_TABLE: Record<string, string> = {};
export const TABLE_TO_CODIGO: Record<string, string> = {};

// Preencher a partir do LAW_METADATA
Object.entries(LAW_METADATA).forEach(([slug, meta]) => {
  // Para edge functions, usar codigoEdge se existir, senão o slug
  const edgeCode = meta.codigoEdge || slug;
  CODIGO_TO_TABLE[edgeCode] = meta.tableName;
  if (!TABLE_TO_CODIGO[meta.tableName]) {
    TABLE_TO_CODIGO[meta.tableName] = edgeCode;
  }
});

// Aliases legados para compatibilidade com edge functions existentes
const LEGACY_ALIASES: Record<string, string> = {
  'cppenal': 'CPP – Código de Processo Penal',
  'oab': 'ESTATUTO - OAB',
  'idoso': 'ESTATUTO - IDOSO',
  'pcd': 'ESTATUTO - PESSOA COM DEFICIÊNCIA',
  'racial': 'ESTATUTO - IGUALDADE RACIAL',
  'cidade': 'ESTATUTO - CIDADE',
  'torcedor': 'ESTATUTO - TORCEDOR',
  'eca': 'ESTATUTO - ECA',
  'desarmamento': 'ESTATUTO - DESARMAMENTO',
  'lep': 'Lei 7.210 de 1984 - Lei de Execução Penal',
  'lmp': 'Lei 11.340 de 2006 - Maria da Penha',
  'ld': 'Lei 11.343 de 2006 - Lei de Drogas',
  'loc': 'Lei 12.850 de 2013 - Organizações Criminosas',
  'lld': 'LLD - Lei de Lavagem de Dinheiro',
  'lit': 'Lei 9.296 de 1996 - Interceptação Telefônica',
  'lch': 'Lei 8.072 de 1990 - Crimes Hediondos',
  'lt': 'Lei 9.455 de 1997 - Tortura',
  'laa': 'Lei 13.869 de 2019 - Abuso de Autoridade',
  'lje': 'Lei 9.099 de 1995 - Juizados Especiais',
  'pac': 'Lei 13.964 de 2019 - Pacote Anticrime',
  'lced': 'Lei 14.197 de 2021 - Crimes Contra o Estado Democrático',
  'lindb': 'LEI 4657 - LINDB',
  'custeio': 'LEI 8212 - Custeio',
  'beneficios': 'LEI 8213 - Benefícios',
  'improbidade': 'LEI 8429 - IMPROBIDADE',
  'anticorrupcao': 'LEI 12846 - ANTICORRUPCAO',
  'mediacao': 'LEI 13140 - MEDIACAO',
  'licitacoes': 'LEI 14133 - LICITACOES',
  'acaopopular': 'LEI 4717 - ACAO POPULAR',
  'registrospublicos': 'LEI 6015 - REGISTROS PUBLICOS',
  'acaocivilpublica': 'LEI 7347 - ACAO CIVIL PUBLICA',
  'legtributaria': 'LEI 9430 - LEGISLACAO TRIBUTARIA',
  'lgpd': 'LEI 13709 - LGPD',
  'lrf': 'LC 101 - LRF',
  'complementar': 'LC 109 - PREVIDENCIA COMPLEMENTAR',
  'procadmin': 'LEI 9784 - PROCESSO ADMINISTRATIVO',
  'adiadc': 'LEI 9868 - ADI E ADC',
  'acessoinformacao': 'LEI 12527 - ACESSO INFORMACAO',
  'falencia': 'LEI 11101 - RECUPERACAO FALENCIA',
  'crimesambientais': 'LEI 9605 - CRIMES AMBIENTAIS',
  'feminicidio': 'LEI 13104 - FEMINICIDIO',
  'antiterrorismo': 'LEI 13260 - ANTITERRORISMO',
  'crimesfinanceiro': 'LEI 7492 - CRIMES SISTEMA FINANCEIRO',
  'crimestributario': 'LEI 8137 - CRIMES ORDEM TRIBUTARIA',
  'fichalimpa': 'LC 135 - FICHA LIMPA',
  'crimesresponsabilidade': 'LEI 1079 - CRIMES RESPONSABILIDADE',
  'crimestransnacionais': 'LEI 5015 - CRIMES TRANSNACIONAIS',
  'lei-servidor': 'LEI 8112 - SERVIDOR PUBLICO',
  'lei-contravencoes': 'DL 3688 - CONTRAVENCOES PENAIS',
  'lei-prisao-temporaria': 'LEI 7960 - PRISAO TEMPORARIA',
  'lei-identificacao-criminal': 'LEI 12037 - IDENTIFICACAO CRIMINAL',
  'lei-sa': 'LEI 6404 - SOCIEDADES ANONIMAS',
  'lei-concessoes': 'LEI 8987 - CONCESSOES',
  'lei-ppp': 'LEI 11079 - PPP',
  'lei-mpu': 'LC 75 - MINISTERIO PUBLICO UNIAO',
  'lei-defensoria': 'LC 80 - DEFENSORIA PUBLICA',
  'decreto-etica': 'DECRETO 1171 - ETICA SERVIDOR',
};

Object.entries(LEGACY_ALIASES).forEach(([alias, table]) => {
  if (!CODIGO_TO_TABLE[alias]) {
    CODIGO_TO_TABLE[alias] = table;
  }
  if (!TABLE_TO_CODIGO[table]) {
    TABLE_TO_CODIGO[table] = alias;
  }
});

/**
 * Obter código curto a partir do nome da tabela
 */
export function getCodigoFromTable(tableName: string): string {
  const codigo = TABLE_TO_CODIGO[tableName];
  if (!codigo) {
    console.warn(`⚠️ Código não encontrado para tabela: ${tableName}. Usando 'cp' como fallback.`);
    return 'cp';
  }
  return codigo;
}

/**
 * Obter nome da tabela a partir do código curto
 */
export function getTableFromCodigo(codigo: string): string {
  const tableName = CODIGO_TO_TABLE[codigo];
  if (!tableName) {
    console.warn(`⚠️ Tabela não encontrada para código: ${codigo}. Usando 'CP - Código Penal' como fallback.`);
    return 'CP - Código Penal';
  }
  return tableName;
}

/**
 * Obter metadata completa pelo slug da URL
 */
export function getLawMetadata(slug: string): LawMetadata | null {
  return LAW_METADATA[slug] || null;
}

/**
 * Buscar metadata pela tabela (inverso)
 */
export function getMetadataByTable(tableName: string): { slug: string; meta: LawMetadata } | null {
  for (const [slug, meta] of Object.entries(LAW_METADATA)) {
    if (meta.tableName === tableName) {
      return { slug, meta };
    }
  }
  return null;
}
