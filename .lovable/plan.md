

## Plano: Paleta Vermelha + Performance no Vade Mecum

### Problema
1. **Cor amarela/amber** usada em todo o Vade Mecum (cards, ícones, botões, header, drawer) — deve ser a paleta vermelha do app (`accent` = `hsl(0, 68%, 48%)`)
2. **Carregamento lento** — spinner "Carregando..." aparece porque o `useIndexedDBCache` tem um estado `isLoadingCache` que bloqueia o início do fetch real
3. **Drawer do artigo sobe demais** — precisa ajustar o `max-h` e scroll

---

### Etapa 1: Substituir amber/amarelo pela paleta vermelha do app

Trocar todas as referências em ~12 arquivos do módulo Vade Mecum:

| Padrão antigo | Novo |
|---|---|
| `amber-500` | `accent` (via classes Tailwind `text-accent`, `bg-accent`, etc.) |
| `amber-400` | `accent` ou `text-red-400` |
| `amber-500/10`, `amber-500/20` | `accent/10`, `accent/20` |
| `hsl(45,93%,58%)` | `hsl(var(--accent))` |
| `bg-amber-500` (botões sólidos) | `bg-accent` |
| `text-amber-500` | `text-accent` |

**Arquivos afetados:**
- `src/components/LeiHeader.tsx` — linha decorativa, glow do brasão, estrela favoritos
- `src/components/ArtigoListaCompacta.tsx` — ícone Scale, highlight de busca, badge Crown, tabs ativas, CheckCircle
- `src/components/ArtigoFullscreenDrawer.tsx` — todas as referências amber dentro do drawer
- `src/components/ArtigoActionsMenu.tsx` — botões de ação
- `src/components/SumulaCard.tsx` — border, title, botão share
- `src/components/SumulaActionsMenu.tsx` — dialog, botões de recurso
- `src/components/VadeMecumTabs.tsx` — tabs ativas
- `src/components/VadeMecumTabsInline.tsx` — tabs ativas
- `src/components/ArtigosFavoritosList.tsx` — border-left
- `src/components/vade-mecum/VadeMecumNavigationSidebar.tsx` — sidebar desktop
- `src/components/vade-mecum/VadeMecumDetailPanel.tsx` — painel de detalhe
- `src/components/vade-mecum/AnotacaoDrawer.tsx` — botão salvar
- `src/components/vade-mecum/ResumoArtigoSheet.tsx` — loading e ícones
- `src/components/AulaArtigoModal.tsx` — loading e botões
- `src/pages/CodigoView.tsx` — flashcards modal header, scroll-to-top button
- `src/components/BuscaCompacta.tsx` — se houver amber

---

### Etapa 2: Acelerar carregamento inicial

**2a. Otimizar `useIndexedDBCache`** — O estado `isLoadingCache` começa `true` e só muda para `false` após abrir o IndexedDB e ler o cache. Enquanto isso, `useProgressiveArticles` não inicia o fetch. Solução: iniciar o fetch do Supabase em paralelo com a leitura do cache, usando o que chegar primeiro.

**2b. Otimizar `useProgressiveArticles`** — Aumentar o `initialChunk` de 100 para 200 e reduzir o delay entre chunks de 100ms para 50ms. Também iniciar o fetch imediatamente sem esperar o cache (usar cache como fallback se o fetch demorar).

**2c. Preload da rota CodigoView** — Já está no chunk preloader, mas garantir que o módulo é pré-carregado quando o usuário hover nos cards de legislação.

---

### Etapa 3: Ajustar drawer do artigo

- Reduzir o `max-h` do drawer de `88vh` para `82vh` no mobile para não subir tanto
- Garantir scroll suave ao abrir sem pular para cima

---

### Arquivos criados/modificados
| Arquivo | Alteração |
|---|---|
| 12+ componentes acima | Substituir amber → accent/red |
| `src/hooks/useProgressiveArticles.ts` | Paralelizar cache + fetch |
| `src/hooks/useIndexedDBCache.ts` | Não bloquear com isLoadingCache |
| `src/components/ArtigoFullscreenDrawer.tsx` | Ajustar max-h do drawer |

