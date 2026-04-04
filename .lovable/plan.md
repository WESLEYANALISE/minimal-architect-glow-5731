

## Plano: Melhorar Reação ao Toque em Todo o App

### Diagnóstico

Três problemas principais causam lentidão ao tocar:

| Problema | Impacto |
|----------|---------|
| **`usePrefetchRoute` existe mas NUNCA é usado** — nenhum componente chama o hook | Chunks só carregam quando o usuário já clicou, causando delay de 200-800ms |
| **Preloader muito lento** — Fase 1 espera 8-12s, Fase 2 espera 20-35s | Se tocar antes disso, chunk não está pronto |
| **Sem feedback visual imediato no toque** — maioria dos cards não tem `active:scale` | Usuário não sente que o toque foi registrado |

### Solução em 4 frentes

**1. Prefetch no toque (`onTouchStart`) — os maiores ganhos**

Adicionar `onTouchStart` nos principais componentes de navegação para iniciar o download do chunk **no momento do toque**, antes do `onClick` disparar (~100-200ms antes):

- `HomeAtalhosSection.tsx` — atalhos da home
- `EstudosViewCarousel.tsx` — cards de estudos
- `LegislacaoHomeSection.tsx` — cards de legislação
- `BibliotecaHomeSection.tsx` — cards da biblioteca
- `PortalDeVideosSection.tsx` — cards de vídeos
- `BottomNav.tsx` — barra inferior
- `Ferramentas.tsx` — lista de ferramentas
- `QuestoesMenuRealeza.tsx` — menu de questões
- `FlashcardsMenuPrincipal.tsx` — menu de flashcards

Técnica: importar `usePrefetchRoute` e adicionar `onTouchStart={() => onTouchStart(rota)}` em cada botão/card de navegação.

**2. Preloader mais agressivo**

Reduzir delays no `useAggressiveChunkPreloader.ts`:
- Fase 1 (4 rotas críticas): **8s → 2s** mobile, **12s → 4s** desktop
- Fase 2 (rotas populares): **20s → 6s** mobile, **35s → 12s** desktop
- Batch size: **1 → 2** para carregar mais rápido
- Batch delay: **300ms → 100ms**

**3. Feedback visual instantâneo global**

Adicionar no `index.css` uma classe utilitária e regras globais:
```css
/* Feedback tátil instantâneo em todos os botões/cards clicáveis */
button:active, [role="button"]:active, .touch-feedback:active {
  transform: scale(0.97);
  transition: transform 0.08s ease;
}
```

**4. Navegação via `onPointerDown` nos cards principais**

Para os cards de navegação mais usados (home shortcuts, bottom nav), trocar `onClick` por `onPointerDown` para eliminar o delay de 50-100ms entre toque e evento click em mobile. O `pointerdown` dispara imediatamente no contato.

### Arquivos a modificar

1. `src/hooks/useAggressiveChunkPreloader.ts` — reduzir delays
2. `src/hooks/usePrefetchRoute.ts` — adicionar mais rotas ao mapa
3. `src/index.css` — feedback visual global
4. `src/components/home/HomeAtalhosSection.tsx` — prefetch + pointerdown
5. `src/components/home/EstudosViewCarousel.tsx` — prefetch no toque
6. `src/components/home/LegislacaoHomeSection.tsx` — prefetch no toque
7. `src/components/home/BibliotecaHomeSection.tsx` — prefetch no toque
8. `src/components/home/PortalDeVideosSection.tsx` — prefetch no toque
9. `src/components/BottomNav.tsx` — prefetch + pointerdown
10. `src/pages/Ferramentas.tsx` — prefetch no toque
11. `src/components/questoes/QuestoesMenuRealeza.tsx` — prefetch no toque
12. `src/components/flashcards/FlashcardsMenuPrincipal.tsx` — prefetch no toque

### O que NÃO muda
- Funcionalidades, rotas, dados
- `useTransitionNavigate` continua para evitar erro React #426
- `ContextualSuspense` com delay de 180ms continua (evita flash de skeleton)

### Impacto esperado
- Toque → abertura: **~300-800ms mais rápido** (chunk já carregado via prefetch)
- Feedback visual: **instantâneo** (scale no `:active`)
- Sensação de app nativo fluido

