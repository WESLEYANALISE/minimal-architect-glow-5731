// Mapeamento de tabelas de leis para URLs oficiais do Planalto
// Usado para raspagem automática de conteúdo

export interface LeiInfo {
  tableName: string;
  url: string;
  nome: string;
  status: 'vazia' | 'parcial' | 'completa';
}

// Mapeamento: Nome exato da tabela no Supabase => URL do Planalto
export const URLS_PLANALTO: Record<string, string> = {
  // ========================
  // CÓDIGOS PRINCIPAIS
  // ========================
  'CF - Constituição Federal': 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicaocompilado.htm',
  'CC - Código Civil': 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm',
  'CP - Código Penal': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm',
  'CPC – Código de Processo Civil': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm',
  'CPP – Código de Processo Penal': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm',
  'CLT - Consolidação das Leis do Trabalho': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm',
  'CTN – Código Tributário Nacional': 'https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm',
  'CDC – Código de Defesa do Consumidor': 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm',
  'CE – Código Eleitoral': 'https://www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm',
  'CTB Código de Trânsito Brasileiro': 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm',
  
  // ========================
  // CÓDIGOS MILITARES
  // ========================
  'CPM – Código Penal Militar': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del1001compilado.htm',
  'CPPM – Código de Processo Penal Militar': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del1002compilado.htm',
  
  // ========================
  // CÓDIGOS ESPECIAIS
  // ========================
  'CA - Código de Águas': 'https://www.planalto.gov.br/ccivil_03/decreto/d24643compilado.htm',
  'CBA Código Brasileiro de Aeronáutica': 'https://www.planalto.gov.br/ccivil_03/leis/l7565compilado.htm',
  'CBT Código Brasileiro de Telecomunicações': 'https://www.planalto.gov.br/ccivil_03/leis/L4117Compilada.htm',
  'CC - Código de Caça': 'https://www.planalto.gov.br/ccivil_03/leis/L5197compilado.htm',
  'CCOM – Código Comercial': 'https://www.planalto.gov.br/ccivil_03/leis/lim/lim556compilado.htm',
  'CDM – Código de Minas': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/Del0227compilado.htm',
  'CDUS - Código de Defesa do Usuário': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13460.htm',
  'CF - Código Florestal': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/L12651compilado.htm',
  'CP - Código de Pesca': 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11959.htm',
  'CPI - Código de Propriedade Industrial': 'https://www.planalto.gov.br/ccivil_03/leis/l9279.htm',
  'LLD - Lei de Lavagem de Dinheiro': 'https://www.planalto.gov.br/ccivil_03/leis/l9613compilado.htm',

  // ========================
  // ESTATUTOS (formato ESTATUTO - NOME)
  // ========================
  'ESTATUTO - CIDADE': 'https://www.planalto.gov.br/ccivil_03/leis/leis_2001/l10257.htm',
  'ESTATUTO - DESARMAMENTO': 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826compilado.htm',
  'ESTATUTO - ECA': 'https://www.planalto.gov.br/ccivil_03/leis/l8069compilado.htm',
  'ESTATUTO - IDOSO': 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741compilado.htm',
  'ESTATUTO - IGUALDADE RACIAL': 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12288.htm',
  'ESTATUTO - OAB': 'https://www.planalto.gov.br/ccivil_03/leis/l8906compilado.htm',
  'ESTATUTO - PESSOA COM DEFICIÊNCIA': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm',
  'ESTATUTO - TORCEDOR': 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.671compilado.htm',
  
  // ========================
  // ESTATUTOS (formato EST - Estatuto)
  // ========================
  'EST - Estatuto da Juventude': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12852.htm',
  'EST - Estatuto da Metrópole': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13089.htm',
  'EST - Estatuto da Migração': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13445.htm',
  'EST - Estatuto da MPE': 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123compilado.htm',
  'EST - Estatuto da Terra': 'https://www.planalto.gov.br/ccivil_03/leis/l4504compilado.htm',
  'EST - Estatuto do Desporto': 'https://www.planalto.gov.br/ccivil_03/leis/l9615compilado.htm',
  'EST - Estatuto do Índio': 'https://www.planalto.gov.br/ccivil_03/leis/l6001.htm',
  'EST - Estatuto do Refugiado': 'https://www.planalto.gov.br/ccivil_03/leis/l9474.htm',
  'EST - Estatuto dos Militares': 'https://www.planalto.gov.br/ccivil_03/leis/l6880compilado.htm',
  'EST - Estatuto Magistério Superior': 'https://www.planalto.gov.br/ccivil_03/leis/l5540compilado.htm',
  'EST - Estatuto Pessoa com Câncer': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14238.htm',
  'EST - Estatuto Segurança Privada': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13874compilado.htm',

  // ========================
  // LEIS PENAIS ESPECIAIS
  // ========================
  'Lei 11.340 de 2006 - Maria da Penha': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm',
  'Lei 11.343 de 2006 - Lei de Drogas': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343compilado.htm',
  'Lei 12.850 de 2013 - Organizações Criminosas': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm',
  'Lei 13.869 de 2019 - Abuso de Autoridade': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13869.htm',
  'Lei 13.964 de 2019 - Pacote Anticrime': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm',
  'Lei 14.197 de 2021 - Crimes Contra o Estado Democrático': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14197.htm',
  'Lei 7.210 de 1984 - Lei de Execução Penal': 'https://www.planalto.gov.br/ccivil_03/leis/l7210compilado.htm',
  'Lei 8.072 de 1990 - Crimes Hediondos': 'https://www.planalto.gov.br/ccivil_03/leis/L8072compilada.htm',
  'Lei 9.099 de 1995 - Juizados Especiais': 'https://www.planalto.gov.br/ccivil_03/leis/l9099compilado.htm',
  'Lei 9.296 de 1996 - Interceptação Telefônica': 'https://www.planalto.gov.br/ccivil_03/leis/l9296.htm',
  'Lei 9.455 de 1997 - Tortura': 'https://www.planalto.gov.br/ccivil_03/leis/l9455.htm',

  // ========================
  // LEIS ORDINÁRIAS E COMPLEMENTARES
  // ========================
  'LEI 8213 - Benefícios': 'https://www.planalto.gov.br/ccivil_03/leis/l8213compilado.htm',
  'LEI 8212 - Custeio': 'https://www.planalto.gov.br/ccivil_03/leis/l8212compilado.htm',
  'LEI 8429 - IMPROBIDADE': 'https://www.planalto.gov.br/ccivil_03/leis/l8429compilado.htm',
  'LEI 12527 - ACESSO INFORMACAO': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm',
  'LEI 12846 - ANTICORRUPCAO': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12846.htm',
  'LEI 13140 - MEDIACAO': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13140.htm',
  'LEI 13709 - LGPD': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm',
  'LC 101 - LRF': 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm',
  'LEI 14133 - LICITACOES': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm',
  'LEI 4717 - ACAO POPULAR': 'https://www.planalto.gov.br/ccivil_03/leis/l4717.htm',
  'LEI 6015 - REGISTROS PUBLICOS': 'https://www.planalto.gov.br/ccivil_03/leis/l6015compilada.htm',
  'LEI 7347 - ACAO CIVIL PUBLICA': 'https://www.planalto.gov.br/ccivil_03/leis/l7347compilada.htm',
  'LEI 9099 - JUIZADOS CIVEIS': 'https://www.planalto.gov.br/ccivil_03/leis/l9099.htm',
  'LEI 9430 - LEGISLACAO TRIBUTARIA': 'https://www.planalto.gov.br/ccivil_03/leis/l9430compilada.htm',
  'LEI 9784 - PROCESSO ADMINISTRATIVO': 'https://www.planalto.gov.br/ccivil_03/leis/l9784.htm',
  'LEI 9868 - ADI E ADC': 'https://www.planalto.gov.br/ccivil_03/leis/l9868.htm',

  // ========================
  // LEIS PENAIS E ESPECIAIS (formato LEI XXXX - UPPERCASE)
  // ========================
  'LEI 9605 - CRIMES AMBIENTAIS': 'https://www.planalto.gov.br/ccivil_03/leis/l9605.htm',
  'LEI 11101 - RECUPERACAO FALENCIA': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101compilado.htm',
  'LEI 13104 - FEMINICIDIO': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13104.htm',
  'LEI 13260 - ANTITERRORISMO': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13260.htm',
  'LEI 7492 - CRIMES SISTEMA FINANCEIRO': 'https://www.planalto.gov.br/ccivil_03/leis/l7492.htm',
  'LEI 8137 - CRIMES ORDEM TRIBUTARIA': 'https://www.planalto.gov.br/ccivil_03/leis/l8137.htm',
  'LC 135 - FICHA LIMPA': 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp135.htm',
  'LEI 1079 - CRIMES RESPONSABILIDADE': 'https://www.planalto.gov.br/ccivil_03/leis/l1079.htm',
  'LEI 5015 - CRIMES TRANSNACIONAIS': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/decreto/d5015.htm',
  'LEI 12016 - MANDADO DE SEGURANCA': 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12016.htm',
  'LEI 12965 - MARCO CIVIL INTERNET': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm',
  'LEI 8245 - INQUILINATO': 'https://www.planalto.gov.br/ccivil_03/leis/l8245compilado.htm',
  'LEI 3365 - DESAPROPRIACAO': 'https://www.planalto.gov.br/ccivil_03/leis/l3365compilado.htm',
  'LEI 6938 - MEIO AMBIENTE': 'https://www.planalto.gov.br/ccivil_03/leis/l6938compilada.htm',
  'LEI 9307 - ARBITRAGEM': 'https://www.planalto.gov.br/ccivil_03/leis/l9307.htm',
  'LEI 9507 - HABEAS DATA': 'https://www.planalto.gov.br/ccivil_03/leis/l9507.htm',
  'LEI 10520 - PREGAO': 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10520.htm',

  // ========================
  // LEIS DE PRIORIDADE ALTA
  // ========================
  'LEI 8112 - SERVIDOR PUBLICO': 'https://www.planalto.gov.br/ccivil_03/leis/l8112compilado.htm',
  'DL 3688 - CONTRAVENCOES PENAIS': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3688.htm',
  'LEI 7960 - PRISAO TEMPORARIA': 'https://www.planalto.gov.br/ccivil_03/leis/l7960.htm',
  'LEI 12037 - IDENTIFICACAO CRIMINAL': 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12037.htm',
  'LEI 6404 - SOCIEDADES ANONIMAS': 'https://www.planalto.gov.br/ccivil_03/leis/l6404compilada.htm',
  'LEI 8987 - CONCESSOES': 'https://www.planalto.gov.br/ccivil_03/leis/l8987compilada.htm',
  'LEI 11079 - PPP': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11079compilado.htm',
  'LC 75 - MINISTERIO PUBLICO UNIAO': 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp75.htm',
  'LC 80 - DEFENSORIA PUBLICA': 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp80.htm',
  'DECRETO 1171 - ETICA SERVIDOR': 'https://www.planalto.gov.br/ccivil_03/decreto/d1171.htm',
  'LC 109 - PREVIDENCIA COMPLEMENTAR': 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp109.htm',

  // ========================
  // LEIS QUE FALTAVAM URL
  // ========================
  'LEI 4657 - LINDB': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del4657compilado.htm',
};

// Aliases para nomes alternativos de tabelas
const ALIASES_PLANALTO: Record<string, string> = {
  'CF/88': 'CF - Constituição Federal',
  'Constituição Federal': 'CF - Constituição Federal',
  'Código Civil': 'CC - Código Civil',
  'Código Penal': 'CP - Código Penal',
  'Código de Processo Civil': 'CPC – Código de Processo Civil',
  'Código de Processo Penal': 'CPP – Código de Processo Penal',
  'Consolidação das Leis do Trabalho': 'CLT - Consolidação das Leis do Trabalho',
  'Código Tributário Nacional': 'CTN – Código Tributário Nacional',
  'Código de Defesa do Consumidor': 'CDC – Código de Defesa do Consumidor',
  'Código Eleitoral': 'CE – Código Eleitoral',
  'Código de Trânsito Brasileiro': 'CTB Código de Trânsito Brasileiro',
  'Código de Águas': 'CA - Código de Águas',
  'Código Brasileiro de Aeronáutica': 'CBA Código Brasileiro de Aeronáutica',
  'Código Brasileiro de Telecomunicações': 'CBT Código Brasileiro de Telecomunicações',
  'Código Comercial': 'CCOM – Código Comercial',
  'Código de Minas': 'CDM – Código de Minas',
  'Código Penal Militar': 'CPM – Código Penal Militar',
  'Código de Processo Penal Militar': 'CPPM – Código de Processo Penal Militar',
  'Código Florestal': 'CF - Código Florestal',
  'Código de Caça': 'CC - Código de Caça',
  'Código de Pesca': 'CP - Código de Pesca',
  'Código de Propriedade Industrial': 'CPI - Código de Propriedade Industrial',
  'Código de Defesa do Usuário': 'CDUS - Código de Defesa do Usuário',
};

// Função para obter URL do Planalto para uma tabela
export function getUrlPlanalto(tableName: string): string | null {
  const resolved = ALIASES_PLANALTO[tableName] || tableName;
  return URLS_PLANALTO[resolved] || null;
}

// Função para verificar se uma tabela tem URL mapeada
export function hasUrlPlanalto(tableName: string): boolean {
  return tableName in URLS_PLANALTO;
}

// Função para obter nome amigável da lei
export function getNomeAmigavel(tableName: string): string {
  // Já é amigável se começar com "Lei"
  if (tableName.startsWith('Lei ')) {
    return tableName.split(' - ')[1] || tableName;
  }
  // Estatutos
  if (tableName.startsWith('ESTATUTO - ')) {
    return tableName.replace('ESTATUTO - ', 'Est. ');
  }
  if (tableName.startsWith('EST - ')) {
    return tableName.replace('EST - Estatuto ', 'Est. ').replace('EST - ', '');
  }
  // Códigos
  return tableName;
}
