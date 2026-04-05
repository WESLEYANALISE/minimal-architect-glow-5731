

## Plano: Layout desktop para Flashcards — Abas como lista lateral

### Problema
A sub-view "praticar" (lista de areas com abas Principais/Frequentes/Extras) usa layout mobile mesmo no desktop: abas horizontais, grid 2 colunas, hero carousel pequeno. As laterais ficam vazias.

### Solucao

No desktop, converter para layout de **duas colunas**: sidebar esquerda fixa com navegacao vertical + conteudo principal expandido.

```text
┌─────────────────────────────────────────────────────┐
│  Header (Flashcards - X disponíveis)                │
├──────────────┬──────────────────────────────────────┤
│  NAVEGAÇÃO   │  CONTEÚDO                            │
│              │                                      │
│  ● Principais│  Grid 3-4 colunas de areas           │
│    Frequentes│                                      │
│    Extras    │                                      │
│              │                                      │
│  ─────────── │                                      │
│  Stats       │                                      │
│  Compreendi  │                                      │
│  Revisar     │                                      │
│  Streak      │                                      │
│              │                                      │
│  Dra.Arabella│                                      │
└──────────────┴──────────────────────────────────────┘
```

### Mudancas

**1. `src/pages/FlashcardsAreas.tsx`** — Sub-view "praticar" (linhas ~554-751)

Quando `isDesktopDevice`:
- Remover hero carousel (desnecessario no desktop)
- Substituir abas horizontais por lista vertical na sidebar esquerda com icones e indicador ativo (borda dourada lateral)
- Abaixo das abas na sidebar: bloco de stats (total estudados, compreendi %, revisar %, streak)
- Abaixo dos stats: Dra. Arabella feedback (reutilizar logica do menu principal)
- Area principal: grid `grid-cols-3 xl:grid-cols-4 gap-4` com cards maiores (`h-[120px]`)
- Manter layout mobile inalterado

**2. `src/pages/FlashcardsAreas.tsx`** — Sub-view "categories" (serpentine timeline, linhas ~372-551)

Quando `isDesktopDevice`:
- Converter serpentine (mobile) em grid horizontal `grid-cols-4 gap-5` com os 4 cards lado a lado
- Remover timeline central e footprints (elementos mobile-only)
- Cards maiores no desktop

### O que NAO muda
- Layout mobile (todas as sub-views)
- Sub-view "menu" (ja tem layout desktop)
- Componentes FlashcardsMenuPrincipal, FlashcardsEstatisticas
- Rotas, dados, logica de navegacao

