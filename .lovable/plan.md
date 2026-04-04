

## Plano: Modo Realeza para Flashcards

### Objetivo
Transformar o hub de Flashcards (`FlashcardsAreas.tsx`) e a pagina de temas (`FlashcardsTemas.tsx`) para usar a mesma estetica "Realeza" do modulo de Questoes — paleta dourada/escura, `DotPattern`, `NumberTicker`, bordas douradas, e visual premium unificado.

### O que muda

**1. `FlashcardsAreas.tsx` — Hub principal (menu)**
- Header: trocar gradiente marrom por gradiente escuro com bordas douradas (`hsla(40, 60%, 50%, 0.12)`) e `DotPattern` de fundo
- Titulo "Flashcards" com fonte serif (Playfair Display) e contagem usando `NumberTicker`
- Cards do menu (Praticar, Progresso, Reforco, Decks): manter a estrutura do `FlashcardsMenuPrincipal` mas aplicar bordas douradas sutis e fundo `hsl(0 0% 10%)` consistente
- Stats (compreendi, revisar, streak): aplicar bordas douradas nos cards de estatistica
- Fundo geral: `hsl(0 0% 7%)` com `DotPattern` sutil

**2. `FlashcardsAreas.tsx` — SubView "categories" (areas)**
- Header: mesmo padrao realeza com dourado
- Cards de area (grid 2x2): adicionar borda dourada sutil (`hsla(40, 60%, 50%, 0.1)`) e sombra dourada
- Tabs (Principais, Frequentes, Extras): estilizar com borda dourada no tab ativo
- Trilha serpentina das categorias: manter mas com acentos dourados nos nodes

**3. `FlashcardsTemas.tsx` — Lista de temas**
- Header: gradiente escuro com acentos dourados em vez do gradiente colorido da area
- Tabs (Ordem, Favoritos, Pesquisar): bordas douradas no ativo
- Cards de tema na lista: bordas `hsla(40, 60%, 50%, 0.08)`, fundo `rgba(255,255,255,0.04)`
- Badge numerico: anel dourado em vez da cor da area
- Seta/chevron: dourada
- Badge de flashcards count: cor dourada

**4. `FlashcardsMenuPrincipal.tsx` — Menu principal**
- Cards 2x2: adicionar bordas douradas sutis
- Stats grid (4 colunas): bordas douradas
- Fundo dos cards: manter gradientes mas com brilho dourado sutil

### Paleta Realeza (mesma do Questoes)
- Fundo: `hsl(0, 0%, 7%)` a `hsl(0, 0%, 10%)`
- Dourado principal: `hsl(40, 80%, 55%)`
- Bordas: `hsla(40, 60%, 50%, 0.12)`
- Texto destaque: `hsl(40, 70%, 60%)`
- DotPattern: `hsla(40, 50%, 40%, 0.15)`

### Arquivos a modificar
1. `src/pages/FlashcardsAreas.tsx` — Header, fundo, subviews
2. `src/pages/FlashcardsTemas.tsx` — Header, lista, tabs
3. `src/components/flashcards/FlashcardsMenuPrincipal.tsx` — Stats e grid de menu

### O que NAO muda
- Funcionalidades (navegacao, cache, auto-geracao, favoritos, premium gate)
- Componentes internos (FlashcardsEstudar, FlashcardStack, etc.)
- Rotas e hooks

