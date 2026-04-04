
Objetivo: eliminar o “pisca” preto e a barra no topo que aparecem depois que as questões já começaram.

Diagnóstico do que está acontecendo:
1. O fluxo ainda sai da tela inline e navega para a rota `/ferramentas/questoes/resolver`.
2. Essa rota está envolvida por `ContextualSuspense` em `src/routes/estudosRoutes.tsx`, então qualquer atraso de chunk/render pode acionar o fallback visual.
3. Dentro de `src/pages/ferramentas/QuestoesResolver.tsx`, a tela inteira é trocada para loading quando `isGenerating` fica `true`:
   - hoje o código faz `if (isLoading || isGenerating) return ...loading fullscreen`
   - então acontece exatamente este ciclo:
     - questões aparecem com cache
     - o efeito detecta subtemas faltando
     - chama `generateQuestoes()`
     - `isGenerating` vira `true`
     - o componente troca tudo por tela preta + barra
     - quando termina, volta a mostrar as questões
4. Há ainda um problema estrutural em `src/pages/ferramentas/QuestoesHubNovo.tsx`: um `motion.button` contém outro `button` (favorito), confirmado pelo warning `validateDOMNesting`. Isso não é a causa principal da tela preta, mas precisa ser corrigido.

Plano de correção:
1. Ajustar `QuestoesResolver.tsx` para nunca esconder o quiz se já existir questão carregada.
   - loading fullscreen só deve aparecer quando `isLoading && questoes.length === 0`
   - geração em background deve virar apenas um indicador discreto no header/topo, sem substituir a tela inteira
2. Separar “carregamento inicial” de “geração complementar”.
   - manter as questões renderizadas
   - mostrar progresso de geração como banner/strip pequeno no topo ou abaixo do header
   - evitar retorno condicional global com `isGenerating`
3. Revisar o fluxo de entrada vindo de `QuestoesHubNovo.tsx`.
   - confirmar se ainda vale navegar para `/ferramentas/questoes/resolver` ou se o resolver deve ser incorporado inline na própria V2
   - como o problema persistente envolve fallback de rota, a solução ideal é usar o resolvedor inline no hub V2 para eliminar Suspense de rota nesse passo
4. Corrigir o warning de nested button em `TemasInline`.
   - trocar o coração interno por elemento não-`button` com acessibilidade adequada, ou transformar o card externo em `div`/`motion.div` com ação clicável
5. Validar o comportamento no mobile:
   - tocar em tema
   - questões aparecem uma única vez
   - sem tela preta
   - sem barra de carregamento de página
   - se houver geração complementar, ela aparece só como estado secundário e não interrompe a leitura

Arquivos mais prováveis de ajuste:
- `src/pages/ferramentas/QuestoesResolver.tsx`
- `src/pages/ferramentas/QuestoesHubNovo.tsx`
- possivelmente `src/routes/estudosRoutes.tsx` se o resolver deixar de depender da rota separada

Detalhes técnicos:
- Causa principal: “full-screen loading swap during background generation”
- Causa secundária: “route-level suspense fallback after navigation”
- Sintoma visual: conteúdo monta, desmonta para loading, depois remonta
- Nome do problema: flicker de navegação + loading takeover do estado de geração
