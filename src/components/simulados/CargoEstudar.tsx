import { BookOpen, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface BlocoMateria {
  titulo: string;
  topicos: string[];
}

interface Bloco {
  nome: string;
  materias: BlocoMateria[];
}

interface ConteudoProgramatico {
  preambulo: string[];
  blocos: Bloco[];
}

const CONTEUDO_POR_CARGO: Record<string, ConteudoProgramatico> = {
  "juiz(a) substituto(a)": {
    preambulo: [
      "A Jurisprudência pacificada e as Súmulas dos Tribunais Superiores e do TJRJ, pertinentes às disciplinas do anexo I, poderão ser objeto de questionamento.",
      "Toda legislação, súmulas e jurisprudência devem ser consideradas com as alterações e atualizações vigentes até a data da publicação do edital.",
      "Legislação e julgados com entrada em vigor após a publicação do edital poderão ser utilizados, quando supervenientes ou complementares a algum tópico já previsto ou indispensável à avaliação para o cargo.",
      "Todos os temas englobam também a legislação que lhes é pertinente, ainda que não expressas no conteúdo programático.",
    ],
    blocos: [
      {
        nome: "BLOCO I",
        materias: [
          {
            titulo: "DIREITO CIVIL",
            topicos: [
              "Lei de Introdução às Normas do Direito Brasileiro.",
              "Capacidade e incapacidade. Estatuto da pessoa com deficiência. Direitos da Personalidade. Pessoas naturais. Início da personalidade e fim da personalidade. Morte. Ausência. Morte presumida.",
              "Pessoas jurídicas. Desconsideração da personalidade jurídica. Domicílio. Bens. Bem de família.",
              "Fatos jurídicos. Negócios jurídicos. Forma do negócio jurídico. Condição, termo e encargo. Representação.",
              "Defeitos do negócio jurídico: erro, dolo, coação, fraude contra credores, lesão e estado de perigo.",
              "Invalidade do negócio jurídico. Nulidade. Simulação. Efeitos da nulidade e da anulabilidade.",
              "Ato lícito e ato ilícito. Abuso do direito. Teoria da aparência. Prescrição e decadência. Da prova.",
              "Obrigações. Obrigações de dar, fazer e não fazer. Obrigações alternativas. Obrigações divisíveis e indivisíveis. Obrigações solidárias.",
              "Pagamento. Condições subjetivas e objetivas. Prova, lugar e tempo do pagamento.",
              "Pagamentos especiais. Pagamento por consignação e com sub-rogação. Imputação do pagamento. Dação em pagamento.",
              "Extinção da obrigação sem pagamento: novação, compensação, confusão, compromisso e remissão.",
              "Inadimplemento das obrigações. Mora. Perdas e danos. Juros legais e cláusula penal.",
              "Arras. Transmissão de obrigações: cessão de crédito, assunção de dívida, cessão de contrato.",
              "Contratos. Classificação dos contratos. Contratos de adesão. Contrato aleatório. Contrato com pessoa a declarar. Contrato preliminar.",
              "Formação dos contratos. Contratos por tempo determinado e indeterminado. Efeitos dos contratos. Estipulação em favor de terceiro.",
              "Cláusulas gerais. Conceitos legais indeterminados. Conceitos determinados pela função. Interpretação dos contratos.",
              "Vícios redibitórios. Evicção. Extinção dos contratos: resolução, rescisão e resilição.",
              "Compra e venda. Cláusulas especiais. Promessa de compra e venda. Troca ou permuta. Contrato estimatório. Doação.",
              "Locação de coisas. Locação de imóveis urbanos. Comodato. Mútuo. Prestação de serviço. Empreitada. Depósito. Mandato. Comissão. Corretagem. Transporte. Fiança. Transação.",
              "Seguro. Disposições gerais. Seguro de dano e seguro de pessoa. Contratos referentes a planos e seguros privados de assistência à saúde.",
              "Atos unilaterais. Pagamento indevido. Enriquecimento sem causa. Promessa de recompensa. Gestão de negócios.",
              "Responsabilidade civil. Requisitos. Responsabilidade por fato de outrem. Responsabilidade sem culpa.",
              "Responsabilidade pela perda de uma chance. Dano moral. Dano estético. Indenização do dano material e do dano moral. Liquidação de danos.",
              "Posse. Aquisição, perda e efeitos. Propriedade. Aquisição da propriedade imóvel e móvel. Perda da propriedade. Usucapião. Desapropriação. Direito de laje.",
              "Condomínio geral. Condomínio edilício. Direitos de vizinhança. Direito de superfície.",
              "Direitos reais sobre coisas alheias: servidões, usufruto, uso e habitação.",
              "Direitos reais de garantia. Hipoteca. Penhor e suas espécies.",
              "Propriedade resolúvel. Propriedade fiduciária. Alienação fiduciária em garantia no Código Civil e na legislação extravagante. Cessão fiduciária. Patrimônio separado. Patrimônio de afetação. Securitização.",
              "Direito real de aquisição. Loteamento. Incorporação imobiliária.",
              "Família. Conceito e modalidades de família. Casamento. Processo matrimonial. Habilitação para o casamento. Celebração. Forma. Modalidades.",
              "Casamento: natureza jurídica, existência, validade e eficácia. Impedimentos e causas suspensivas, deveres conjugais. Casamento putativo. União estável. Concubinato.",
              "Regime de bens. Pacto antenupcial. Dissolução da sociedade conjugal e do casamento.",
              "Paternidade e filiação. Paternidade post mortem. Filiação por reprodução assistida. Reconhecimento da paternidade. Paternidade biológica e socioafetiva. Poder familiar. Alimentos. Alienação parental.",
              "Poder familiar. Tutela. Curatela. Tomada de decisão apoiada.",
              "Sucessões. A herança e sua administração. Vocação hereditária. Aceitação e renúncia da herança. Cessão de herança. Excluídos da herança. Sucessão Legítima. Sucessão do companheiro.",
              "Sucessão testamentária. Testamento. Formas de testamento. Disposições testamentárias. Codicilo. Fideicomisso. Legados. Direito de acrescer e substituições. Execução do testamento. Deserdação.",
              "Sonegados. Redução das disposições testamentárias. Revogação, rompimento e anulação do testamento. Testamenteiro. Inventário e partilha.",
              "Direito de autor. Registros Públicos.",
              "Súmulas do Superior Tribunal de Justiça, do Supremo Tribunal Federal e do Tribunal de Justiça do Estado do Rio de Janeiro.",
            ],
          },
          {
            titulo: "DIREITO PROCESSUAL CIVIL",
            topicos: [
              "Lei nº 13.105, de 16 de março de 2015.",
              "Lei nº 13.256, de 4 de fevereiro de 2016.",
              "Princípios constitucionais e infraconstitucionais do processo civil. Garantias constitucionais do processo. Autonomia do Direito Processual. Institutos e normas fundamentais do processo civil. Direito Processual Constitucional.",
              "Interpretação da norma processual. Norma processual no tempo e no espaço. Efetividade do processo e acesso à Justiça. Escopos do processo. Instrumentalidade do processo.",
              "Jurisdição. Elementos conceituais. Características. Espécies. Organização e Divisão Judiciárias do Estado do Rio de Janeiro. Distinção em relação às demais funções do Estado. Jurisdição estatal e arbitral. Poderes do juiz e do árbitro. Impedimento e suspeição.",
              "Competência. Critérios de determinação e de modificação. Incompetência absoluta e relativa. Conflito de competência. Cooperação internacional.",
              "Funções essenciais à Justiça. Magistratura. Advocacia Pública e Privada. Assistência judiciária. Taxa judiciária. Ministério Público. Órgãos auxiliares da justiça. Conciliadores e mediadores.",
              "A ação. Conceito e natureza. Condições da ação. Elementos da ação. Ação e tutela jurisdicional. Cumulação de ações. Classificação da tutela jurisdicional. Processo. Conceito e natureza. Espécies. Pressupostos processuais. Procedimento e relação jurídica processual.",
              "Atos processuais. Forma, tempo e lugar. Regime de invalidades processuais. Preclusões. Comunicação dos atos processuais. Atos processuais eletrônicos. Convenção das partes em matéria processual.",
              "Partes e terceiros no processo civil. Conceitos. Litisconsórcio, assistência e modalidades de intervenção de terceiros. Amicus curiae. Incidente de desconsideração da personalidade jurídica.",
              "Tutela provisória. Tutela de urgência e tutela de evidência. Estabilização da tutela antecipada.",
              "Petição inicial. Requisitos. Juízo de Admissibilidade. Audiência de conciliação e mediação. Defesa do réu. Contestação e reconvenção. Providências preliminares. Julgamento conforme o estado do processo. Audiência de saneamento e organização do processo.",
              "Provas. Objeto, fonte e meios. Prova atípica e prova ilícita. Ônus da prova. Antecipação da prova. Provas em espécie e sua produção. Audiência de instrução e julgamento.",
              "Sentença. Elementos e requisitos. Vícios das sentenças. Coisa julgada formal e material. Limites subjetivos, objetivos e cronológicos. Eficácia preclusiva da coisa julgada. Coisa julgada e resolução de questão prejudicial. Relativização da coisa julgada.",
              "Recursos. Princípios gerais. Pressupostos de admissibilidade. Efeitos. Ações autônomas de impugnação. Ação rescisória. Reclamação.",
              "Recursos em espécie: apelação, agravo de instrumento, embargos de declaração, recursos extraordinário e especial, embargos de divergência, agravo interno. Julgamento estendido em caso de divergência.",
              "Precedentes judiciais. Incidente de resolução de demandas repetitivas. Julgamento de recursos repetitivos nos tribunais superiores. Assunção de competência. Súmula Vinculante. Controle concentrado de constitucionalidade.",
              "Procedimentos especiais de jurisdição contenciosa. Ação de consignação em pagamento; ação de exigir contas; ações possessórias, ações de divisão e demarcação. Ação de dissolução parcial de sociedade.",
              "Procedimentos especiais de jurisdição contenciosa: inventário e partilha, embargos de terceiro, oposição, ações de família, habilitação, restauração de autos, ação monitória, homologação de penhor legal, regulação de avaria grossa.",
              "Arbitragem. Compromisso arbitral e cláusula compromissória. Tutelas de urgência antes, durante e depois do processo arbitral. Impugnação judicial da sentença arbitral. Meios alternativos de solução de conflito. Instauração da Arbitragem. Ação para obtenção do compromisso arbitral. Impedimento e Substituição do Árbitro. Responsabilidade do Árbitro. Cooperação do Poder Judiciário com a Arbitragem.",
              "O Poder Público em juízo. Mandado de segurança. Ação Popular. Habeas data. Ação de improbidade administrativa. Execução fiscal e execução contra a Fazenda Pública. Suspensão de segurança.",
              "Tutela dos interesses transindividuais. Direitos e interesses difusos, coletivos e individuais homogêneos.",
              "Cumprimento de sentença e execução. Classificações. Pressupostos. Título executivo: espécies e requisitos. Liquidação.",
              "Cumprimento de sentença para pagamento de quantia, para obrigação de fazer, não fazer e dar coisa certa. Cumprimento de sentença na obrigação de alimentos.",
              "Execução por quantia certa contra devedor solvente. Procedimento. Penhora, avaliação e expropriação. Satisfação do credor.",
              "Defesa do executado no cumprimento de sentença e na execução de título extrajudicial. Ações autônomas de impugnação à execução. Exceção de pré-executividade.",
              "Procedimento dos Juizados Especiais Cíveis e Juizados Especiais da Fazenda Pública. Juizados Especiais Federais.",
              "Procedimentos Especiais de Jurisdição Voluntária. Características. Notificação e interpelação. Alienações Judiciais. Testamento e Codicilo. Herança Jacente. Bens dos Ausentes. Coisas Vagas. Tutela e curatela. Organização e Fiscalização das Fundações.",
              "Ações locatícias. Ação de Despejo. Ação Renovatória. Ação Revisional. Ação Consignatória.",
              "O processo da recuperação judicial e da falência.",
              "Interesses Difusos e Coletivos. Legitimação: Ordinária e Extraordinária. Coisa julgada na ação coletiva. Competência. Proteção ao patrimônio público social. Tutela de direitos metaindividuais.",
            ],
          },
          {
            titulo: "DIREITO DO CONSUMIDOR",
            topicos: [
              "Direitos do consumidor. Disposições gerais. Política nacional de relações de consumo. Direitos básicos do consumidor.",
              "Qualidade de produtos e serviços. Prevenção e reparação dos danos. Proteção à saúde e à segurança. Responsabilidade pelo fato do produto e do serviço. Responsabilidade por vício do produto e do serviço.",
              "Decadência e prescrição. Desconsideração da personalidade jurídica.",
              "Práticas comerciais. Disposições gerais. Oferta. Publicidade. Práticas abusivas. Cobrança de dívidas. Bancos de dados. Cadastros de consumidores.",
              "Proteção contratual. Disposições gerais. Cláusulas abusivas. Contratos de adesão.",
              "Sanções administrativas e penais: Da competência concorrente. A multa, apreensão, inutilização, cassação de registro, proibição de fabricação, suspensão temporária de atividade, revogação ou cassação de concessão ou permissão, da interdição. Da Contrapropaganda.",
              "Defesa do consumidor em juízo. Disposições gerais. Ações coletivas para a defesa de interesses individuais homogêneos. Ações de responsabilização do fornecedor de produtos e serviços. Da tutela específica nas obrigações de fazer ou não fazer. Da sentença. Da coisa julgada. Da liquidação da sentença coletiva.",
              "Sistema Nacional de defesa do consumidor. Convenção coletiva de consumo. A política nacional de relações de consumo, o PROCON estadual e municipal.",
              "Súmulas do Superior Tribunal de Justiça, do Supremo Tribunal Federal e do Tribunal de Justiça do Estado do Rio de Janeiro.",
            ],
          },
          {
            titulo: "DIREITO DA CRIANÇA E DO ADOLESCENTE",
            topicos: [
              "Consectários em matéria de criança e adolescente: Princípio da prioridade absoluta e proteção integral; Princípio da dignidade da pessoa humana; Princípio da participação popular; Princípio da excepcionalidade; Princípio da brevidade; Princípio da condição peculiar de pessoa em desenvolvimento.",
              "Dos Direitos da criança e do adolescente: Direito à Vida e à Saúde; Direito à Liberdade, ao Respeito e à Dignidade; Direito à Convivência Familiar e Comunitária; Direito à Educação, à Cultura, ao Esporte e ao Lazer; Direito à Profissionalização e à Proteção no Trabalho.",
              "Perda e suspensão do poder familiar. Colocação em família substituta: guarda, tutela, adoção e adoção internacional.",
              "Das medidas de proteção.",
              "Da Prevenção. Disposições gerais. Da prevenção especial. Formas de controle. A ação civil pública. Da informação, cultura, lazer, esportes, diversões e espetáculos. Dos produtos e serviços. Da autorização para viajar. Do Juiz da Infância e da Juventude.",
              "Justiça da Infância e Juventude: procedimentos, recursos, funções do Ministério Público, intervenção por meio de advogado, infrações administrativas.",
              "Do Conselho Tutelar.",
              "Da prática de ato infracional: definição, direitos individuais, garantia processuais, medidas socioeducativas, remissão, medidas pertinentes aos pais ou responsáveis.",
              "Súmulas do Superior Tribunal de Justiça, do Supremo Tribunal Federal e do Tribunal de Justiça do Estado do Rio de Janeiro.",
            ],
          },
        ],
      },
      {
        nome: "BLOCO II",
        materias: [
          {
            titulo: "DIREITO PENAL",
            topicos: [
              "Conceito de Direito Penal. Princípios Constitucionais Penais. História do Direito Penal. Doutrinas e Escolas Penais. Fontes do Direito Penal. Sistemas Penitenciários.",
              "Código Penal – Parte Geral: Da aplicação da lei penal; Do crime; Da imputabilidade penal; Do concurso de pessoas; Das penas; Das medidas de segurança; Da ação penal; Da extinção da punibilidade.",
              "Código Penal – Parte Especial: Dos crimes contra a pessoa; Dos crimes contra o patrimônio; Dos crimes contra a propriedade imaterial; Dos crimes contra a dignidade sexual; Dos crimes contra a família; Dos crimes contra a incolumidade pública; Dos crimes contra a paz pública; Dos crimes contra a fé pública; Dos crimes contra a administração pública.",
              "Lei das Contravenções Penais.",
              "Leis Penais Especiais: Drogas (Lei 11.343/06); Estatuto do Desarmamento (Lei 10.826/03); Crimes eleitorais; Abuso de autoridade (Lei 13.869/19); Crimes contra relações de consumo e ordem tributária; Crimes contra a economia popular; Crimes de trânsito; Tortura; Crimes ambientais; Crimes contra criança e adolescente; Crimes falimentares; Violência doméstica; Crimes contra idosos; Preconceito de raça ou cor; Crimes hediondos; Licitações; Menor Potencial Ofensivo; Crime Organizado (Lei 12.850/13); Lavagem de dinheiro (Lei 9.613/98); Execução Penal (Lei 7.210/84).",
              "Crimes militares. Código Penal Militar. Policiais militares e bombeiros militares. Crimes dos prefeitos municipais e vereadores. Crimes eleitorais. Crimes contra a propriedade imaterial.",
              "Súmulas do Superior Tribunal de Justiça, do Supremo Tribunal Federal e do Tribunal de Justiça do Estado do Rio de Janeiro.",
            ],
          },
          {
            titulo: "DIREITO PROCESSUAL PENAL",
            topicos: [
              "Do processo penal em geral. Princípios Constitucionais e fontes do processo penal.",
              "Código de Processo Penal: Disposições preliminares; Do inquérito policial; Da ação penal; Da ação civil; Da competência; Das questões e processos incidentes; Da prova; Do Juiz, do Ministério Público, do Acusado e Defensor, dos Assistentes e Auxiliares da Justiça; Da prisão, das Medidas cautelares e da liberdade provisória; Das citações e intimações; Da sentença; Dos processos em espécie; Das nulidades e dos recursos em geral; Disposições gerais.",
              "Mandado de segurança em matéria criminal.",
              "Disposições processuais penais especiais: Execução penal; Entorpecentes; Violência doméstica; Prisão temporária; Juizados Especiais Criminais; Interceptação telefônica; Código Eleitoral; Falências; Organizações criminosas; Proteção a testemunhas; Lavagem de dinheiro.",
              "Súmulas do Superior Tribunal de Justiça, do Supremo Tribunal Federal e do Tribunal de Justiça do Estado do Rio de Janeiro.",
            ],
          },
          {
            titulo: "DIREITO CONSTITUCIONAL",
            topicos: [
              "Constitucionalismo e teoria da constituição. Constituição e Neoconstitucionalismo. Poder Constituinte. Emendas Constitucionais.",
              "Organização do Estado. Estado de Direito Democrático. Federação. Competências legislativas dos entes federados. Autonomia financeira, administrativa e política dos entes federados.",
              "Evolução político-constitucional brasileira. As Constituições Brasileiras.",
              "Normas Constitucionais: Hermenêutica e Filosofia Constitucional. Métodos de Interpretação. Aplicabilidade e Eficácia. Mutação Constitucional. Reforma e Revisão Constitucional.",
              "Controle da constitucionalidade. Controle Difuso. Controle Abstrato. Controle em âmbito estadual. A Constituição do Estado do Rio de Janeiro como parâmetro.",
              "Processo legislativo. Reforma constitucional. Intervenção Federal e Estadual.",
              "Poder Legislativo. Poder Executivo. Defesa do Estado e das Instituições Democráticas. A Organização dos Poderes.",
              "Ministério Público. Direitos Fundamentais. Tratados e convenções internacionais. Direitos sociais e coletivos. Ações constitucionais.",
              "Direitos de cidadania. Direito de sufrágio. Plebiscito, Referendo e Iniciativa Popular. Garantias Fundamentais. Princípios de Defesa na Constituição Federal.",
              "Princípios constitucionais da Administração Pública. Poder Judiciário. A Emenda Constitucional n° 45. Funções essenciais da Justiça.",
              "Poder Judiciário. Direitos, garantias e deveres da Magistratura. O Estatuto da Magistratura. Atividade correcional.",
              "ADI. ADC. ADPF. Controle difuso. Mandado de Injunção. ADI por Omissão. ADI Interventiva.",
              "STF. CNJ. STJ. TSE. Tribunais Regionais e Juízes Federais. Tribunais e Juízes Estaduais. TJRJ.",
              "Ordem Econômica e Financeira. Tributação e Orçamento. Ordem Social.",
              "Súmulas do Superior Tribunal de Justiça, do Supremo Tribunal Federal e do Tribunal de Justiça do Estado do Rio de Janeiro.",
            ],
          },
          {
            titulo: "DIREITO ELEITORAL",
            topicos: [
              "Estado Democrático de Direito. Cidadania. Sistema representativo. Soberania popular. Pluralismo político. Reforma política. Direitos políticos.",
              "Partidos políticos. Conceito. História. Sistemas partidários. Criação, fusão e extinção. Fundo Partidário. Fidelidade partidária.",
              "Direito Eleitoral. Conceito. Fundamentos. Fontes e princípios. Interpretação. Aplicação subsidiária do CPC.",
              "Representação. Sufrágio. Sistemas Eleitorais. Sistema Majoritário. Sistema Proporcional.",
              "Justiça Eleitoral. Organização. Competência. Evolução histórica. Atividade consultiva. Resoluções normativas.",
              "Capacidade eleitoral: requisitos. Alistamento eleitoral. Cancelamento. Exclusão. Revisão do eleitorado.",
              "Elegibilidade. Inelegibilidades constitucionais e legais. Domicílio Eleitoral. Filiação Partidária.",
              "Ministério Público Eleitoral. Democracia participativa. Plebiscito. Referendo.",
              "Processo Eleitoral. Convenções partidárias. Registro de candidatos. Impugnação.",
              "Campanha eleitoral. Financiamento. Prestação de contas. Captação ilícita. Abuso de poder.",
              "Propaganda política e eleitoral. Pesquisas pré-eleitorais. Propaganda na internet.",
              "Garantias Eleitorais. Captação ilícita de sufrágio. Contenção ao poder econômico.",
              "Eleição. Atos preparatórios. Fiscalização. Apuração e diplomação. Recurso contra diploma.",
              "Ações judiciais eleitorais. Recursos Eleitorais. Ação rescisória eleitoral.",
              "Crimes eleitorais. Processo penal eleitoral.",
              "Súmulas do Superior Tribunal de Justiça, do Supremo Tribunal Federal e do Tribunal de Justiça do Estado do Rio de Janeiro.",
            ],
          },
        ],
      },
      {
        nome: "BLOCO III",
        materias: [
          {
            titulo: "DIREITO EMPRESARIAL",
            topicos: [
              "Origens e história do Direito Comercial. Teoria dos atos de comércio. Teoria da empresa e atividade empresarial.",
              "O Direito Civil e o Direito Comercial: autonomia ou unificação. Fontes. Os perfis do mercado.",
              "Princípios constitucionais econômicos e sua instrumentalidade para o funcionamento do mercado.",
              "Direito de Empresa no Código Civil. A empresa e o empresário. Noção econômica e jurídica de empresa. Capacidade. Empresário rural. Obrigações gerais.",
              "Registro Público de Empresas Mercantis. Escrituração e demonstrações contábeis periódicas.",
              "Empresa individual de responsabilidade limitada. Estabelecimento empresarial. Nome empresarial. Propriedade industrial. Concorrência desleal.",
              "A atividade empresarial e a publicidade: tutela do consumidor.",
              "Teoria Geral do Direito Societário. Ato constitutivo. Classificação das sociedades. Desconsideração da personalidade jurídica.",
              "Sociedade limitada. Sociedade anônima (Lei nº 6.404/76).",
              "Teoria Geral dos Títulos de Crédito. Letra de câmbio, nota promissória, cheque, duplicata. Títulos bancários. Títulos do agronegócio. Títulos eletrônicos.",
              "Teoria Geral do direito dos contratos. Comércio eletrônico. Contratos empresariais. Compra e venda mercantil. Contratos de colaboração.",
              "O empresário e a relação de consumo. Tutela contratual dos consumidores.",
              "Teoria Geral da Falência. Falência na Lei nº 11.101/2005. Órgãos. Efeitos. Processo. Classificação e pagamento dos credores.",
              "Teoria Geral da Recuperação da empresa. Recuperação judicial e extrajudicial. Verificação dos créditos.",
              "Súmulas do Superior Tribunal de Justiça, do Supremo Tribunal Federal e do Tribunal de Justiça do Estado do Rio de Janeiro.",
            ],
          },
          {
            titulo: "DIREITO TRIBUTÁRIO",
            topicos: [
              "Direito Tributário. Conceito. Sistema Constitucional Tributário e Sistema Tributário Nacional. Princípios constitucionais. Limitações ao poder de tributar.",
              "Fontes do Direito Tributário. Legislação tributária: conceito, vigência, aplicação, interpretação e integração. O art. 146 da Constituição Federal.",
              "Tributo. Definição do art. 3º do CTN. Tipologia tributária no Brasil. Taxas e preços públicos. Contribuição de melhoria. Empréstimos compulsórios. Contribuições parafiscais.",
              "Imunidades tributárias: conceito e natureza. Imunidade e Isenção. Imunidade recíproca. Imunidade dos templos. Imunidade do livro.",
              "Regra da incidência tributária. Hipótese tributária e fato jurídico tributário. Obrigação tributária: principal e acessória. Sujeito ativo e passivo. Base de cálculo e alíquota.",
              "Crédito tributário. Lançamento. Suspensão. Extinção. Exclusão do crédito tributário.",
              "Infrações e sanções tributárias. Fraude à lei e abuso de direito. Responsabilidade dos sucessores e de terceiros. Denúncia espontânea.",
              "Garantias e privilégios do crédito tributário.",
              "Administração tributária. Fiscalização. Dever de sigilo. Dívida ativa e certidões negativas.",
              "Competência tributária. Tributos dos Estados e dos Municípios. Orçamento Público.",
              "Ações de natureza tributária. As Execuções Fiscais.",
            ],
          },
          {
            titulo: "DIREITO AMBIENTAL",
            topicos: [
              "Fundamentos éticos e filosóficos do direito ambiental.",
              "A Constituição e o Meio Ambiente. O artigo 225. Ambiente ecologicamente equilibrado como direito fundamental. Tratados Internacionais.",
              "Princípios constitucionais ambientais: solidariedade intergeracional, desenvolvimento sustentável, poluidor-pagador, prevenção, precaução, participação, informação, ubiquidade, moralidade.",
              "Deveres do Poder Público em relação ao meio ambiente. Competências administrativa, legislativa e jurisdicional.",
              "A comunidade e a tutela constitucional do ambiente. Política Nacional de Educação Ambiental. Participação popular. Responsabilidade Administrativa e Civil Ambiental.",
              "Urbanismo. Meio ambiente urbano. Instrumentos urbanísticos. Estatuto da Cidade.",
              "Bem jurídico ambiental. Espaços ambientalmente protegidos. SISNAMA. Tutela administrativa. Poder de polícia.",
              "Patrimônio ambiental natural, cultural e artificial. Patrimônio genético. Biotecnologia e biossegurança. Política Nacional da Biodiversidade.",
              "Licenciamento ambiental. EIA/RIMA. Tutela e responsabilidade civil e administrativa.",
              "Poluição da água, atmosférica, visual, por resíduos sólidos, por atividades nucleares. Agrotóxicos.",
              "Jurisprudência das Câmaras Reservadas ao Meio Ambiente do TJRJ e dos Tribunais Superiores.",
              "Instrumentos processuais da tutela ambiental: Inquérito civil, TAC, ACP, Ação Popular, Mandado de segurança coletivo, Mandado de injunção, Ação penal pública ambiental.",
            ],
          },
          {
            titulo: "DIREITO ADMINISTRATIVO",
            topicos: [
              "Lei de Introdução às Normas do Direito Brasileiro. Princípios Constitucionais da Administração Pública.",
              "Função pública. Divisão de competências. Delegação e avocação. Poder de Polícia. Limites e Fundamentos.",
              "Ato administrativo. Elementos, requisitos, espécies. Controle formal e de mérito.",
              "Processo Administrativo. Princípios. Finalidades. Leis gerais. Mecanismos de controle.",
              "Bens públicos. Natureza jurídica. Espécies. Inalienabilidade, impenhorabilidade, imprescritibilidade. Afetação e desafetação. Uso privativo.",
              "Discricionariedade: limites e fundamentos. Abuso e desvio de Poder.",
              "Contratos Administrativos. Teoria Geral. Convênios. Equilíbrio econômico financeiro.",
              "Consórcios Públicos. Contratos de Programa e de Rateio.",
              "Licitação. Fundamento constitucional. Inexigibilidade e Dispensa. Modalidades. Pregão. RDC.",
              "Serviços públicos. Conceito. Regime jurídico e tarifário. Regulação. Concessão e permissão.",
              "Parceria público-privada. Conceito e modalidades. Regime jurídico e de garantias.",
              "Estrutura da Administração Pública. Administração Direta e Indireta. Empresas estatais. Agências reguladoras. Fundações Públicas.",
              "Responsabilidade Civil do Estado. Responsabilidade objetiva. Causas excludentes e atenuantes.",
              "Organização funcional: cargos, empregos e funções. Servidores públicos. Regime jurídico único. Processo Disciplinar. Previdência do servidor público.",
              "Desapropriação. Hipóteses. Desapropriação indireta, por zona, urbanística, punitiva.",
              "Intervenção na propriedade: servidão, requisição, ocupação temporária, tombamento, limitações administrativas.",
              "Responsabilidade administrativa, civil e criminal do agente público. Improbidade administrativa (Lei 8.429/92).",
              "Lei de Responsabilidade Fiscal. Controle da Administração Pública. Lei anticorrupção (Lei 12.846/13).",
              "Mandado de Segurança, Ação Popular e Ação Civil Pública.",
              "Súmulas do Superior Tribunal de Justiça, do Supremo Tribunal Federal e do Tribunal de Justiça do Estado do Rio de Janeiro.",
            ],
          },
          {
            titulo: "NOÇÕES GERAIS DE DIREITO E FORMAÇÃO HUMANÍSTICA",
            topicos: [
              "Sociologia do Direito: A. Comte, E. Durkheim, Max Weber, Hegel, Marx, Habermas, Escola de Frankfurt, Caio Prado Júnior, Raimundo Faoro.",
              "Psicologia Judiciária: Integração da Psicologia com o Direito. Psicologia na execução das penas. Psiquiatria forense. Interdisciplinaridade. Psicologia da conciliação.",
              "Ética e Estatuto Jurídico da Magistratura: Código de Ética da Magistratura. Direitos e deveres funcionais. Sistemas de controle interno. Responsabilidade administrativa, civil e criminal dos magistrados.",
              "Filosofia do Direito: Filosofia grega, medieval, moderna e contemporânea. Juspositivismo, não positivismo e filosofia do direito crítica.",
              "Teoria Geral do Direito e da Política: Pessoa. Direito subjetivo. Realismo Jurídico. Direito e poder. Legitimidade e legalidade. Direitos fundamentais e humanos. Agenda 2030 e ODS. Gênero e Patriarcado. Protocolo de julgamento com perspectiva de gênero.",
              "Direito Digital: 4ª Revolução industrial. Transformação Digital no Judiciário. IA e Direito. Audiências virtuais. Jurimetria. Crimes virtuais. Deepweb e Darkweb. Provas digitais. Criptomoedas. Blockchain. LGPD. Marco Civil da Internet.",
              "Pragmatismo, Análise Econômica do Direito e Economia Comportamental: Antifundacionalismo. Consequencialismo. Eficiência processual. Heurística e vieses cognitivos. Governança corporativa e Compliance. Whistleblower.",
              "Direito da Antidiscriminação: Conceitos fundamentais. Modalidades de discriminação. Legislação antidiscriminação. Racismo, Sexismo, Intolerância Religiosa, LGBTQIA+fobia. Ações Afirmativas. Direitos dos Povos indígenas.",
            ],
          },
          {
            titulo: "DIREITOS HUMANOS",
            topicos: [
              "Teoria Geral dos Direitos Humanos.",
              "Sistema global de proteção dos direitos humanos.",
              "Sistema regional interamericano de proteção dos direitos humanos.",
              "Controle de convencionalidade.",
              "A relação entre o direito internacional dos direitos humanos e o direito brasileiro.",
              "Os direitos humanos na Constituição Federal de 1988.",
              "A jurisprudência do Supremo Tribunal Federal em matéria de direitos humanos.",
            ],
          },
        ],
      },
    ],
  },
  "delegado de polícia": {
    preambulo: [
      "O conteúdo programático contempla legislação, jurisprudência e doutrina pertinentes aos temas.",
      "As alterações legislativas ocorridas após a publicação do Edital poderão ser exigidas nas provas.",
    ],
    blocos: [
      {
        nome: "LEGISLAÇÃO E CONHECIMENTOS REGIONAIS",
        materias: [
          {
            titulo: "Legislação",
            topicos: [
              "Lei Orgânica Nacional das Polícias Civis (Lei nº 14.735/2023): Disposições gerais e princípios; Organização das carreiras policiais; Competências da Polícia Civil; Direitos, deveres, garantias e vedações.",
              "Estatuto da Polícia Civil do Estado do Piauí (LC Estadual nº 37/2004 e LC Estadual nº 318/2025): Estrutura da Polícia Civil; Carreira de Delegado de Polícia; Deveres, proibições e transgressões disciplinares; Responsabilidade e penalidades; Processo administrativo disciplinar; Progressão e promoção na carreira; Aposentadoria e disposições gerais; Vedação ao acúmulo de funções.",
              "Estrutura Organizacional da Polícia Civil do Piauí (Decreto Estadual nº 22.223/2023 e suas alterações).",
            ],
          },
          {
            titulo: "Conhecimentos Regionais",
            topicos: [
              "Aspectos históricos relevantes do Estado do Piauí: formação territorial, processos coloniais e movimentos sociais locais.",
              "Geografia física e humana: relevo, clima, hidrografia, vegetação, população, densidade demográfica e principais atividades econômicas.",
              "Divisão político-administrativa: estrutura do estado, municípios e regiões de desenvolvimento.",
              "Cultura piauiense: manifestações culturais, patrimônio material e imaterial, festas populares, artes, literatura, música e tradições.",
              "Indicadores sociais e econômicos recentes: IDH, segurança pública, saúde, educação, mobilidade e desenvolvimento regional.",
              "Estrutura do governo estadual, políticas públicas, programas sociais e desafios contemporâneos.",
              "Temas de atualidade que impactam o Estado do Piauí: segurança, economia, meio ambiente, políticas de inclusão e sustentabilidade.",
            ],
          },
        ],
      },
      {
        nome: "DIREITO CONSTITUCIONAL",
        materias: [
          {
            titulo: "Direito Constitucional",
            topicos: [
              "Teoria da Constituição: Conceito, Objeto e Classificações das Constituições.",
              "Poder Constituinte: Titularidade, espécies (originário, derivado, decorrente, difuso), características e limites.",
              "Mutação Constitucional e Reforma Constitucional: Emendas e Revisão.",
              "Supremacia da Constituição e o Bloco de Constitucionalidade.",
              "Normas Constitucionais: Classificação quanto à eficácia e aplicabilidade (plena, contida e limitada).",
              "Controle de Constitucionalidade: Conceito, Histórico, Sistemas Difuso e Concentrado, ADI, ADC, ADPF, ADO, RE e efeitos das decisões.",
              "Direitos e Garantias Fundamentais: Direitos Individuais e Coletivos (art. 5º), Direitos Sociais (arts. 6º a 11), Nacionalidade (arts. 12-13), Direitos Políticos (arts. 14-16), Partidos Políticos (art. 17).",
              "Organização do Estado: Organização Político-Administrativa, Repartição de Competências, Intervenção Federal, Administração Pública (arts. 37-41).",
              "Organização dos Poderes: Legislativo (arts. 44-70), Executivo (arts. 76-91), Judiciário (arts. 92-126), Funções Essenciais à Justiça (arts. 127-135).",
              "Defesa do Estado e das Instituições Democráticas: Estado de Defesa, Estado de Sítio, Forças Armadas.",
              "Segurança Pública: Disposições Gerais (art. 144), Órgãos de Segurança Pública, Atribuições da Polícia Civil.",
              "Ordem Social: Seguridade Social, Educação, Cultura e Desporto, Meio Ambiente, Família, Criança, Adolescente, Jovem e Idoso.",
              "Constituição do Estado do Piauí: Princípios Fundamentais, Direitos e Garantias, Organização dos Poderes, Administração Pública e Segurança Pública Estadual.",
            ],
          },
        ],
      },
      {
        nome: "DIREITO ADMINISTRATIVO",
        materias: [
          {
            titulo: "Direito Administrativo",
            topicos: [
              "Conceito, Fontes e Regime Jurídico Administrativo.",
              "Princípios da Administração Pública: expressos (art. 37, caput, CF) e implícitos. Disposições da LINDB aplicáveis (Lei nº 13.655/2018).",
              "Administração Pública: Conceitos, Estrutura, Desconcentração e Descentralização, Órgãos Públicos, Agentes Públicos.",
              "Atos Administrativos: Conceito, Requisitos, Atributos, Classificação, Espécies, Revogação, Anulação e Convalidação.",
              "Poderes da Administração Pública: Hierárquico, Disciplinar, Regulamentar, de Polícia, Abuso de Poder. Lei nº 13.869/2019.",
              "Organização Administrativa da Polícia Civil do Estado do Piauí (LC nº 37/2004 e LC nº 318/2025).",
              "Licitações e Contratos Administrativos (Lei nº 14.133/2021).",
              "Serviços Públicos: Conceito, classificação, princípios, formas de prestação.",
              "Responsabilidade Civil do Estado: Teoria do Risco Administrativo, excludentes, responsabilidade por atos legislativos e judiciais, responsabilidade de agentes públicos.",
              "Bens Públicos: Conceito, Classificação, Afetação e Desafetação, Regime jurídico, Formas de utilização.",
              "Intervenção do Estado na Propriedade Privada: Limitações Administrativas, Ocupação Temporária, Servidão, Requisição, Tombamento, Desapropriação.",
              "Controle da Administração Pública: Interno, Externo, Legislativo, Jurisdicional, Administrativo.",
              "Improbidade Administrativa.",
            ],
          },
        ],
      },
      {
        nome: "DIREITO PENAL",
        materias: [
          {
            titulo: "Direito Penal — Parte Geral",
            topicos: [
              "Princípios Fundamentais: Legalidade, Anterioridade, Irretroatividade, Culpabilidade, Humanidade, Insignificância, Intervenção Mínima, Fragmentariedade e Subsidiariedade.",
              "Aplicação da Lei Penal: Lei Penal no Tempo e no Espaço, Contagem de prazos, Analogia, Interpretação.",
              "Teoria Geral do Crime: Conceito, Fato Típico, Dolo e Culpa, Erro de Tipo, Ilicitude, Culpabilidade, Erro de Proibição, Coação irresistível e obediência hierárquica.",
              "Concurso de Pessoas: Autoria e Participação, Teorias, Punibilidade do partícipe.",
              "Teoria da Pena: Conceito, finalidades e espécies, Penas privativas de liberdade, restritivas de direitos, multa, Suspensão Condicional, Livramento Condicional, Efeitos da condenação, Reabilitação, Medidas de Segurança.",
              "Extinção da Punibilidade: Causas, Prescrição, Decadência e Perempção.",
            ],
          },
          {
            titulo: "Direito Penal — Parte Especial",
            topicos: [
              "Crimes Contra a Pessoa: Homicídio, Lesões Corporais, Periclitação da Vida e Saúde, Rixa, Crimes contra a Honra, Crimes contra a Liberdade Individual.",
              "Crimes Contra o Patrimônio: Furto, Roubo e Extorsão, Dano, Apropriação Indébita, Estelionato e Outras Fraudes, Receptação.",
              "Crimes Contra a Propriedade Imaterial: Industrial e Intelectual.",
              "Crimes Contra a Dignidade Sexual: Estupro e demais crimes sexuais, Satisfação de Lascívia, Registro Não Autorizado de Intimidade Sexual.",
              "Crimes Relacionados à Família e Relações de Dependência: Bigamia, Falsa Identidade, Abandono Material.",
              "Crimes Contra a Incolumidade Pública: Perigo Comum, Segurança dos Meios de Comunicação e Transporte, Saúde Pública.",
              "Crimes Contra a Paz Pública: Associação Criminosa, Constituição de Milícia Privada.",
              "Crimes Contra a Fé Pública: Moeda Falsa, Falsidade de Documento, Falsidade Ideológica, Falsificação de CTPS.",
              "Crimes Contra a Administração Pública: por Funcionário Público, por Particular, Contra a Administração da Justiça, Contra as Finanças Públicas.",
              "Crimes em Licitações e Contratos Administrativos (Capítulo II-B do CP).",
            ],
          },
          {
            titulo: "Legislação Penal Especial",
            topicos: [
              "Lei das Contravenções Penais (DL nº 3.688/1941).",
              "Crimes de Trânsito (Lei nº 9.503/1997).",
              "Crimes Eleitorais (Lei nº 4.737/1965).",
              "Crimes contra a Ordem Tributária, Econômica e Relações de Consumo (Lei nº 8.137/1990).",
              "Crimes de Abuso de Autoridade (Lei nº 13.869/2019).",
              "Crimes de Tráfico de Drogas (Lei nº 11.343/2006).",
              "Crimes Resultantes de Preconceito de Raça ou de Cor (Lei nº 7.716/1989).",
              "Organizações Criminosas (Lei nº 12.850/2013).",
              "Crimes contra o Meio Ambiente (Lei nº 9.605/1998).",
              "ECA — Crimes (Lei nº 8.069/1990).",
              "Estatuto do Idoso — Crimes (Lei nº 10.741/2003).",
              "Estatuto do Desarmamento (Lei nº 10.826/2003).",
              "Crimes de Tortura (Lei nº 9.455/1997).",
              "Violência Doméstica e Familiar Contra a Mulher (Lei nº 11.340/2006).",
              "Lei Henry Borel — Violência Contra Criança e Adolescente (Lei nº 14.344/2022).",
              "Crimes Hediondos (Lei nº 8.072/1990).",
              "Crimes Contra o Sistema Financeiro Nacional (Lei nº 7.492/1986).",
              "Lavagem ou Ocultação de Bens, Direitos e Valores (Lei nº 9.613/1998).",
              "Crimes Cibernéticos.",
            ],
          },
        ],
      },
      {
        nome: "DIREITO PROCESSUAL PENAL",
        materias: [
          {
            titulo: "Direito Processual Penal",
            topicos: [
              "Princípios Fundamentais e Constitucionais do Processo Penal.",
              "Sistemas Processuais Penais: Acusatório, Inquisitivo e Misto.",
              "Inquérito Policial: Conceito, natureza jurídica, características, finalidade, notitia criminis, diligências policiais, indiciamento, prazo, encerramento, arquivamento, vícios, valor probatório, atribuições do Delegado.",
              "Ação Penal: Conceito, condições, classificação, princípios, queixa-crime.",
              "Competência: Conceito, critérios de fixação, conexão e continência, prevenção, desaforamento.",
              "Prova: Conceito, objeto, meios, princípios, ônus, meios de prova, provas ilícitas, cadeia de custódia.",
              "Medidas Cautelares Pessoais: Prisão em flagrante, preventiva, temporária, liberdade provisória, medidas diversas da prisão.",
              "Prisão e Liberdade Provisória (arts. 283-350 CPP).",
              "Citações e Intimações. Sentença Penal: conceito, classificação, requisitos, nulidades.",
              "Recursos: Conceito, princípios, espécies, RESE, Apelação, HC, RE, REsp, Revisão Criminal.",
              "Nulidades: Conceito, princípios, classificação, vícios insanáveis e sanáveis.",
              "Procedimentos Especiais do CPP: Crimes de responsabilidade de funcionários públicos, Calúnia e Injúria, Tribunal do Júri.",
              "Lei de Prisão Temporária (Lei nº 7.960/1989).",
              "Lei do Depoimento Especial (Lei nº 13.431/2017).",
              "Investigação Criminal pelo Delegado de Polícia (Lei nº 12.830/2013).",
              "Proteção a Vítimas e Testemunhas (Lei nº 9.807/1999).",
              "Juizados Especiais Criminais (Lei nº 9.099/1995).",
              "Colaboração Premiada (Lei nº 12.850/2013).",
              "Interceptação Telefônica (Lei nº 9.296/1996).",
              "Apuração de Atos Infracionais — ECA (Lei nº 8.069/1990).",
              "Investigação Criminal Digital: busca e apreensão de dispositivos eletrônicos, quebra de sigilo telemático, cadeia de custódia digital, redes de computadores, protocolos de internet, ataques cibernéticos, malware, criptografia, blockchain e criptomoedas.",
            ],
          },
        ],
      },
      {
        nome: "DIREITO CIVIL",
        materias: [
          {
            titulo: "Direito Civil",
            topicos: [
              "LINDB: Vigência e aplicação das normas jurídicas, vacatio legis, conflito de leis no tempo e espaço, revogação.",
              "Parte Geral do CC: Pessoas Naturais e Jurídicas, Domicílio, Bens, Fatos Jurídicos, Atos lícitos e ilícitos, Prescrição e Decadência, Prova dos negócios jurídicos.",
              "Direito de Família: Casamento, Relações de parentesco, Regime de bens, Dissolução da sociedade conjugal, União estável, Tutela, curatela e tomada de decisão apoiada.",
              "Direito das Obrigações: Modalidades, Transmissão, adimplemento, extinção e inadimplemento.",
              "Responsabilidade Civil: Obrigação de indenizar, responsabilidade objetiva e subjetiva, excludentes, dano material e moral, repercussão da esfera criminal, responsabilidade do incapaz.",
              "ECA — Aspectos Civis (Lei nº 8.069/1990).",
              "Estatuto do Idoso — Aspectos Civis (Lei nº 10.741/2003).",
              "CDC — Aspectos Civis (Lei nº 8.078/1990).",
              "Lei de Parcelamento do Solo Urbano (Lei nº 6.766/1979).",
              "Estatuto da Advocacia (Lei nº 8.906/1994).",
              "Marco Civil da Internet (Lei nº 12.965/2014).",
            ],
          },
        ],
      },
      {
        nome: "DIREITOS HUMANOS",
        materias: [
          {
            titulo: "Direitos Humanos",
            topicos: [
              "Conceito, Evolução e Características dos Direitos Humanos: Dimensões/Gerações, fundamentação.",
              "Direito Internacional dos Direitos Humanos e o Direito Brasileiro: incorporação de tratados, hierarquia, princípios das relações internacionais.",
              "Sistema Global de Proteção: ONU, Declaração Universal (1948), Pacto de Direitos Civis e Políticos (1966), Pacto de Direitos Econômicos, Sociais e Culturais (1966).",
              "Sistema Regional Interamericano: OEA, Convenção Americana (Pacto de San José), Comissão e Corte Interamericana.",
              "Controle de Convencionalidade: conceito, fundamentos, modalidades, papel do STF e STJ.",
              "Direitos Humanos na CF/88: Dignidade da Pessoa Humana, direitos consagrados em tratados.",
              "Direitos e Proteção de Grupos Vulneráveis: doutrina, legislação e jurisprudência, Direitos dos Povos Originários.",
              "Direitos Humanos e Atividade Policial: promoção e proteção, prevenção à tortura, uso da força (ONU), Regras de Mandela, heteroidentificação em concursos.",
            ],
          },
        ],
      },
      {
        nome: "CIÊNCIAS FORENSES",
        materias: [
          {
            titulo: "Medicina Legal",
            topicos: [
              "Conceito e Divisão da Medicina Legal: histórico, importância, perícia médico-legal.",
              "Antropologia Forense: identificação humana, papiloscopia, prosopografia, odontologia legal, DNA, reconhecimento facial, IA na identificação pericial.",
              "Sexologia Forense: hímen, gravidez, parto, aborto, crimes sexuais.",
              "Traumatologia Forense: lesões e classificações, instrumentos contundentes, cortantes, perfurantes, asfixiologia, balística forense.",
              "Tanatologia Forense: morte, fenômenos cadavéricos, data da morte, causas jurídicas, necropsia.",
              "Toxicologia Forense: conceito, intoxicações por álcool, entorpecentes e outras substâncias, exames toxicológicos.",
              "Psicopatologia Forense: sanidade mental, imputabilidade, doenças mentais, simulação e dissimulação, perícia psiquiátrica.",
              "Criminologia e Vitimologia Forense: aspectos médico-legais.",
              "Documentoscopia e Grafoscopia: análise de documentos, escrita e assinaturas, falsificações.",
            ],
          },
          {
            titulo: "Criminologia",
            topicos: [
              "Conceito e Objeto da Criminologia: método, Criminologia Crítica e Positivista.",
              "Escolas Criminológicas: Clássica, Positiva, Sociologia Criminal, Etiquetamento, Criminologia Crítica e Abolicionismo, Teorias do Conflito, crimes em massa.",
              "Vitimologia: conceito, classificação das vítimas, papel da vítima, vitimização primária/secundária/terciária, políticas de assistência.",
              "Controle Social do Crime: conceito, formal e informal, agências de controle, prevenção do delito.",
              "Criminologia e Política Criminal: relação com Direito Penal, modelos de Política Criminal.",
              "Criminologia e Atuação Policial: conhecimento criminológico na investigação, perfil criminal, indicadores de criminalidade e estatísticas.",
              "Criminologia Digital: perfil do criminoso cibernético, deep web, dark web, ambientes digitais criminógenos, vitimização digital e prevenção.",
            ],
          },
        ],
      },
    ],
  },
  "oab": {
    preambulo: [
      "Conteúdo programático baseado no edital do 44º Exame de Ordem Unificado da OAB, organizado pela FGV.",
      "Toda legislação, súmulas e jurisprudência devem ser consideradas com as alterações e atualizações vigentes até a data da publicação do edital.",
    ],
    blocos: [
      {
        nome: "PROVA OBJETIVA — 1ª FASE",
        materias: [
          {
            titulo: "DIREITO ADMINISTRATIVO",
            topicos: [
              "Princípios, fontes e interpretação. Lei nº 13.655/2018 e suas disposições sobre segurança jurídica e eficiência na criação e na aplicação do direito público.",
              "Acesso à Informação (Lei 12.527/2011), tratamento de dados pelo Poder Público e sanções administrativas na LGPD (Lei 13.709/2018).",
              "Atividade e estrutura administrativa. Organização administrativa brasileira. Terceiro setor.",
              "Poderes administrativos: poderes e deveres do administrador público, uso e abuso do poder, vinculação e discricionariedade. Poder hierárquico. Poder disciplinar e processo administrativo disciplinar. Poder regulamentar. Poder de polícia.",
              "Atos administrativos: conceito, atributos, classificação, espécies, extinção.",
              "Licitações e contratos. Lei 8.666/93 e Lei 14.133/2021.",
              "Serviços públicos. Serviços delegados, convênios e consórcios. Agências Reguladoras. Lei nº 13.848/2019. Parcerias público-privadas.",
              "Agentes públicos: espécies, regime jurídico, direitos, deveres e responsabilidades. Teto remuneratório.",
              "Domínio público: afetação e desafetação, regime jurídico, aquisição e alienação, utilização dos bens públicos pelos particulares.",
              "Intervenção estatal na propriedade: desapropriação, requisição, servidão administrativa, ocupação, tombamento.",
              "Intervenção estatal no domínio econômico: repressão ao abuso do poder econômico.",
              "Controle da Administração Pública: controle administrativo, legislativo, externo (Tribunal de Contas), judiciário. A Administração em juízo. Lei Anticorrupção (Lei 12.846/2013) e Lei de Responsabilidade das Estatais (Lei 13.303/2016).",
              "Improbidade administrativa: Lei 8.429/92, com alterações da Lei 14.230/21.",
              "Lei de Abuso de Autoridade: Lei nº 13.869/2019.",
              "Responsabilidade civil do Estado: previsão, elementos, excludentes, direito de regresso.",
              "A prescrição no direito administrativo. Legislação extravagante.",
              "Aplicabilidade das leis de processo administrativo: direito de petição, recursos administrativos, pareceres.",
              "Ações constitucionais: mandado de segurança, habeas data, habeas corpus, ação popular, ação civil pública.",
              "Ações de procedimento comum e especial. Petição inicial. Contestação e reconvenção. Provas. Recursos. Reclamação. Cumprimento de sentença e execução. Embargos à Execução. Tutelas de urgência e de evidência.",
              "Estatuto da Cidade.",
            ],
          },
          {
            titulo: "DIREITO CIVIL",
            topicos: [
              "Direito Civil e Constituição da República Federativa do Brasil.",
              "Pessoa natural e Direitos da personalidade. LGPD (Lei 13.709/2018).",
              "Pessoa jurídica. Domicílio. Bens.",
              "Fatos, Atos e Negócios Jurídicos: formação, validade, eficácia e elementos. Atos Ilícitos.",
              "Prescrição e Decadência. Prova.",
              "Teoria Geral das Obrigações. Modalidades. Transmissão. Adimplemento e Extinção. Inadimplemento. Títulos de Crédito. Preferências e Privilégios Creditórios.",
              "Atos Unilaterais.",
              "Teoria do Contrato. Contratos em espécie.",
              "Teoria da Responsabilidade civil. Modalidades e reparação.",
              "Posse. Direitos Reais.",
              "Casamento, União Estável. Dissolução do Casamento e da União Estável.",
              "Parentesco. Monoparentalidade. Multiparentalidade.",
              "Legislação extravagante. Poder Familiar.",
              "Regimes de Bens e outros Direitos Patrimoniais nas relações familiares. Usufruto e Administração dos Bens de Filhos Menores. Tutela, Curatela e Tomada de Decisão Apoiada.",
              "Alimentos.",
              "Sucessão em Geral. Sucessão legítima. Inventário e Partilha.",
              "Sucessão testamentária e disposições de última vontade.",
              "Leis Civis Especiais.",
              "Direito do Consumidor — Código de Defesa do Consumidor (Lei 8.078/1990).",
            ],
          },
          {
            titulo: "DIREITO PROCESSUAL CIVIL",
            topicos: [
              "Teoria geral do processo. Normas processuais civis. Direitos processuais fundamentais. Disposições finais e transitórias do CPC/2015.",
              "Política de tratamento adequado de conflitos jurídicos. Negociação, mediação, conciliação. Equivalentes jurisdicionais. Arbitragem.",
              "Teoria dos fatos jurídicos processuais. Função jurisdicional. Cooperação internacional e nacional.",
              "Trilogia do Direito Processual: Jurisdição, Ação e Processo. Teoria da Ação. Pressupostos Processuais.",
              "Divisão da Jurisdição e Competência.",
              "Sujeitos do processo. Deveres e responsabilidade por dano processual. Despesas processuais e honorários advocatícios. Gratuidade de justiça.",
              "Partes. Litisconsórcio. Intervenção de terceiros. Incidente de desconsideração da personalidade jurídica. Amicus Curiae.",
              "Juiz: poderes, deveres e responsabilidade. Impedimentos e suspeição. Auxiliares da justiça.",
              "Funções Essenciais à Justiça. Atos processuais. Processo eletrônico. Negócios Processuais. Prazos. Comunicações. Citação. Intimações.",
              "Nulidades. Preclusão. Cognição. Tutela Provisória (inclusive contra a Fazenda Pública).",
              "Formação, suspensão e extinção do processo. Alienação da coisa ou do direito litigioso.",
              "Procedimento comum e especiais. Petição inicial. Pedido. Valor da causa. Improcedência liminar. Audiência de conciliação ou de mediação. Respostas do réu.",
              "Providências preliminares. Revelia. Fatos supervenientes. Julgamento conforme o estado do processo.",
              "Provas: teoria geral e provas em espécie. Decisão judicial. Precedentes judiciais. Coisa julgada.",
              "Ordem dos processos nos Tribunais. Remessa necessária. Teoria geral dos recursos e recursos em espécie. Ação rescisória. Reclamação.",
              "Microssistema de julgamento de casos repetitivos. Incidente de resolução de demandas repetitivas. Incidente de assunção de competência.",
              "Execução: teoria geral, demanda executiva, liquidação, título executivo, responsabilidade patrimonial, fraudes, penhora, expropriação, suspensão e extinção.",
              "Procedimentos especiais do CPC. Jurisdição voluntária.",
              "Procedimentos especiais em legislação extravagante: Juizados Especiais, mandado de segurança, habeas corpus/data, ação popular, ação civil pública, CDC, ECA, Execução Fiscal, Locações, Desapropriação, Alienação fiduciária, Alimentos, Registros Públicos, Lei Maria da Penha, Estatuto da Pessoa com Deficiência, Estatuto do Idoso, usucapião especial.",
              "Processo coletivo: microssistema, situações jurídicas coletivas, normas fundamentais, processo estrutural, coisa julgada, liquidação e execução.",
            ],
          },
          {
            titulo: "DIREITO CONSTITUCIONAL",
            topicos: [
              "Constituição: conceito, classificação e elementos. Aplicabilidade e eficácia das normas constitucionais.",
              "Histórico das Constituições Brasileiras. Neoconstitucionalismo.",
              "Poder constituinte: originário, derivado e decorrente. Interpretação do texto constitucional.",
              "Controle de Constitucionalidade: história, conceito, espécies, momentos, sistemas. ADI, ADI por Omissão, ADC, ADPF. Processos de julgamento (Leis 9.868/99 e 9.882/99). Súmula Vinculante (Lei 11.417/06).",
              "Preâmbulo Constitucional. Legislação extravagante. Princípios Fundamentais.",
              "Direitos e Garantias Fundamentais.",
              "Tutela Constitucional das Liberdades: HC, HD, MS individual e coletivo, MI, Direito de Certidão, Acesso à Informação (Lei 12.527/11), Direito de Petição, Ação Popular, Ação Civil Pública.",
              "Direitos Sociais. Direito de Nacionalidade. Direitos Políticos.",
              "Divisão Espacial do Poder. Organização do Estado: União, Estados, Municípios, DF e Territórios. Da intervenção.",
              "Administração Pública.",
              "Organização dos Poderes: Legislativo, Processo Legislativo, Executivo, Judiciário. Funções Essenciais à Justiça.",
              "Da Tributação e do Orçamento: Sistema Tributário Nacional. Sistema Orçamentário e Finanças Públicas.",
              "Defesa do Estado e das Instituições Democráticas.",
              "Ordem Econômica e Financeira. Princípios Gerais da Atividade Financeira. Ordem Social.",
              "ADCT. Ações de procedimento comum e especial. Petição inicial. Resposta do Réu. Recursos. Recurso Ordinário e Extraordinário. Reclamação. Tutelas provisórias.",
            ],
          },
          {
            titulo: "DIREITO DO TRABALHO",
            topicos: [
              "Direito do Trabalho: conceito, características, divisão, natureza, funções, autonomia. Fundamentos e formação histórica. Flexibilização e desregulamentação.",
              "Fontes formais e materiais. Conflitos de normas e suas soluções. Hermenêutica: interpretação, integração e aplicação. Eficácia no tempo e no espaço.",
              "Princípios do Direito do Trabalho. Renúncia e transação.",
              "Relação de trabalho e relação de emprego. Estrutura da relação empregatícia. CTPS.",
              "Relações de trabalho lato sensu: autônomo, eventual, temporário, avulso, estágio, cooperativas, trabalho voluntário.",
              "Empregado: conceito e requisitos. Altos empregados, cargos de confiança, hipersuficiente. Aprendizagem. Bancários e categorias especiais.",
              "Empregado doméstico: EC 72/13 e LC 150/15.",
              "Empregador: conceito, poderes (diretivo, regulamentar, fiscalizatório, disciplinar). Grupo econômico. Sucessão de empresas. Responsabilização solidária e subsidiária.",
              "Trabalho rural. Terceirização no Direito do Trabalho.",
              "Contrato de emprego: morfologia, classificação, elementos. Modalidades de contratos. Pejotização. Trabalho ilícito e proibido. Trabalho infantil e do menor.",
              "Efeitos conexos do contrato: direitos intelectuais, invenções, propriedade intelectual, danos materiais e extrapatrimoniais.",
              "Duração do trabalho: jornada, trabalho extraordinário, noturno, banco de horas, tempo à disposição, turno ininterrupto, teletrabalho.",
              "Repousos: intervalos, repouso semanal, feriados, férias.",
              "Remuneração e salário: gorjetas, adicionais, gratificação, comissões, 13º salário, salário in natura, stock options. Proteção e descontos salariais. Equiparação salarial.",
              "Alteração do contrato de emprego. Acidente do trabalho. Interrupção e suspensão do contrato.",
              "Cessação do contrato: resilição, resolução, rescisão. Dispensas individual, plúrima e coletiva. Aviso prévio. Estabilidade e garantias provisórias. FGTS.",
              "Prescrição e decadência no Direito do Trabalho. Segurança e higiene do trabalho.",
              "Direito Coletivo do Trabalho: conflitos coletivos, liberdade sindical, organização sindical, entidades sindicais, negociação coletiva, instrumentos normativos, prevalência do negociado sobre o legislado.",
              "Poder normativo da Justiça do Trabalho. Condutas antissindicais. Greve. Direitos difusos, coletivos e individuais homogêneos.",
              "Leis 13.467/17 (reforma CLT), 13.874/19, LGPD, Lei 14.457/22, Lei 14.442/22, Lei 14.597/2023 (Lei Geral do Esporte). Teses Vinculantes do TST.",
            ],
          },
          {
            titulo: "DIREITO PROCESSUAL DO TRABALHO",
            topicos: [
              "Direito Processual do Trabalho: princípios, fontes, autonomia, interpretação, integração, eficácia.",
              "Organização da Justiça do Trabalho: composição, funcionamento, jurisdição e competência.",
              "Ministério Público do Trabalho: organização, competência, atribuições, inquérito civil.",
              "Competência da Justiça do Trabalho: matéria, pessoas, funcional, lugar. Conflitos de competência.",
              "Partes, procuradores, representação, substituição processual, litisconsórcio, intervenção de terceiros. Assistência Judiciária. Justiça Gratuita. Jus Postulandi.",
              "Atos, termos e prazos processuais. Despesas processuais. Custas e emolumentos. Comunicação dos atos. Aplicação do Direito Processual Comum. IN 39/16 do TST.",
              "Nulidades no processo do trabalho. Preclusão.",
              "Dissídio individual e coletivo. Procedimentos comum, sumário e sumaríssimo. Petição inicial. Pedido.",
              "Audiência. Arquivamento e revelia. Conciliação. Homologação de acordo extrajudicial. Resposta: contestação, exceção, reconvenção.",
              "Provas: princípios, ônus e espécies. Documentos. Perícia. Testemunhas. Razões finais.",
              "Sentença nos dissídios individuais. Honorários advocatícios. Responsabilidade por Dano Processual.",
              "Sistema recursal trabalhista: princípios, procedimentos, efeitos. Recurso ordinário, agravo de petição, agravo de instrumento, embargos de declaração, recurso de revista, recurso adesivo, recurso extraordinário. Embargos no TST. Reclamação e Correição Parcial.",
              "Execução Trabalhista: provisória e definitiva. Aplicação subsidiária da Lei de Execuções Fiscais. Títulos judiciais e extrajudiciais. Execução contra massa falida e empresa em recuperação judicial.",
              "Liquidação da Sentença. Penhora. Desconsideração da personalidade jurídica. Responsabilidade do sócio retirante. Garantia do juízo.",
              "Embargos à Execução. Exceção de pré-executividade. Embargos de Terceiro. Fraude à execução.",
              "Arrematação, Adjudicação, Remição. Execução contra a Fazenda Pública: precatório e RPV.",
              "Execução das contribuições previdenciárias. Inquérito para apuração de falta grave.",
              "Procedimentos especiais: consignação em pagamento, prestação de contas, mandado de segurança, ação monitória, HC, HD, produção antecipada de provas. Ação anulatória. Mediação e arbitragem.",
              "Ação civil pública e coletiva. Dissídio Coletivo: conceito, classificação, competência, instauração, sentença normativa.",
              "Ação rescisória no processo do trabalho. Tutelas de urgência, evidência e cautelar. Processo Judicial eletrônico. Lei 13.467/17 e IN 41/18 do TST. Teses Vinculantes do TST.",
            ],
          },
          {
            titulo: "DIREITO EMPRESARIAL",
            topicos: [
              "Do Direito de Empresa: fontes, conceito de empresa, empresário, caracterização e inscrição. Capacidade e incapacidade. Empresário rural. MEI, pequeno empresário, ME e EPP.",
              "Da Sociedade: disposições gerais, sociedade não personificada (em comum, em conta de participação), sociedade personificada. Desconsideração da personalidade jurídica.",
              "Sociedades de pessoas: simples, limitada, cooperativa. Dissolução, liquidação e extinção. Transformação, incorporação, fusão e cisão.",
              "Do Estabelecimento: disposições gerais, natureza jurídica, elementos, clientela e aviamento.",
              "Institutos Complementares: Registro Empresarial, nome empresarial, escrituração, prepostos.",
              "Sociedade Anônima. Lei nº 13.303/2016 (Lei das Estatais). Regime Societário e Função Social.",
              "Valores Mobiliários. Lei 6.385/76. Comissão de Valores Mobiliários.",
              "Recuperação Judicial, Extrajudicial e Falência do Empresário e da Sociedade Empresária.",
              "Contratos Empresariais. Lei nº 13.874/2019 (Declaração de Direitos de Liberdade Econômica).",
              "Títulos de Crédito: teoria geral, disposições do CC, títulos cambiais, cheque, duplicata (Lei 5.474/68 e Lei 13.775/2018), títulos representativos e de financiamento. Protesto (Lei 9.492/97).",
              "Sistema Financeiro Nacional. Lei 4.595/1964. Intervenção e Liquidação Extrajudicial de Instituições Financeiras.",
              "Propriedade Industrial: patentes, desenhos industriais, marcas, concorrência desleal.",
              "Defesa da Concorrência: Lei 12.529/2011, SBDC, infrações da ordem econômica, controle de concentrações.",
              "Lei Anticorrupção (Lei 12.846/2013 e Decreto 11.129/2022). Arbitragem (Lei 9.307/1996).",
              "Mercado de capitais (Lei 4.728/1965). Alienação fiduciária (DL 911/1969 e Lei 9.514/1997). Lei do Inquilinato (Lei 8.245/1991). Representação comercial autônoma (Lei 4.886/1965).",
              "CPC - Parte Geral e Especial aplicável ao Direito Empresarial.",
            ],
          },
          {
            titulo: "DIREITO PENAL",
            topicos: [
              "História do Direito Penal. Criminologia. Política Criminal.",
              "Princípios penais e constitucionais. Interpretação e integração da lei penal. Analogia.",
              "Norma penal: classificação e espécie das infrações penais. Concurso aparente de normas.",
              "Aplicação da Lei Penal: no Tempo e no Espaço.",
              "Teoria Geral do Delito: conduta, relação de causalidade, imputação objetiva, tipo penal doloso e culposo, tipicidade, antijuridicidade, culpabilidade.",
              "Condições objetivas de punibilidade e escusas absolutórias. Consumação e tentativa. Desistência voluntária. Arrependimento eficaz e posterior. Crime impossível.",
              "Erro: de tipo, de proibição, de tipo permissivo.",
              "Concurso de Pessoas.",
              "Penas e seus critérios de aplicação. Origens e finalidades. Teorias, espécies, aplicação. Concurso de crimes. Suspensão condicional da pena.",
              "Efeitos da condenação. Reabilitação. Medidas de segurança e sua execução.",
              "Causas Extintivas de Punibilidade. Ação Penal.",
              "Crimes em espécie.",
              "Execução Penal (Lei 7.210/84): livramento condicional, progressão e regressão, remição, detração, incidentes de execução.",
              "Legislação Penal Extravagante. Leis Penais Especiais.",
            ],
          },
          {
            titulo: "DIREITO PROCESSUAL PENAL",
            topicos: [
              "Princípios constitucionais e processuais penais. Sistemas processuais penais.",
              "Aplicação da lei processual penal: interpretação e integração. A lei processual penal no tempo e no espaço.",
              "Imunidades processuais penais. Inquérito Policial.",
              "Ação Penal: denúncia, queixa-crime, representação, espécies. Ação Civil ex delicto.",
              "Jurisdição e Competência. Questões e Processos Incidentes.",
              "Direito Probatório.",
              "Do Juiz, do Ministério Público, do Acusado e Defensor, dos Assistentes e Auxiliares da Justiça.",
              "Atos de comunicação: citações e intimações. Atos judiciais: despacho, decisão, sentença.",
              "Da Prisão e demais Medidas Cautelares. Liberdade Provisória.",
              "Procedimentos do CPP. Procedimentos especiais na legislação extravagante.",
              "Nulidades. Legislação extravagante. Recursos.",
              "Ações Autônomas de Impugnação. Disposições gerais do CPP.",
              "Institutos de execução penal. Graça, anistia e indulto.",
              "Legislação Processual Penal Extravagante. Procedimentos de investigação criminal. Acordo de não persecução penal. Audiência de custódia. Cadeia de custódia da prova.",
            ],
          },
          {
            titulo: "DIREITO TRIBUTÁRIO E PROCESSUAL TRIBUTÁRIO",
            topicos: [
              "Fontes do Direito Tributário: Constituição, Lei Complementar, Lei Ordinária, Tratados, Decretos, Atos normativos, Decisões normativas, Práticas reiteradas, Convênios.",
              "Princípios tributários: legalidade, anterioridade (anual e nonagesimal), non olet, capacidade contributiva, isonomia, seletividade, irretroatividade, vedação ao confisco, não limitação ao tráfego.",
              "Limitações ao poder de tributar. Vigência, aplicação, interpretação e integração da lei tributária.",
              "Tributo: definição e classificação. Impostos. Taxas. Contribuição de Melhoria. Contribuições especiais. Empréstimos Compulsórios.",
              "Competência Tributária.",
              "Benefícios fiscais: Imunidade (geral, recíproca, templos, partidos/sindicatos/entidades, imprensa, fonogramas). Isenção. Anistia. Remissão. Outros benefícios.",
              "Distribuição das Receitas Tributárias.",
              "Responsabilidade Tributária: solidariedade, dos sucessores, de terceiros, substituição tributária, por infrações. Denúncia espontânea. Multas tributárias.",
              "Obrigação Tributária: fato gerador, hipótese de incidência, sujeição ativa e passiva, solidariedade, capacidade tributária, domicílio tributário.",
              "Crédito Tributário: constituição (lançamento), suspensão, extinção (prescrição e decadência), exclusão.",
              "Garantias e Privilégios do Crédito Tributário.",
              "Administração Tributária: fiscalização, dívida ativa, certidões negativas, protesto de CDA. Legislação extravagante.",
              "Processo Administrativo Tributário: estrutura, contencioso administrativo, processo de consulta.",
              "Processo Judicial Tributário: ação declaratória, ação anulatória, mandado de segurança, repetição de indébito, consignação em pagamento.",
              "Execução Fiscal: embargos à execução fiscal, exceção de pré-executividade, defesas em medida cautelar fiscal.",
            ],
          },
        ],
      },
    ],
  },
  "escrevente técnico judiciário": {
    preambulo: [
      "Toda legislação deve ser considerada com as alterações e atualizações vigentes até a data da publicação deste edital de abertura de inscrições.",
      "Legislação com entrada em vigor após a publicação deste edital de abertura de inscrições poderá ser utilizada, quando superveniente ou complementar a algum tópico já previsto ou indispensável à avaliação da prova.",
      "Todos os temas englobam também a legislação que lhes é pertinente, ainda que não expressas no(s) conteúdo(s) programático(s).",
      "Os links que constam no conteúdo programático servem apenas como orientação do local em que se encontra o normativo, não cabendo ao(à) candidato(a) alegar que o link está inválido, posto que, por estarem na internet, podem ser modificados a qualquer momento pelos responsáveis pelas respectivas páginas.",
    ],
    blocos: [
      {
        nome: "BLOCO I: Língua Portuguesa (16 questões)",
        materias: [
          {
            titulo: "Língua Portuguesa",
            topicos: [
              "Análise, compreensão e interpretação de diversos tipos de textos verbais, não verbais, literários e não literários.",
              "Informações literais e inferências possíveis.",
              "Ponto de vista do autor.",
              "Estruturação do texto: relações entre ideias; recursos de coesão.",
              "Significação contextual de palavras e expressões.",
              "Sinônimos e antônimos.",
              "Sentido próprio e figurado das palavras.",
              "Classes de palavras: emprego e sentido que imprimem às relações que estabelecem: substantivo, adjetivo, artigo, numeral, pronome, verbo, advérbio, preposição e conjunção.",
              "Concordância verbal e nominal.",
              "Regência verbal e nominal.",
              "Colocação pronominal.",
              "Crase.",
              "Pontuação.",
            ],
          },
        ],
      },
      {
        nome: "BLOCO II: Conhecimentos em Direito (30 questões)",
        materias: [
          {
            titulo: "Direito Penal",
            topicos: [
              "Código Penal - artigos 293 a 305; 307; 308; 311-A; 312 a 317; 319 a 333; 336 e 337; 339 a 347; 357 e 359.",
            ],
          },
          {
            titulo: "Direito Processual Penal",
            topicos: [
              "Código de Processo Penal - artigos 251 a 258; 261 a 267; 274; 351 a 372; 394 a 497; 531 a 538; 541 a 548; 574 a 667.",
              "Lei n.º 9.099 de 26.09.1995 (artigos 60 a 83; 88 e 89).",
            ],
          },
          {
            titulo: "Direito Processual Civil",
            topicos: [
              "Código de Processo Civil - artigos 144 a 155; 188 a 275; 294 a 311 e do 318 a 538; 994 a 1026.",
              "Lei n.º 9.099 de 26.09.1995 (artigos 3º ao 19).",
              "Lei n.º 12.153 de 22/12/2009.",
            ],
          },
          {
            titulo: "Direito Constitucional",
            topicos: [
              "Constituição Federal – Título II - Capítulos I, II e III; e Título III - Capítulo VII com Seções I e II; e também o artigo 92.",
            ],
          },
          {
            titulo: "Direito Administrativo",
            topicos: [
              "Estatuto dos Funcionários Públicos Civis do Estado de São Paulo (Lei n.º 10.261/68) - artigos 1º a 86; 171 a 175; 239 a 323.",
              "Lei Federal n.º 8.429/92 (Lei de Improbidade Administrativa).",
            ],
          },
          {
            titulo: "Legislação Interna",
            topicos: [
              "Resolução TJSP nº 850/2021 (Regulamenta o teletrabalho no âmbito do Tribunal de Justiça do Estado de São Paulo e dá outras providências).",
              "Resolução TJSP nº 963/2025 (Dispõe sobre a governança e utilização do sistema eproc nas unidades do Poder Judiciário do Estado de São Paulo e dá outras providências).",
              "Lei Complementar n° 1.111/2010 (Institui o Plano de Cargos e Carreiras dos servidores do Tribunal de Justiça do Estado de São Paulo e dá providências correlatas).",
              "Regimento Interno do Tribunal de Justiça.",
              "Normas da Corregedoria Geral da Justiça: Tomo I – Capítulo II: Seção I – subseções I e II; Tomo I - Capítulo III: Seções I, II, V, VI, VII; Tomo I - Capítulo III: Seção VIII – subseções I, II e III; Tomo I – Capítulo III: Seções IX a XIX; Tomo I – Capítulo XI: Seções I, IV e V; Tomo I – Capítulo XI: Seção I a VII.",
            ],
          },
        ],
      },
      {
        nome: "BLOCO III: Conhecimentos Gerais",
        materias: [
          {
            titulo: "Atualidades (4 questões)",
            topicos: [
              "Questões relacionadas a fatos políticos, econômicos, sociais e culturais, nacionais e internacionais, ocorridos a partir do 1° semestre de 2025, divulgados na mídia local e/ou nacional.",
              "Artigos 1º ao 13; 34 ao 38 da Lei n.º 13.146/2015 – Estatuto da Pessoa com Deficiência, com as alterações vigentes até a publicação deste edital.",
            ],
          },
          {
            titulo: "Matemática (4 questões)",
            topicos: [
              "Operações com números reais.",
              "Mínimo múltiplo comum e máximo divisor comum.",
              "Razão e proporção.",
              "Porcentagem.",
              "Regra de três simples e composta.",
              "Média aritmética simples e ponderada.",
              "Juros simples.",
              "Equação do 1.º e 2.º graus.",
              "Sistema de equações do 1.º grau.",
              "Relação entre grandezas: tabelas e gráficos.",
              "Sistemas de medidas usuais.",
              "Noções de geometria: forma, perímetro, área, volume, ângulo, teorema de Pitágoras.",
              "Resolução de situações-problema.",
            ],
          },
          {
            titulo: "Informática (9 questões)",
            topicos: [
              "MS-Windows 10 ou superior: conceito de pastas, diretórios, arquivos e atalhos, área de trabalho, área de transferência, manipulação de arquivos e pastas, uso dos menus, programas e aplicativos.",
              "Interação com o conjunto de aplicativos do Microsoft-365.",
              "MS-Word: estrutura básica dos documentos, edição e formatação de textos, cabeçalhos, parágrafos, fontes, colunas, marcadores simbólicos e numéricos, tabelas, impressão, controle de quebras e numeração de páginas, legendas, índices, inserção de objetos, campos predefinidos, caixas de texto.",
              "MS-Excel: estrutura básica das planilhas, conceitos de células, linhas, colunas, pastas e gráficos, elaboração de tabelas e gráficos, uso de fórmulas, funções e macros, impressão, inserção de objetos, campos predefinidos, controle de quebras e numeração de páginas, obtenção de dados externos, classificação de dados.",
              "Correio Eletrônico: uso de correio eletrônico, preparo e envio de mensagens, anexação de arquivos.",
              "Internet: navegação internet, conceitos de URL, links, sites, busca e impressão de páginas.",
              "MS Teams: chats, chamadas de áudio e vídeo, criação de grupos, trabalho em equipe: Word, Excel, PowerPoint, SharePoint e OneNote, agendamento de reuniões e gravação.",
              "OneDrive: armazenamento e compartilhamento de arquivos.",
            ],
          },
          {
            titulo: "Raciocínio Lógico (7 questões)",
            topicos: [
              "Estruturas lógicas, lógicas de argumentação, diagramas lógicos.",
              "Sequências: visa avaliar se o(a) candidato(a) identifica as regularidades de uma sequência, numérica ou figural, de modo a indicar qual é o elemento de uma dada posição.",
              "Habilidade em entender a estrutura lógica das relações arbitrárias entre pessoas, lugares, coisas, eventos fictícios; deduzir novas informações das relações fornecidas e avaliar as condições usadas para estabelecer a estrutura daquelas relações.",
            ],
          },
        ],
      },
    ],
  },
};

interface Props {
  cargo: string;
}

export default function CargoEstudar({ cargo }: Props) {
  const key = cargo.toLowerCase();
  const conteudo = Object.entries(CONTEUDO_POR_CARGO).find(
    ([k]) => key.includes(k) || k.includes(key)
  )?.[1];

  if (!conteudo) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Conteúdo programático ainda não disponível para este cargo.
      </p>
    );
  }

  const totalMaterias = conteudo.blocos.reduce((acc, b) => acc + b.materias.length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <BookOpen className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-foreground leading-relaxed">
            Conteúdo programático oficial com{" "}
            <span className="font-semibold text-amber-400">{totalMaterias} matérias</span> distribuídas
            em {conteudo.blocos.length} blocos. Estude cada área com atenção especial
            aos temas mais cobrados identificados no <span className="font-semibold">Raio-X</span>.
          </p>
        </div>
      </div>

      {/* Preâmbulo */}
      <div className="space-y-2 px-1">
        {conteudo.preambulo.map((p, i) => (
          <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">
            {p}
          </p>
        ))}
      </div>

      {/* Blocos */}
      {conteudo.blocos.map((bloco) => (
        <div key={bloco.nome} className="space-y-1">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider px-1 pt-2">
            {bloco.nome}
          </h3>

          <Accordion type="multiple" className="w-full">
            {bloco.materias.map((mat) => (
              <AccordionItem
                key={mat.titulo}
                value={mat.titulo}
                className="border-border/30"
              >
                <AccordionTrigger className="py-3 text-xs font-semibold text-foreground hover:no-underline gap-2">
                  <div className="flex items-center gap-2 text-left">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>{mat.titulo}</span>
                    <span className="text-[10px] font-normal text-muted-foreground whitespace-nowrap">
                      ({mat.topicos.length} tópicos)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="space-y-2 pl-6">
                    {mat.topicos.map((topico, idx) => (
                      <li key={idx} className="flex gap-2 text-[11px] text-muted-foreground leading-relaxed">
                        <span className="text-amber-400/70 font-semibold flex-shrink-0 min-w-[18px] text-right">
                          {idx + 1}.
                        </span>
                        <span>{topico}</span>
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
