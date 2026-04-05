

## Plano: Padronizar acesso gratuito — 2 itens por area em tudo + 10 artigos no Vade Mecum

### Estado atual vs desejado

| Modulo | Regra atual | Regra desejada |
|--------|-------------|----------------|
| **Resumos** (temas) | 20% dos temas liberados | **2 temas por area** |
| **Resumos** (areas) | Apenas Constitucional e Administrativo | **Todas as areas abertas** |
| **Questoes** (areas) | 20% das areas liberadas | **Todas as areas abertas** |
| **Questoes** (temas) | 2 temas por area | OK, ja esta correto |
| **Flashcards** (temas) | 2 temas por area | OK, ja esta correto |
| **Biblioteca** | 2 livros por area (absoluto) | OK, ja esta correto |
| **Audioaulas** | 10% por area | **2 por area** |
| **Vade Mecum** | 10 artigos por lei | OK, ja esta correto |

### Mudancas necessarias

#### 1. Resumos — Liberar todas as areas + 2 temas por area

**`src/pages/ResumosHubRealeza.tsx`**:
- Remover a constante `FREE_AREAS` e a logica `isLocked` que bloqueia areas inteiras
- Todas as areas ficam clicaveis (sem Crown, sem redirect para /assinatura)

**`src/pages/ResumosProntos.tsx`**:
- Remover `FREE_AREAS_RESUMOS` e `isAreaFreeResumo`
- Substituir a logica de 20% (`Math.ceil(temasFiltrados.length * 0.20)`) por limite fixo de **2 temas**
- Temas a partir do indice 2 mostram Crown dourada e abrem `PremiumFloatingCard` ao clicar

#### 2. Questoes — Liberar todas as areas

**`src/pages/ferramentas/QuestoesAreas.tsx`**:
- Remover `useContentLimit(filteredAreas, 'questoes')` que bloqueia 80% das areas
- Todas as areas ficam clicaveis diretamente
- Manter a logica de 2 temas por area que ja existe em `QuestoesTemas.tsx` (linha 65: `lockedFromIndex = 2`)

#### 3. Audioaulas — 2 por area

**`src/pages/AudioaulasCategoria.tsx`**:
- Substituir `Math.ceil(audios.length * 0.10)` por limite fixo de **2**
- Audios a partir do indice 2 mostram Crown e abrem PremiumFloatingCard

#### 4. Padronizar visual da Crown + banner premium

Em todos os modulos modificados, usar o mesmo padrao visual:
- Crown dourada (`Crown` de lucide, `bg-amber-500/90 text-white`) no canto do item bloqueado
- Click no item bloqueado abre `PremiumFloatingCard` (ja existe em todos os arquivos)
- Texto do item bloqueado com `opacity-50`

### Arquivos a modificar (4)

1. **`src/pages/ResumosHubRealeza.tsx`** — Remover FREE_AREAS, liberar todas as areas
2. **`src/pages/ResumosProntos.tsx`** — Limite fixo de 2 temas (em vez de 20%)
3. **`src/pages/ferramentas/QuestoesAreas.tsx`** — Remover useContentLimit, liberar todas as areas
4. **`src/pages/AudioaulasCategoria.tsx`** — Limite fixo de 2 (em vez de 10%)

### O que NAO muda
- Flashcards temas (ja tem limite de 2)
- Questoes temas (ja tem limite de 2)
- Bibliotecas (ja tem limite de 2 livros)
- Vade Mecum (ja tem limite de 10 artigos)
- PremiumFloatingCard, PremiumBadge, hooks de subscription
- Rotas, layout, funcionalidades

