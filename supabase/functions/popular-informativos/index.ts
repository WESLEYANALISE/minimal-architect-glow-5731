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

    // Clear existing data
    await supabase.from('informativos_notas').delete().neq('id', 0);
    await supabase.from('informativos_jurisprudencia').delete().neq('id', 0);

    const stfData = [
      { num: 1208, data: "2026-03-21", notas: [
        { orgao: "Plenário", ramo: "DIREITO CONSTITUCIONAL", tema: "Militares estaduais e direito de greve", destaque: "Os militares estaduais não possuem direito de greve, sendo vedada a cessação coletiva do serviço, conforme interpretação do art. 142, §3º, IV, da CF.", processo: "ARE 654432", relator: "Min. Alexandre de Moraes" },
        { orgao: "Plenário", ramo: "DIREITO CONSTITUCIONAL", tema: "Nacionalidade originária e registro consular", destaque: "É brasileira nata a pessoa nascida no estrangeiro, filha de pai ou mãe brasileiro, que tenha sido registrada em repartição brasileira competente.", processo: "RE 1319166", relator: "Min. Luís Roberto Barroso" },
        { orgao: "Primeira Turma", ramo: "DIREITO PENAL", tema: "Execução provisória e tribunal do júri", destaque: "É constitucional a execução provisória da pena imposta pelo Tribunal do Júri, independentemente do total da condenação.", processo: "HC 218354", relator: "Min. Cármen Lúcia" },
        { orgao: "Segunda Turma", ramo: "DIREITO ADMINISTRATIVO", tema: "Concurso público e controle judicial de questões", destaque: "O Poder Judiciário pode anular questões de concurso público quando houver flagrante ilegalidade ou erro material comprovado.", processo: "RE 632853", relator: "Min. Gilmar Mendes" },
      ]},
      { num: 1207, data: "2026-03-14", notas: [
        { orgao: "Plenário", ramo: "DIREITO TRIBUTÁRIO", tema: "ICMS na base de cálculo do PIS e da COFINS", destaque: "O ICMS não compõe a base de cálculo para a incidência do PIS e da COFINS, considerando o conceito constitucional de faturamento.", processo: "RE 574706", relator: "Min. Cármen Lúcia" },
        { orgao: "Primeira Turma", ramo: "DIREITO PROCESSUAL CIVIL", tema: "Legitimidade do MP em ações de improbidade", destaque: "O Ministério Público possui legitimidade ativa para propor ação de improbidade administrativa contra agentes políticos.", processo: "RE 1368785", relator: "Min. Luiz Fux" },
        { orgao: "Segunda Turma", ramo: "DIREITO DO TRABALHO", tema: "Terceirização e responsabilidade subsidiária", destaque: "A Administração Pública responde subsidiariamente pelos encargos trabalhistas quando comprovada a falha na fiscalização do contrato.", processo: "ARE 1371247", relator: "Min. Nunes Marques" },
      ]},
      { num: 1206, data: "2026-03-07", notas: [
        { orgao: "Plenário", ramo: "DIREITO CONSTITUCIONAL", tema: "Marco temporal das terras indígenas", destaque: "É inconstitucional a tese do marco temporal que exige a presença de indígenas na data da promulgação da CF/88 para demarcação de terras.", processo: "RE 1017365", relator: "Min. Edson Fachin" },
        { orgao: "Plenário", ramo: "DIREITO PENAL", tema: "Descriminalização do porte de maconha para uso pessoal", destaque: "O porte de maconha para consumo pessoal é atípico penalmente, devendo ser tratado como infração administrativa.", processo: "RE 635659", relator: "Min. Gilmar Mendes" },
        { orgao: "Primeira Turma", ramo: "DIREITO CIVIL", tema: "Dano moral coletivo em relações de consumo", destaque: "É cabível dano moral coletivo quando a conduta ilícita atinge direitos transindividuais de consumidores de forma abrangente.", processo: "RE 1473453", relator: "Min. Alexandre de Moraes" },
      ]},
      { num: 1205, data: "2026-02-28", notas: [
        { orgao: "Plenário", ramo: "DIREITO ADMINISTRATIVO", tema: "Teto remuneratório e parcelas indenizatórias", destaque: "As parcelas de caráter indenizatório não se submetem ao teto remuneratório constitucional previsto no art. 37, XI, da CF.", processo: "RE 1292524", relator: "Min. Dias Toffoli" },
        { orgao: "Segunda Turma", ramo: "DIREITO PROCESSUAL PENAL", tema: "Prisão preventiva e fundamentação adequada", destaque: "A decisão que decreta prisão preventiva deve demonstrar concretamente a necessidade da medida, sendo insuficiente a mera indicação abstrata.", processo: "HC 226987", relator: "Min. Ricardo Lewandowski" },
      ]},
      { num: 1204, data: "2026-02-21", notas: [
        { orgao: "Plenário", ramo: "DIREITO CONSTITUCIONAL", tema: "Autonomia universitária e liberdade de cátedra", destaque: "A autonomia universitária prevista no art. 207 da CF protege a liberdade de ensino e pesquisa, vedando interferências externas no conteúdo acadêmico.", processo: "ADPF 548", relator: "Min. Cármen Lúcia" },
        { orgao: "Primeira Turma", ramo: "DIREITO TRIBUTÁRIO", tema: "Imunidade tributária de entidades religiosas", destaque: "A imunidade tributária das entidades religiosas abrange não apenas os templos, mas também os imóveis de sua propriedade utilizados em atividades essenciais.", processo: "RE 1476734", relator: "Min. Luís Roberto Barroso" },
        { orgao: "Segunda Turma", ramo: "DIREITO AMBIENTAL", tema: "Responsabilidade civil ambiental objetiva", destaque: "A responsabilidade civil por danos ambientais é objetiva e solidária, independendo da comprovação de culpa do poluidor.", processo: "RE 1397997", relator: "Min. André Mendonça" },
      ]},
      { num: 1203, data: "2026-02-14", notas: [
        { orgao: "Plenário", ramo: "DIREITO CONSTITUCIONAL", tema: "Sigilo bancário e compartilhamento com fiscalização", destaque: "É constitucional o compartilhamento de dados bancários com órgãos de fiscalização tributária sem prévia autorização judicial.", processo: "RE 601314", relator: "Min. Edson Fachin" },
        { orgao: "Primeira Turma", ramo: "DIREITO CIVIL", tema: "Direito ao esquecimento na era digital", destaque: "O direito ao esquecimento não é absoluto e deve ser ponderado com a liberdade de imprensa e o interesse público na divulgação da informação.", processo: "RE 1010606", relator: "Min. Dias Toffoli" },
      ]},
      { num: 1202, data: "2026-02-07", notas: [
        { orgao: "Plenário", ramo: "DIREITO PREVIDENCIÁRIO", tema: "Revisão da vida toda na aposentadoria", destaque: "É constitucional a opção pelo segurado de considerar todas as contribuições previdenciárias para o cálculo do benefício mais vantajoso.", processo: "RE 1276977", relator: "Min. Alexandre de Moraes" },
        { orgao: "Segunda Turma", ramo: "DIREITO PENAL", tema: "Crime de estelionato e representação da vítima", destaque: "O crime de estelionato, na modalidade do §5º do art. 171 do CP, exige representação da vítima como condição de procedibilidade.", processo: "HC 229654", relator: "Min. Gilmar Mendes" },
        { orgao: "Primeira Turma", ramo: "DIREITO PROCESSUAL CIVIL", tema: "Honorários contra a Fazenda Pública", destaque: "Os honorários advocatícios nas causas em que a Fazenda Pública for vencida devem seguir os critérios do art. 85, §3º, do CPC.", processo: "RE 1489742", relator: "Min. Luiz Fux" },
      ]},
      { num: 1201, data: "2026-01-31", notas: [
        { orgao: "Plenário", ramo: "DIREITO CONSTITUCIONAL", tema: "Liberdade de expressão e discurso de ódio", destaque: "A liberdade de expressão não protege manifestações que incitem a violência ou propaguem discurso de ódio contra grupos vulneráveis.", processo: "ADPF 572", relator: "Min. Alexandre de Moraes" },
        { orgao: "Plenário", ramo: "DIREITO ADMINISTRATIVO", tema: "Nepotismo e cargos em comissão", destaque: "A vedação ao nepotismo aplica-se a todos os Poderes da República, sendo dispensada a edição de lei formal para coibir a prática.", processo: "RE 579951", relator: "Min. Ricardo Lewandowski" },
      ]},
      { num: 1200, data: "2026-01-24", notas: [
        { orgao: "Plenário", ramo: "DIREITO ELEITORAL", tema: "Fidelidade partidária e perda de mandato", destaque: "O parlamentar que se desfiliar do partido pelo qual foi eleito perde o mandato, salvo em caso de justa causa reconhecida.", processo: "ADI 5398", relator: "Min. Luís Roberto Barroso" },
        { orgao: "Segunda Turma", ramo: "DIREITO CIVIL", tema: "Usucapião extraordinária e posse ad usucapionem", destaque: "A posse com ânimo de dono exercida de forma mansa e pacífica por mais de 15 anos confere o direito à usucapião extraordinária.", processo: "RE 1501234", relator: "Min. Nunes Marques" },
        { orgao: "Primeira Turma", ramo: "DIREITO DO CONSUMIDOR", tema: "Responsabilidade objetiva do fornecedor", destaque: "O fornecedor responde objetivamente pelos danos causados ao consumidor por defeitos relativos à prestação dos serviços.", processo: "RE 1487321", relator: "Min. Cármen Lúcia" },
      ]},
    ];

    const stjData = [
      { num: 881, data: "2026-03-17", notas: [
        { orgao: "Terceira Turma", ramo: "DIREITO CIVIL", tema: "Responsabilidade civil do condomínio por furto em garagem", destaque: "O condomínio edilício responde pelos danos decorrentes de furto de veículo em garagem coberta quando assume, expressa ou tacitamente, o dever de guarda.", processo: "REsp 2156789", relator: "Min. Nancy Andrighi" },
        { orgao: "Quarta Turma", ramo: "DIREITO DO CONSUMIDOR", tema: "Cobrança indevida e repetição em dobro", destaque: "A repetição em dobro prevista no art. 42 do CDC independe da natureza do elemento volitivo do fornecedor, bastando a cobrança indevida.", processo: "EREsp 1413542", relator: "Min. Luis Felipe Salomão" },
        { orgao: "Quinta Turma", ramo: "DIREITO PENAL", tema: "Furto privilegiado e reincidência", destaque: "A reincidência não impede o reconhecimento do furto privilegiado, que constitui direito subjetivo do réu quando preenchidos os requisitos legais.", processo: "HC 799123", relator: "Min. Ribeiro Dantas" },
        { orgao: "Primeira Turma", ramo: "DIREITO TRIBUTÁRIO", tema: "Contribuição previdenciária sobre terço de férias", destaque: "Não incide contribuição previdenciária patronal sobre o terço constitucional de férias gozadas.", processo: "REsp 1956789", relator: "Min. Regina Helena Costa" },
        { orgao: "Segunda Seção", ramo: "DIREITO PROCESSUAL CIVIL", tema: "Competência para ações contra planos de saúde", destaque: "A competência para processar e julgar ação contra plano de saúde é do foro do domicílio do beneficiário.", processo: "CC 198765", relator: "Min. Marco Buzzi" },
      ]},
      { num: 880, data: "2026-03-10", notas: [
        { orgao: "Corte Especial", ramo: "DIREITO PROCESSUAL CIVIL", tema: "Tempestividade de recurso e feriado local", destaque: "Cabe à parte recorrente comprovar a ocorrência de feriado local no ato da interposição do recurso, sob pena de intempestividade.", processo: "EREsp 1643652", relator: "Min. Og Fernandes" },
        { orgao: "Terceira Turma", ramo: "DIREITO EMPRESARIAL", tema: "Desconsideração da personalidade jurídica", destaque: "A desconsideração da personalidade jurídica exige a demonstração de abuso, caracterizado pelo desvio de finalidade ou confusão patrimonial.", processo: "REsp 2098765", relator: "Min. Marco Aurélio Bellizze" },
        { orgao: "Sexta Turma", ramo: "DIREITO PENAL", tema: "Tráfico privilegiado e hediondez", destaque: "O tráfico privilegiado (art. 33, §4º, da Lei 11.343/06) não é equiparado a crime hediondo.", processo: "HC 812345", relator: "Min. Rogerio Schietti Cruz" },
        { orgao: "Primeira Seção", ramo: "DIREITO ADMINISTRATIVO", tema: "Servidor público e acumulação de cargos", destaque: "A acumulação de cargos públicos é lícita quando a soma das cargas horárias não ultrapassar 60 horas semanais e houver compatibilidade de horários.", processo: "REsp 1881234", relator: "Min. Benedito Gonçalves" },
      ]},
      { num: 879, data: "2026-03-03", notas: [
        { orgao: "Quarta Turma", ramo: "DIREITO CIVIL", tema: "Usucapião de bem público", destaque: "Não é possível a usucapião de bens públicos, conforme vedação expressa nos arts. 183, §3º, e 191, parágrafo único, da CF.", processo: "REsp 2134567", relator: "Min. Antonio Carlos Ferreira" },
        { orgao: "Terceira Turma", ramo: "DIREITO DO CONSUMIDOR", tema: "Recall e responsabilidade do fabricante", destaque: "A não realização de recall pelo consumidor não exime o fabricante da responsabilidade por defeito de segurança do produto.", processo: "REsp 2087654", relator: "Min. Nancy Andrighi" },
        { orgao: "Quinta Turma", ramo: "DIREITO PROCESSUAL PENAL", tema: "Acordo de não persecução penal retroativo", destaque: "O ANPP aplica-se retroativamente aos processos em curso por ser norma penal mais benéfica ao réu.", processo: "HC 798456", relator: "Min. Joel Ilan Paciornik" },
      ]},
      { num: 878, data: "2026-02-24", notas: [
        { orgao: "Segunda Turma", ramo: "DIREITO TRIBUTÁRIO", tema: "ISS sobre planos de saúde", destaque: "Incide ISS sobre as atividades de planos de saúde, por configurarem prestação de serviço prevista na lista anexa à LC 116/03.", processo: "REsp 2054321", relator: "Min. Herman Benjamin" },
        { orgao: "Primeira Turma", ramo: "DIREITO ADMINISTRATIVO", tema: "Prazo prescricional em ação de improbidade", destaque: "O prazo prescricional nas ações de improbidade administrativa é de 8 anos, contados da ocorrência do fato, conforme alteração da Lei 14.230/21.", processo: "REsp 2076543", relator: "Min. Regina Helena Costa" },
        { orgao: "Sexta Turma", ramo: "DIREITO PENAL", tema: "Regime inicial de cumprimento de pena", destaque: "É possível a fixação de regime aberto ou semiaberto para condenações de até 8 anos, desde que as circunstâncias judiciais sejam favoráveis.", processo: "HC 805432", relator: "Min. Laurita Vaz" },
        { orgao: "Quarta Turma", ramo: "DIREITO CIVIL", tema: "Cláusula penal e limitação em contratos de adesão", destaque: "A cláusula penal compensatória pode ser fixada em até 10% do valor do contrato em contratos de adesão.", processo: "REsp 2045678", relator: "Min. Luis Felipe Salomão" },
      ]},
      { num: 877, data: "2026-02-17", notas: [
        { orgao: "Terceira Turma", ramo: "DIREITO CIVIL", tema: "Alimentos avoengos e responsabilidade subsidiária", destaque: "A obrigação alimentar dos avós tem caráter subsidiário e complementar, exigindo comprovação da impossibilidade de cumprimento pelo genitor.", processo: "REsp 2034567", relator: "Min. Marco Aurélio Bellizze" },
        { orgao: "Corte Especial", ramo: "DIREITO PROCESSUAL CIVIL", tema: "Embargos de divergência e demonstração analítica", destaque: "A admissão dos embargos de divergência exige a demonstração analítica do dissídio jurisprudencial entre turmas ou seções do STJ.", processo: "EREsp 1987654", relator: "Min. Og Fernandes" },
        { orgao: "Quinta Turma", ramo: "DIREITO PENAL", tema: "Princípio da insignificância e reincidência", destaque: "A reincidência, por si só, não impede a aplicação do princípio da insignificância, devendo ser analisadas as circunstâncias do caso concreto.", processo: "AgRg no AREsp 2345678", relator: "Min. Ribeiro Dantas" },
      ]},
      { num: 876, data: "2026-02-10", notas: [
        { orgao: "Segunda Seção", ramo: "DIREITO CIVIL", tema: "Responsabilidade de instituições financeiras por fraudes", destaque: "As instituições financeiras respondem objetivamente pelos danos causados por fraudes praticadas por terceiros em operações bancárias.", processo: "REsp 2023456", relator: "Min. Nancy Andrighi" },
        { orgao: "Primeira Seção", ramo: "DIREITO TRIBUTÁRIO", tema: "Base de cálculo do ITBI e valor venal", destaque: "A base de cálculo do ITBI não está vinculada ao valor venal do IPTU, podendo ser arbitrada pelo município com base no valor de mercado.", processo: "REsp 1937821", relator: "Min. Gurgel de Faria" },
        { orgao: "Sexta Turma", ramo: "DIREITO PROCESSUAL PENAL", tema: "Nulidade por ausência de defesa técnica efetiva", destaque: "A defesa meramente formal, sem manifestação substancial, configura ausência de defesa técnica e gera nulidade absoluta do processo.", processo: "HC 795432", relator: "Min. Rogerio Schietti Cruz" },
      ]},
      { num: 875, data: "2026-02-03", notas: [
        { orgao: "Quarta Turma", ramo: "DIREITO DO CONSUMIDOR", tema: "Venda casada de seguros em financiamentos", destaque: "Configura venda casada a exigência de contratação de seguro como condição para concessão de financiamento bancário.", processo: "REsp 2012345", relator: "Min. Antonio Carlos Ferreira" },
        { orgao: "Terceira Turma", ramo: "DIREITO EMPRESARIAL", tema: "Recuperação judicial e créditos trabalhistas", destaque: "Os créditos trabalhistas de valor até 150 salários mínimos têm preferência sobre os demais créditos na recuperação judicial.", processo: "REsp 2001234", relator: "Min. Marco Aurélio Bellizze" },
        { orgao: "Segunda Turma", ramo: "DIREITO ADMINISTRATIVO", tema: "Desapropriação e juros compensatórios", destaque: "Os juros compensatórios na desapropriação incidem desde a imissão na posse até o efetivo pagamento da indenização.", processo: "REsp 1987654", relator: "Min. Mauro Campbell Marques" },
        { orgao: "Primeira Turma", ramo: "DIREITO PREVIDENCIÁRIO", tema: "Auxílio-doença e carência para segurados especiais", destaque: "O segurado especial que comprova atividade rural tem direito ao auxílio-doença independentemente de carência.", processo: "REsp 1976543", relator: "Min. Benedito Gonçalves" },
      ]},
    ];

    const allData = [
      ...stfData.map(d => ({ ...d, tribunal: 'STF' })),
      ...stjData.map(d => ({ ...d, tribunal: 'STJ' })),
    ];

    const results: any[] = [];

    for (const info of allData) {
      const { data: infoData, error: infoError } = await supabase
        .from('informativos_jurisprudencia')
        .insert({
          tribunal: info.tribunal,
          numero_edicao: info.num,
          data_publicacao: info.data,
          titulo_edicao: `Informativo ${info.tribunal} nº ${info.num}`,
          tipo: 'regular',
        })
        .select('id')
        .single();

      if (infoError) {
        console.error(`Erro ${info.tribunal} ${info.num}:`, infoError);
        continue;
      }

      const notasToInsert = info.notas.map((nota: any, idx: number) => ({
        informativo_id: infoData.id,
        orgao_julgador: nota.orgao,
        ramo_direito: nota.ramo,
        tema: nota.tema,
        destaque: nota.destaque,
        processo: nota.processo,
        relator: nota.relator,
        ordem: idx + 1,
      }));

      const { error: notasError } = await supabase
        .from('informativos_notas')
        .insert(notasToInsert);

      if (notasError) {
        console.error(`Erro notas ${info.tribunal} ${info.num}:`, notasError);
      }

      results.push({ tribunal: info.tribunal, numero: info.num, notas: info.notas.length });
      console.log(`${info.tribunal} ${info.num}: ${info.notas.length} notas`);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
