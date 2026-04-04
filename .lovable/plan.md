

## Plano: Modo Realeza para as categorias do Vade Mecum

### Objetivo
Aplicar a paleta dourada/escura premium nas 5 paginas de categorias de leis do Vade Mecum, unificando com o design "Realeza" ja aplicado em Questoes e Flashcards.

### Paginas afetadas

| Pagina | Arquivo | Linhas |
|--------|---------|--------|
| Codigos | `src/pages/Codigos.tsx` | 285 |
| Estatutos | `src/pages/Estatutos.tsx` | 162 |
| Legislacao Penal Especial | `src/pages/LegislacaoPenalEspecial.tsx` | 160 |
| Sumulas | `src/pages/Sumulas.tsx` | 201 |
| Previdenciario | `src/pages/Previdenciario.tsx` | 229 |

### O que muda em cada pagina (mesmo padrao)

**Header**
- Fundo: gradiente escuro `hsl(0 0% 7%)` → `hsl(0 0% 12%)` com `DotPattern` sutil dourado
- Brasao: manter, adicionar anel dourado sutil ao redor
- Titulo: fonte serif `Playfair Display`, cor branca
- Subtitulo: cor dourada `hsl(40, 70%, 60%)` em vez de `text-amber-400`

**Barra de busca**
- Fundo: `hsl(0 0% 10%)` com borda dourada `hsla(40, 60%, 50%, 0.12)`
- Input: fundo escuro com borda dourada sutil
- Botao buscar: gradiente dourado

**Cards de lei/codigo/estatuto**
- Fundo: `hsla(0, 0%, 100%, 0.04)` em vez de `bg-card`
- Borda esquerda: manter a cor original da lei
- Borda geral: `hsla(40, 60%, 50%, 0.08)`
- Hover: brilho dourado sutil `hsla(40, 60%, 50%, 0.06)`
- Shimmer overlay dourado no hover
- CheckCircle: manter dourado (ja esta)

**LeisToggleMenu tabs**
- Tab ativo: borda dourada em vez de primary

**Fundo geral da pagina**
- `hsl(0 0% 7%)` com `DotPattern` em `hsla(40, 50%, 40%, 0.12)`

**Empty state**
- Icone com tom dourado

### Paleta Realeza (referencia)
- Fundo: `hsl(0 0% 7%)` a `hsl(0 0% 12%)`
- Dourado: `hsl(40, 80%, 55%)`
- Bordas: `hsla(40, 60%, 50%, 0.12)`
- Texto destaque: `hsl(40, 70%, 60%)`

### Tambem atualizar: VadeMecumTodas.tsx (hub principal)
- Grid de categorias (mobile e desktop): adicionar bordas douradas sutis nos cards
- Tabs mobile (Legislacao/Leis do Dia/Explicacoes): tab ativo com acento dourado
- Header desktop: gradiente com `DotPattern` dourado
- Barra de busca: borda dourada

### Arquivos a modificar (6)
1. `src/pages/Codigos.tsx`
2. `src/pages/Estatutos.tsx`
3. `src/pages/LegislacaoPenalEspecial.tsx`
4. `src/pages/Sumulas.tsx`
5. `src/pages/Previdenciario.tsx`
6. `src/pages/VadeMecumTodas.tsx`

### O que NAO muda
- Funcionalidades (favoritos, recentes, premium gate, prefetch, busca)
- Cores individuais de cada lei/codigo (border-left mantida)
- Rotas e hooks
- Componentes internos (LegislacaoBackground, LeisToggleMenu — apenas estilos inline)

