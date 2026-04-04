

## Plano: Carregamento Agressivo de Todas as Imagens

### Problema
Existem **delays empilhados** em 4 arquivos que atrasam o download das imagens em 2-10 segundos:

| Local | Delay atual | Problema |
|-------|------------|----------|
| `criticalPreload.ts` | `requestIdleCallback` + 150ms entre cada | Deferred images esperam idle + ~2.5s total |
| `useHomePreloader.ts` | 2s wait + `requestIdleCallback(timeout: 8s)` + limite de 15 imagens | Dados do Supabase demoram 4-10s pra começar |
| `EmAltaCarousel.tsx` | `requestIdleCallback` + 80ms entre cada | Atalhos esperam idle |
| `Index.tsx` | `requestIdleCallback(timeout: 8s)` | Atalhos e carreiras esperam até 8s |

### Mudancas

**1. `src/lib/criticalPreload.ts`**
- Deferred images: remover `requestIdleCallback`, usar `setTimeout(fn, 50)` direto
- Intervalo entre imagens: 150ms → 30ms (carrega todas em ~450ms)

**2. `src/hooks/useHomePreloader.ts`**
- Delay inicial: 2000ms → 300ms
- Remover `requestIdleCallback` wrapper, usar `setTimeout` direto
- Limite de imagens preloaded: 15 → 50 (carregar todas)
- Batches executam em paralelo (Promise.all de todos ao mesmo tempo)

**3. `src/components/EmAltaCarousel.tsx`**
- Remover `requestIdleCallback`, preload imediato no import
- Intervalo entre imagens: 80ms → 0ms (carregar todas de uma vez)

**4. `src/pages/Index.tsx`**
- Remover `requestIdleCallback(timeout: 8s)` 
- Usar `setTimeout(fn, 200)` para preload quase imediato

**5. `src/hooks/useProgressiveImagePreloader.ts`**
- Remover `requestIdleCallback` wrapper
- Intervalo entre imagens: 20ms → 0ms

### Impacto esperado
- Imagens de atalhos: aparecem **~5-8s mais cedo**
- Capas do Supabase: aparecem **~3-5s mais cedo**
- Todas as imagens da home carregam nos primeiros 2-3s apos mount

