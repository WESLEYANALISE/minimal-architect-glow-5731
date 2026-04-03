
-- Swap dates: move dia 21 to temp, move dia 22 to 21, move temp to 22
UPDATE dicas_do_dia SET data = '2026-02-28' WHERE id = 22 AND data = '2026-02-21';
UPDATE dicas_do_dia SET data = '2026-02-21' WHERE id = 25 AND data = '2026-02-22';
UPDATE dicas_do_dia SET data = '2026-02-22' WHERE id = 22 AND data = '2026-02-28';

-- Rewrite porque_ler for Manual de Psicologia Positiva (id=25)
UPDATE dicas_do_dia SET porque_ler = 'Ei, para um segundo e pensa comigo: quantas vezes você já se sentiu esgotado com a rotina de estudos, aquela pressão das provas, dos prazos, da concorrência? Pois é, burnout no Direito é mais comum do que parece — e ignorar isso cobra caro.

Esse livro é tipo aquele papo reto de um amigo que já passou por isso e te mostra como virar o jogo. Não é autoajuda genérica, é ciência aplicada ao seu dia a dia.

✅ Aprenda a lidar com o estresse sem perder o foco nos estudos
✅ Desenvolva resiliência pra aguentar a maratona da carreira jurídica
✅ Melhore sua concentração e produtividade com técnicas comprovadas
✅ Construa relações mais saudáveis — com colegas, clientes e consigo mesmo
✅ Cultive uma mentalidade positiva que te diferencia na advocacia

A real é essa: o melhor advogado não é só o que sabe mais leis, é o que consegue manter a mente afiada e saudável no longo prazo. Esse livro te dá as ferramentas pra isso.' WHERE id = 25;
