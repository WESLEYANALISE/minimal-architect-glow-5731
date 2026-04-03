
-- Criar bucket para imagens das recomendações
INSERT INTO storage.buckets (id, name, public)
VALUES ('dicas-imagens', 'dicas-imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública
CREATE POLICY "Imagens de dicas são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'dicas-imagens');

-- Política de upload via service role (edge functions)
CREATE POLICY "Service role pode fazer upload de imagens de dicas"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dicas-imagens');

-- Atualizar conteúdo do livro id=22 com texto rico e placeholders de imagem
UPDATE public.dicas_do_dia
SET porque_ler = '# 🏛️ O Caso dos Exploradores de Cavernas

## Um dos maiores dilemas morais da história do Direito

Imagine cinco exploradores presos no interior de uma caverna após um desabamento. Sem comida, sem esperança de resgate imediato, e com a certeza de que morreriam de fome antes que os socorristas conseguissem abrir passagem. Diante dessa situação extrema, eles tomam uma decisão que mudaria para sempre a forma como pensamos sobre justiça, lei e moralidade.

![Cena dramática de exploradores presos em uma caverna escura](PLACEHOLDER_IMAGEM_1)

## 📖 O Cenário do Caso

A obra de **Lon L. Fuller**, publicada originalmente em 1949, apresenta um caso fictício que se tornou **leitura obrigatória** em faculdades de Direito no mundo inteiro. Cinco membros da Sociedade Espeleológica ficaram presos em uma caverna após um deslizamento de terra. Depois de 20 dias sem alimento, e sabendo pelo rádio que o resgate demoraria mais 10 dias, os exploradores tomaram uma decisão desesperada: **sacrificar um dos membros do grupo para que os outros pudessem sobreviver**.

Roger Whetmore, que ironicamente havia sido o primeiro a sugerir a ideia do sorteio, retirou-se do acordo antes da execução — mas o sorteio foi feito mesmo assim, e ele foi o escolhido. Os quatro sobreviventes foram resgatados e, posteriormente, **acusados de homicídio**.

## ⚖️ O Julgamento: Cinco Vozes, Cinco Visões do Direito

O brilhantismo da obra está no julgamento fictício, onde **cinco juízes da Suprema Corte de Newgarth** apresentam opiniões radicalmente diferentes sobre o mesmo caso:

![Tribunal com juízes debatendo o caso dos exploradores](PLACEHOLDER_IMAGEM_2)

### 🔴 Juiz Truepenny — O Positivista Pragmático
Reconhece que a lei é clara: matar é crime. Mas sugere que o Poder Executivo conceda clemência aos réus. Para ele, a **letra da lei deve ser respeitada**, mesmo quando o resultado parece injusto.

### 🟢 Juiz Foster — O Jusnaturalista
Defende a absolvição com dois argumentos poderosos: primeiro, que os exploradores estavam em um **"estado de natureza"**, fora do alcance da civilização e suas leis; segundo, que o propósito da lei é desencorajar o homicídio, e nenhuma pena poderia ter dissuadido homens famintos à beira da morte.

### 🔵 Juiz Tatting — O Angustiado
Não consegue decidir. Reconhece mérito em ambos os lados e, tomado pela angústia moral, **se abstém de votar**. Representa o jurista honesto que admite os limites da razão jurídica.

### 🟡 Juiz Keen — O Formalista Rigoroso
Vota pela **condenação**. Para ele, o papel do juiz é aplicar a lei como ela é, não como gostaríamos que fosse. Misturar moral e direito seria destruir a segurança jurídica.

### 🟣 Juiz Handy — O Realista Popular
Vota pela **absolvição**, baseando-se no senso comum e na opinião pública. Argumenta que 90% da população queria a absolvição, e que o Direito deve servir ao povo, não a abstrações teóricas.

**Resultado: empate 2×2** (com uma abstenção), e a condenação à morte é mantida.

## 🎯 Por que isso importa para VOCÊ?

![Balança da justiça entre a lei escrita e a moralidade](PLACEHOLDER_IMAGEM_3)

Este livro não é apenas uma história fascinante — ele é uma **ferramenta essencial** para desenvolver seu pensamento jurídico:

✅ **Pensamento crítico**: Aprenda a analisar um mesmo problema sob múltiplas perspectivas filosóficas

✅ **Provas e concursos**: Este caso aparece frequentemente em questões de Filosofia do Direito, Introdução ao Direito e até em provas da OAB

✅ **Argumentação jurídica**: Observe como cada juiz constrói seu argumento — técnica valiosa para peças processuais e sustentações orais

✅ **Debate ético**: Desenvolva a habilidade de debater dilemas morais com fundamentação teórica sólida

✅ **Repertório cultural**: Demonstre conhecimento em conversas acadêmicas e profissionais

## 🌟 Conclusão

*"O Caso dos Exploradores de Cavernas"* é mais do que um exercício acadêmico — é um **convite para questionar suas próprias convicções** sobre o que é justo, o que é legal, e se essas duas coisas sempre caminham juntas. Em menos de 80 páginas, Fuller consegue apresentar os principais debates da filosofia jurídica de uma forma acessível, envolvente e inesquecível.

**Se você só pudesse ler um livro de Direito na vida, este deveria ser ele.** 📚'
WHERE id = 22;
