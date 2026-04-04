
Objetivo

Garantir que, no mobile, toda função abra com a mesma sensação de slide da direita para a esquerda e que o usuário não veja loaders/skeletons à toa no primeiro toque.

Diagnóstico

1. A animação global de rota já existe (`PageTransition` + `page-enter`), então o problema principal não é o efeito visual em si.
2. Na home mobile, várias “abas” não são rotas; são painéis dentro de `Index.tsx`, então elas não herdam automaticamente a abertura global.
3. A home mobile está montando painéis pesados mesmo quando estão escondidos (`BibliotecaHomeSection`, `JuriflixHomeSection`, `LegislacaoHomeSection` etc.). Isso dispara queries cedo demais e piora o primeiro clique.
4. O prefetch atual está mais preparado para hover/desktop. No mobile, quase nenhum card prefetcha no toque.
5. Há rotas importantes com prefetch incompleto ou incorreto, incluindo `/audioaulas`.
6. O `ContextualSuspense` mostra fallback imediatamente; quando o chunk demora pouco, o usuário vê loading em vez de perceber a abertura instantânea.
7. Algumas páginas de entrada ainda bloqueiam com spinner/local loading no primeiro mount, como `AudioaulasCategoriaPage`, `JuriFlix`, `Bibliotecas` e partes do `VadeMecumTodas`.

Plano de implementação

1. Aliviar a home mobile
- Em `src/pages/Index.tsx`, parar de montar todas as abas escondidas ao mesmo tempo.
- Adotar “mount on first open + keep mounted” para as abas móveis principais.
- Aplicar um wrapper leve de slide da direita para a esquerda nas trocas internas de aba da home.

2. Fazer prefetch funcionar no mobile de verdade
- Ajustar `useRoutePrefetch` / `usePrefetchRoute` para responder também a `onTouchStart`, `onPointerDown` e `onFocus`, não só hover.
- Corrigir e ampliar os mapas para as rotas reais mais usadas no mobile:
  `/aulas`, `/bibliotecas`, `/videoaulas`, `/audioaulas`, `/vade-mecum`, `/juriflix`, `/blogger-juridico/artigos`, `/ferramentas/simulados`, `/resumos-juridicos`, `/flashcards/areas`.
- Corrigir o caso de `/audioaulas`, que hoje está pré-carregando o chunk errado.
- Trazer a fase crítica do preloader para mais cedo no mobile, porque o atraso atual é grande para o primeiro toque.

3. Reduzir flashes de loading
- Em `src/components/ContextualSuspense.tsx`, trocar o fallback imediato por fallback com pequeno atraso.
- Assim, quando o chunk resolver rápido, o usuário vai direto para a tela animada em vez de ver skeleton.
- Manter fallback apenas para casos realmente lentos.

4. Tirar os gargalos das páginas mais abertas
- `AudioaulasCategoriaPage`: usar cache-first/placeholder e aquecer a lista de áreas antes do clique.
- `JuriFlix`: evitar tela bloqueada quando já houver cache local.
- `Bibliotecas` e `BibliotecaHomeSection`: aquecer previews/contagens antes da abertura.
- `VadeMecumTodas`: pré-carregar dados principais da tela e deixar tarefas secundárias para idle.
- Onde a navegação mobile principal ainda usa `useNavigate` simples, padronizar para navegação com transição.

5. Melhorar a sensação de instantaneidade nas capas
- Priorizar apenas imagens acima da dobra com `eager`/`fetchPriority="high"`.
- Manter `lazy` no restante.
- Focar nas capas visíveis logo na entrada: estudos, portal de vídeos e atalhos principais.

6. Fazer um sweep nas superfícies mobile de entrada
- Home: `HomePratiqueSlide`, `PortalDeVideosSection`, `HomeAtalhosSection`, `MobileLeisHome`, `EstudosViewCarousel`, `Index.tsx`
- Hubs/páginas principais: `TelaHub`, `AulasPage`, `AudioaulasCategoriaPage`, `VadeMecumTodas`, `Bibliotecas`, `JuriFlix`, `BloggerJuridico`

Arquivos principais

- `src/pages/Index.tsx`
- `src/components/ContextualSuspense.tsx`
- `src/hooks/useRoutePrefetch.ts`
- `src/hooks/usePrefetchRoute.ts`
- `src/hooks/useAggressiveChunkPreloader.ts`
- `src/components/home/HomePratiqueSlide.tsx`
- `src/components/home/PortalDeVideosSection.tsx`
- `src/components/home/HomeAtalhosSection.tsx`
- `src/components/home/EstudosViewCarousel.tsx`
- `src/components/mobile/MobileLeisHome.tsx`
- `src/pages/TelaHub.tsx`
- `src/pages/AulasPage.tsx`
- `src/pages/AudioaulasCategoriaPage.tsx`
- `src/pages/VadeMecumTodas.tsx`
- `src/pages/Bibliotecas.tsx`
- `src/pages/JuriFlix.tsx`
- `src/pages/BloggerJuridico.tsx`

Resultado esperado

- Todas as funções mobile abrindo com o mesmo slide da direita para a esquerda.
- Menos telas de “Carregando...”.
- Primeiro toque mais rápido, principalmente em Biblioteca, Legislação, JuriFlix, Videoaulas e Audioaulas.
- Experiência mais nativa e consistente no mobile.
