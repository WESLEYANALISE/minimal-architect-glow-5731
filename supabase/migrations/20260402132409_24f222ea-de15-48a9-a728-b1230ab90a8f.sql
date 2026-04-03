
-- Limpar dados existentes do Decreto 1171
DELETE FROM "DECRETO 1171 - ETICA SERVIDOR";

-- Inserir artigos principais
INSERT INTO "DECRETO 1171 - ETICA SERVIDOR" ("Número do Artigo", "Artigo", "ordem_artigo", "ultima_atualizacao") VALUES
('Art. 1º', 'Fica aprovado o Código de Ética Profissional do Servidor Público Civil do Poder Executivo Federal, que com este baixa.', 1, now()),
('Art. 2º', 'Os órgãos e entidades da Administração Pública Federal direta e indireta implementarão, em sessenta dias, as providências necessárias à plena vigência do Código de Ética, inclusive mediante a Constituição da respectiva Comissão de Ética, integrada por três servidores ou empregados titulares de cargo efetivo ou emprego permanente.', 2, now()),
('Art. 2º, Parágrafo único', 'A constituição da Comissão de Ética será comunicada à Secretaria da Administração Federal da Presidência da República, com a indicação dos respectivos membros titulares e suplentes.', 3, now()),
('Art. 3º', 'Este decreto entra em vigor na data de sua publicação.', 4, now()),

-- ANEXO - Capítulo I - Seção I - Das Regras Deontológicas
('I', 'A dignidade, o decoro, o zelo, a eficácia e a consciência dos princípios morais são primados maiores que devem nortear o servidor público, seja no exercício do cargo ou função, ou fora dele, já que refletirá o exercício da vocação do próprio poder estatal. Seus atos, comportamentos e atitudes serão direcionados para a preservação da honra e da tradição dos serviços públicos.', 10, now()),
('II', 'O servidor público não poderá jamais desprezar o elemento ético de sua conduta. Assim, não terá que decidir somente entre o legal e o ilegal, o justo e o injusto, o conveniente e o inconveniente, o oportuno e o inoportuno, mas principalmente entre o honesto e o desonesto, consoante as regras contidas no art. 37, caput, e § 4°, da Constituição Federal.', 11, now()),
('III', 'A moralidade da Administração Pública não se limita à distinção entre o bem e o mal, devendo ser acrescida da idéia de que o fim é sempre o bem comum. O equilíbrio entre a legalidade e a finalidade, na conduta do servidor público, é que poderá consolidar a moralidade do ato administrativo.', 12, now()),
('IV', 'A remuneração do servidor público é custeada pelos tributos pagos direta ou indiretamente por todos, até por ele próprio, e por isso se exige, como contrapartida, que a moralidade administrativa se integre no Direito, como elemento indissociável de sua aplicação e de sua finalidade, erigindo-se, como conseqüência, em fator de legalidade.', 13, now()),
('V', 'O trabalho desenvolvido pelo servidor público perante a comunidade deve ser entendido como acréscimo ao seu próprio bem-estar, já que, como cidadão, integrante da sociedade, o êxito desse trabalho pode ser considerado como seu maior patrimônio.', 14, now()),
('VI', 'A função pública deve ser tida como exercício profissional e, portanto, se integra na vida particular de cada servidor público. Assim, os fatos e atos verificados na conduta do dia-a-dia em sua vida privada poderão acrescer ou diminuir o seu bom conceito na vida funcional.', 15, now()),
('VII', 'Salvo os casos de segurança nacional, investigações policiais ou interesse superior do Estado e da Administração Pública, a serem preservados em processo previamente declarado sigiloso, nos termos da lei, a publicidade de qualquer ato administrativo constitui requisito de eficácia e moralidade, ensejando sua omissão comprometimento ético contra o bem comum, imputável a quem a negar.', 16, now()),
('VIII', 'Toda pessoa tem direito à verdade. O servidor não pode omiti-la ou falseá-la, ainda que contrária aos interesses da própria pessoa interessada ou da Administração Pública. Nenhum Estado pode crescer ou estabilizar-se sobre o poder corruptivo do hábito do erro, da opressão ou da mentira, que sempre aniquilam até mesmo a dignidade humana quanto mais a de uma Nação.', 17, now()),
('IX', 'A cortesia, a boa vontade, o cuidado e o tempo dedicados ao serviço público caracterizam o esforço pela disciplina. Tratar mal uma pessoa que paga seus tributos direta ou indiretamente significa causar-lhe dano moral. Da mesma forma, causar dano a qualquer bem pertencente ao patrimônio público, deteriorando-o, por descuido ou má vontade, não constitui apenas uma ofensa ao equipamento e às instalações ou ao Estado, mas a todos os homens de boa vontade que dedicaram sua inteligência, seu tempo, suas esperanças e seus esforços para construí-los.', 18, now()),
('X', 'Deixar o servidor público qualquer pessoa à espera de solução que compete ao setor em que exerça suas funções, permitindo a formação de longas filas, ou qualquer outra espécie de atraso na prestação do serviço, não caracteriza apenas atitude contra a ética ou ato de desumanidade, mas principalmente grave dano moral aos usuários dos serviços públicos.', 19, now()),
('XI', 'O servidor deve prestar toda a sua atenção às ordens legais de seus superiores, velando atentamente por seu cumprimento, e, assim, evitando a conduta negligente. Os repetidos erros, o descaso e o acúmulo de desvios tornam-se, às vezes, difíceis de corrigir e caracterizam até mesmo imprudência no desempenho da função pública.', 20, now()),
('XII', 'Toda ausência injustificada do servidor de seu local de trabalho é fator de desmoralização do serviço público, o que quase sempre conduz à desordem nas relações humanas.', 21, now()),
('XIII', 'O servidor que trabalha em harmonia com a estrutura organizacional, respeitando seus colegas e cada concidadão, colabora e de todos pode receber colaboração, pois sua atividade pública é a grande oportunidade para o crescimento e o engrandecimento da Nação.', 22, now()),

-- Seção II - Dos Principais Deveres do Servidor Público
('XIV', 'São deveres fundamentais do servidor público:', 30, now()),
('XIV, a)', 'desempenhar, a tempo, as atribuições do cargo, função ou emprego público de que seja titular;', 31, now()),
('XIV, b)', 'exercer suas atribuições com rapidez, perfeição e rendimento, pondo fim ou procurando prioritariamente resolver situações procrastinatórias, principalmente diante de filas ou de qualquer outra espécie de atraso na prestação dos serviços pelo setor em que exerça suas atribuições, com o fim de evitar dano moral ao usuário;', 32, now()),
('XIV, c)', 'ser probo, reto, leal e justo, demonstrando toda a integridade do seu caráter, escolhendo sempre, quando estiver diante de duas opções, a melhor e a mais vantajosa para o bem comum;', 33, now()),
('XIV, d)', 'jamais retardar qualquer prestação de contas, condição essencial da gestão dos bens, direitos e serviços da coletividade a seu cargo;', 34, now()),
('XIV, e)', 'tratar cuidadosamente os usuários dos serviços aperfeiçoando o processo de comunicação e contato com o público;', 35, now()),
('XIV, f)', 'ter consciência de que seu trabalho é regido por princípios éticos que se materializam na adequada prestação dos serviços públicos;', 36, now()),
('XIV, g)', 'ser cortês, ter urbanidade, disponibilidade e atenção, respeitando a capacidade e as limitações individuais de todos os usuários do serviço público, sem qualquer espécie de preconceito ou distinção de raça, sexo, nacionalidade, cor, idade, religião, cunho político e posição social, abstendo-se, dessa forma, de causar-lhes dano moral;', 37, now()),
('XIV, h)', 'ter respeito à hierarquia, porém sem nenhum temor de representar contra qualquer comprometimento indevido da estrutura em que se funda o Poder Estatal;', 38, now()),
('XIV, i)', 'resistir a todas as pressões de superiores hierárquicos, de contratantes, interessados e outros que visem obter quaisquer favores, benesses ou vantagens indevidas em decorrência de ações imorais, ilegais ou aéticas e denunciá-las;', 39, now()),
('XIV, j)', 'zelar, no exercício do direito de greve, pelas exigências específicas da defesa da vida e da segurança coletiva;', 40, now()),
('XIV, l)', 'ser assíduo e freqüente ao serviço, na certeza de que sua ausência provoca danos ao trabalho ordenado, refletindo negativamente em todo o sistema;', 41, now()),
('XIV, m)', 'comunicar imediatamente a seus superiores todo e qualquer ato ou fato contrário ao interesse público, exigindo as providências cabíveis;', 42, now()),
('XIV, n)', 'manter limpo e em perfeita ordem o local de trabalho, seguindo os métodos mais adequados à sua organização e distribuição;', 43, now()),
('XIV, o)', 'participar dos movimentos e estudos que se relacionem com a melhoria do exercício de suas funções, tendo por escopo a realização do bem comum;', 44, now()),
('XIV, p)', 'apresentar-se ao trabalho com vestimentas adequadas ao exercício da função;', 45, now()),
('XIV, q)', 'manter-se atualizado com as instruções, as normas de serviço e a legislação pertinentes ao órgão onde exerce suas funções;', 46, now()),
('XIV, r)', 'cumprir, de acordo com as normas do serviço e as instruções superiores, as tarefas de seu cargo ou função, tanto quanto possível, com critério, segurança e rapidez, mantendo tudo sempre em boa ordem.', 47, now()),
('XIV, s)', 'facilitar a fiscalização de todos atos ou serviços por quem de direito;', 48, now()),
('XIV, t)', 'exercer com estrita moderação as prerrogativas funcionais que lhe sejam atribuídas, abstendo-se de fazê-lo contrariamente aos legítimos interesses dos usuários do serviço público e dos jurisdicionados administrativos;', 49, now()),
('XIV, u)', 'abster-se, de forma absoluta, de exercer sua função, poder ou autoridade com finalidade estranha ao interesse público, mesmo que observando as formalidades legais e não cometendo qualquer violação expressa à lei;', 50, now()),
('XIV, v)', 'divulgar e informar a todos os integrantes da sua classe sobre a existência deste Código de Ética, estimulando o seu integral cumprimento.', 51, now()),

-- Seção III - Das Vedações ao Servidor Público
('XV', 'É vedado ao servidor público:', 60, now()),
('XV, a)', 'o uso do cargo ou função, facilidades, amizades, tempo, posição e influências, para obter qualquer favorecimento, para si ou para outrem;', 61, now()),
('XV, b)', 'prejudicar deliberadamente a reputação de outros servidores ou de cidadãos que deles dependam;', 62, now()),
('XV, c)', 'ser, em função de seu espírito de solidariedade, conivente com erro ou infração a este Código de Ética ou ao Código de Ética de sua profissão;', 63, now()),
('XV, d)', 'usar de artifícios para procrastinar ou dificultar o exercício regular de direito por qualquer pessoa, causando-lhe dano moral ou material;', 64, now()),
('XV, e)', 'deixar de utilizar os avanços técnicos e científicos ao seu alcance ou do seu conhecimento para atendimento do seu mister;', 65, now()),
('XV, f)', 'permitir que perseguições, simpatias, antipatias, caprichos, paixões ou interesses de ordem pessoal interfiram no trato com o público, com os jurisdicionados administrativos ou com colegas hierarquicamente superiores ou inferiores;', 66, now()),
('XV, g)', 'pleitear, solicitar, provocar, sugerir ou receber qualquer tipo de ajuda financeira, gratificação, prêmio, comissão, doação ou vantagem de qualquer espécie, para si, familiares ou qualquer pessoa, para o cumprimento da sua missão ou para influenciar outro servidor para o mesmo fim;', 67, now()),
('XV, h)', 'alterar ou deturpar o teor de documentos que deva encaminhar para providências;', 68, now()),
('XV, i)', 'iludir ou tentar iludir qualquer pessoa que necessite do atendimento em serviços públicos;', 69, now()),
('XV, j)', 'desviar servidor público para atendimento a interesse particular;', 70, now()),
('XV, l)', 'retirar da repartição pública, sem estar legalmente autorizado, qualquer documento, livro ou bem pertencente ao patrimônio público;', 71, now()),
('XV, m)', 'fazer uso de informações privilegiadas obtidas no âmbito interno de seu serviço, em benefício próprio, de parentes, de amigos ou de terceiros;', 72, now()),
('XV, n)', 'apresentar-se embriagado no serviço ou fora dele habitualmente;', 73, now()),
('XV, o)', 'dar o seu concurso a qualquer instituição que atente contra a moral, a honestidade ou a dignidade da pessoa humana;', 74, now()),
('XV, p)', 'exercer atividade profissional aética ou ligar o seu nome a empreendimentos de cunho duvidoso.', 75, now()),

-- Capítulo II - Das Comissões de Ética
('XVI', 'Em todos os órgãos e entidades da Administração Pública Federal direta, indireta autárquica e fundacional, ou em qualquer órgão ou entidade que exerça atribuições delegadas pelo poder público, deverá ser criada uma Comissão de Ética, encarregada de orientar e aconselhar sobre a ética profissional do servidor, no tratamento com as pessoas e com o patrimônio público, competindo-lhe conhecer concretamente de imputação ou de procedimento susceptível de censura.', 80, now()),
('XVII', '(Revogado pelo Decreto nº 6.029, de 2007)', 81, now()),
('XVIII', 'À Comissão de Ética incumbe fornecer, aos organismos encarregados da execução do quadro de carreira dos servidores, os registros sobre sua conduta ética, para o efeito de instruir e fundamentar promoções e para todos os demais procedimentos próprios da carreira do servidor público.', 82, now()),
('XIX', '(Revogado pelo Decreto nº 6.029, de 2007)', 83, now()),
('XX', '(Revogado pelo Decreto nº 6.029, de 2007)', 84, now()),
('XXI', '(Revogado pelo Decreto nº 6.029, de 2007)', 85, now()),
('XXII', 'A pena aplicável ao servidor público pela Comissão de Ética é a de censura e sua fundamentação constará do respectivo parecer, assinado por todos os seus integrantes, com ciência do faltoso.', 86, now()),
('XXIII', '(Revogado pelo Decreto nº 6.029, de 2007)', 87, now()),
('XXIV', 'Para fins de apuração do comprometimento ético, entende-se por servidor público todo aquele que, por força de lei, contrato ou de qualquer ato jurídico, preste serviços de natureza permanente, temporária ou excepcional, ainda que sem retribuição financeira, desde que ligado direta ou indiretamente a qualquer órgão do poder estatal, como as autarquias, as fundações públicas, as entidades paraestatais, as empresas públicas e as sociedades de economia mista, ou em qualquer setor onde prevaleça o interesse do Estado.', 88, now()),
('XXV', '(Revogado pelo Decreto nº 6.029, de 2007)', 89, now());
