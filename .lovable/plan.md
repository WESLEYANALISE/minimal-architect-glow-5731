

## Plano: Scroll-to-Top Global + Otimização de Performance Desktop

### Problema Identificado
1. **Sem scroll-to-top global**: O projeto não possui um componente `ScrollToTop` que reseta a posição de scroll ao navegar entre páginas. Cada página implementa seu próprio `scrollToTop` manualmente (35+ arquivos), mas nenhum faz isso automaticamente na navegação.
2. **Performance de carregamento**: As capas e imagens dependem de preloaders com delays altos no desktop (15s/45s), causando flashes de conteúdo vazio.

---

### Etapa 1: Componente ScrollToTop Global

Criar `src/components/ScrollToTop.tsx` que escuta mudanças de rota e faz `window.scrollTo(0, 0)` instantaneamente a cada navegação.

- Usar `useLocation()` + `useEffect` para detectar mudanças de pathname
- Scroll com `behavior: 'instant'` para não ter delay
- Montar dentro do `BrowserRouter` no `App.tsx`, antes das `Routes`

Padrão usado pelos grandes sites e recomendado pelo React Router (técnica amplamente documentada no GitHub e Stack Overflow).

---

### Etapa 2: Otimização de Performance Desktop

**2a. Reduzir delays do preloader no desktop**
- No `useAggressiveChunkPreloader.ts`, reduzir os timings desktop de 15s/45s para valores mais agressivos (8s/25s) mantendo batch size conservador para não travar rendering.

**2b. Preload de imagens com Intersection Observer**
- Criar hook `useIntersectionPreload` que usa `IntersectionObserver` com `rootMargin: '200px'` para começar a carregar imagens antes de entrarem na viewport (técnica usada por YouTube, Netflix, etc.).
- Aplicar nos cards de capas (cursos, bibliotecas, etc.) para que as imagens carreguem antes do scroll chegar nelas.

**2c. Otimizar `useTransitionNavigate` para scroll**
- Integrar o scroll-to-top dentro do `useTransitionNavigate` para garantir que mesmo com `startTransition`, o scroll reseta antes da nova página renderizar.

**2d. Prefetch de rotas no hover (desktop)**
- Adicionar `onMouseEnter` nos links/botões de navegação do desktop para disparar o `import()` do chunk da rota destino antes do clique, garantindo navegação instantânea.

---

### Etapa 3: Loading States Otimizados

- Garantir que o `ContextualSuspense` mostra skeletons imediatamente (já implementado) enquanto os chunks carregam.
- Adicionar `loading="lazy"` e `decoding="async"` nas tags `<img>` que ainda não possuem esses atributos.

---

### Arquivos Modificados
| Arquivo | Alteração |
|---|---|
| `src/components/ScrollToTop.tsx` | **Novo** — componente global de scroll-to-top |
| `src/App.tsx` | Adicionar `<ScrollToTop />` dentro do router |
| `src/hooks/useAggressiveChunkPreloader.ts` | Reduzir delays desktop |
| `src/hooks/useTransitionNavigate.ts` | Integrar scroll reset |
| `src/hooks/usePrefetchRoute.ts` | **Novo** — prefetch no hover |

### Referências Técnicas
- React Router `ScrollRestoration` / `ScrollToTop` pattern (documentação oficial)
- `IntersectionObserver` com `rootMargin` para lazy loading antecipado (padrão YouTube/Netflix)
- `modulepreload` / dynamic `import()` no hover (padrão usado pelo Astro, Nuxt, Qwik)

