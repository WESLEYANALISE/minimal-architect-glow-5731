

## Analise Completa: Paginas SEM o Estilo Realeza

### O que e o "Estilo Realeza"

Padrao visual identificado nas paginas ja convertidas (Questoes, Flashcards, Resumos, Vade Mecum):

- **Fundo escuro bordô**: gradientes `hsl(345, 65%, 30%)` → `hsl(350, 40%, 15%)`
- **Acentos dourados**: `hsl(40, 80%, 55%)` para titulos, bordas, icones
- **DotPattern** de fundo com opacidade sutil
- **NumberTicker** para contadores animados
- **Cards com borda dourada**: `border-amber/gold` ao inves de cores aleatorias
- **Tipografia premium**: Playfair Display para titulos hero
- **Subviews inline** com transicoes de slide (sem recarregar pagina)

### Paginas que JA tem o estilo

| Pagina | Componentes Realeza |
|--------|-------------------|
| `QuestoesHubNovo.tsx` | DotPattern, NumberTicker, Crown, DisciplinaCardRealeza, QuestoesMenuRealeza |
| `FlashcardsAreas.tsx` | DotPattern, NumberTicker, Crown, FlashcardsMenuPrincipal |
| `ResumosHubRealeza.tsx` | DotPattern, NumberTicker, GOLD constants, Crown |
| `Codigos.tsx` | DotPattern, brasao, fundo escuro |
| `Estatutos.tsx` | DotPattern, brasao, fundo escuro |
| `LegislacaoPenalEspecial.tsx` | DotPattern, brasao, fundo escuro |
| `Sumulas.tsx` | DotPattern, brasao, fundo escuro |
| `Previdenciario.tsx` | DotPattern, brasao, fundo escuro |
| `Bibliotecas.tsx` | Themis background, amber/gold accents, Playfair Display |

---

### Paginas que FALTAM converter (por prioridade)

#### 1. **Simulados** (3 paginas) — ALTA prioridade
- `Simulados.tsx` — usa `PageHero` generico, gradientes roxos/rosas avulsos
- `SimuladosPersonalizado.tsx` — cards brancos genericos, sem identidade visual
- `SimuladosExames.tsx` — cards basicos sem estilo premium

#### 2. **Audioaulas Hub** — ALTA prioridade
- `AudioaulasHub.tsx` — usa gradientes avulsos (violet, pink, blue), fundo generico, sem DotPattern nem gold

#### 3. **Cursos / Aulas** — MEDIA prioridade
- `Cursos.tsx` — usa `HeroBackground` com imagem avulsa, gradientes coloridos por area sem padrao
- `AulasDashboard.tsx` — pagina totalmente generica, sem identidade visual

#### 4. **Videoaulas** — MEDIA prioridade
- `VideoaulasAreasLista.tsx` — usa background de imagem avulsa, sem DotPattern nem gold

#### 5. **Ferramentas** — MEDIA prioridade
- `Ferramentas.tsx` — usa `PageHero` generico, cards com cores aleatorias por categoria

#### 6. **JuriFlix** — BAIXA prioridade (ja tem estilo Netflix proprio, mas nao e Realeza)

#### 7. **OAB** (3 paginas) — MEDIA prioridade
- `OABFuncoes.tsx` — gradientes vermelhos `hsl(0,75%,55%)`, nao bordô/gold
- `OABOQueEstudar.tsx` — mesmo gradiente vermelho generico
- `OABOQueEstudarArea.tsx` — mesmo

#### 8. **Estudos.tsx** — MEDIA prioridade
- Hub principal de estudos, usa cores genericas e modais basicos

#### 9. **Perfil.tsx** — BAIXA prioridade
- Pagina utilitaria, pode manter mais simples

---

### Plano de implementacao

Converter as **11 paginas** mais impactantes em **4 etapas**:

**Etapa 1 — Simulados (3 arquivos)**
- `Simulados.tsx`: Remover PageHero, adicionar hero bordô com DotPattern e Crown
- `SimuladosPersonalizado.tsx`: Cards com borda dourada, fundo escuro, botao gold
- `SimuladosExames.tsx`: Cards estilizados com bordas douradas

**Etapa 2 — Audioaulas + Cursos (3 arquivos)**
- `AudioaulasHub.tsx`: Substituir gradientes avulsos por paleta bordô/gold, DotPattern
- `Cursos.tsx`: Hero bordô, cards com borda gold, DotPattern
- `AulasDashboard.tsx`: Fundo escuro, progress bars douradas

**Etapa 3 — OAB + Estudos (4 arquivos)**
- `OABFuncoes.tsx`: Trocar vermelho puro por bordô, acentos gold
- `OABOQueEstudar.tsx`: Mesmo ajuste de paleta
- `OABOQueEstudarArea.tsx`: Mesmo
- `Estudos.tsx`: Hero com paleta Realeza

**Etapa 4 — Ferramentas + Videoaulas (2 arquivos)**
- `Ferramentas.tsx`: Remover PageHero, hero bordô com DotPattern
- `VideoaulasAreasLista.tsx`: Fundo escuro, cards com borda gold

### Padrao a aplicar em cada pagina

```text
1. HERO: background gradient bordô (345°-350°, 15-30% lightness)
2. DOTPATTERN: sutil no fundo (opacity 0.15-0.2)
3. TITULOS: gold gradient text (amber-200 → yellow-100 → amber-300)
4. CARDS: border border-amber-900/20, bg escuro semi-transparente
5. ICONES: text-amber-400 ou text-amber-500
6. CONTADORES: NumberTicker para numeros
7. BOTOES: bg-gradient dourado ou bordô
```

### Arquivos a modificar (11)
1. `src/pages/Simulados.tsx`
2. `src/pages/SimuladosPersonalizado.tsx`
3. `src/pages/SimuladosExames.tsx`
4. `src/pages/AudioaulasHub.tsx`
5. `src/pages/Cursos.tsx`
6. `src/pages/AulasDashboard.tsx`
7. `src/pages/OABFuncoes.tsx`
8. `src/pages/OABOQueEstudar.tsx`
9. `src/pages/OABOQueEstudarArea.tsx`
10. `src/pages/Ferramentas.tsx`
11. `src/pages/VideoaulasAreasLista.tsx`

### O que NAO muda
- Funcionalidades, rotas, dados, hooks
- JuriFlix (estilo Netflix intencional)
- Perfil (pagina utilitaria)
- Paginas internas de leitura/resolucao (ja tem contexto proprio)

