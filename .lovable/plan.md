

## Plano: Nova Aba de Questões — Modo Realeza

### Objetivo
Criar uma nova versão completa do módulo de Questões (`/ferramentas/questoes-v2`), reconstruída do zero com estética "Realeza" (Royal Rose), usando a mesma mecânica e dados (tabelas `QUESTOES_GERADAS`, `user_questoes_stats`, hooks existentes), mas com design premium e refinado.

### Estrutura da Nova Aba

```text
/ferramentas/questoes-v2          → QuestoesHubNovo (Hub principal)
/ferramentas/questoes-v2/temas    → QuestoesTemasNovo (Lista de temas)
/ferramentas/questoes-v2/resolver → Reutiliza QuestoesResolver existente
```

### Telas e Componentes

**1. Hub Principal (`QuestoesHubNovo.tsx`)**
- Header hero com gradiente Royal Rose (tons burgundy/rosa profundo) e brasão/ícone Target dourado
- Contagem total animada com NumberTicker
- 4 stat cards (Respondidas, Acertos%, Erros%, Dias seguidos) com estética dark glass e bordas douradas sutis
- Grid 2x2 de ações (Praticar, Progresso, Reforço, Cadernos) com cards de vidro escuro, ícones dourados, efeito BorderBeam e shimmer reflection
- Dra. Arabella com balão de chat (reutiliza lógica existente)
- Paleta: burgundy (`hsl(345-350)`), dourado (`hsl(40-45)`), fundo escuro (`hsl(0 0% 10-12%)`)

**2. Seleção de Disciplinas (dentro do Hub)**
- Cards de disciplina redesenhados com fundo glass escuro, borda dourada sutil, ícone da área em dourado
- Barra de progresso circular dourada em vez de branca
- Tabs (Principais / Frequentes / Extras) com estilo pill dourado
- Animação de entrada staggered com framer-motion

**3. Lista de Temas (`QuestoesTemasNovo.tsx`)**
- Header com gradiente burgundy e nome da área
- Lista de temas com cards escuros, contagem de questões em dourado
- Favoritos com coração dourado
- Reutiliza navegação para `/ferramentas/questoes-v2/resolver`

**4. Resolver Questões**
- Reutiliza `QuestoesResolver` e `QuestoesConcurso` existentes (não recria a mecânica)
- Apenas ajusta a rota de volta

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/ferramentas/QuestoesHubNovo.tsx` | Hub principal novo (~500 linhas) |
| `src/pages/ferramentas/QuestoesTemasNovo.tsx` | Temas da área novo |
| `src/components/questoes/QuestoesMenuRealeza.tsx` | Menu principal com 4 cards Royal |
| `src/components/questoes/DisciplinaCardRealeza.tsx` | Card de disciplina estilo Royal |

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/routes/estudosRoutes.tsx` | Adicionar rotas `/ferramentas/questoes-v2` e `/ferramentas/questoes-v2/temas` |
| `src/components/Header.tsx` | Ocultar header nas novas rotas |
| `src/pages/Admin/AdminPanel.tsx` | Adicionar link para preview da nova aba |

### Identidade Visual Royal

- Fundo: `hsl(0 0% 10%)` com DotPattern sutil
- Cards: glass escuro com `backdrop-blur`, bordas `hsl(40 60% 50% / 0.15)`
- Acentos: dourado `hsl(40 80% 55%)` para ícones, badges, progresso
- Header: gradiente burgundy `hsl(345 65% 30%)` → `hsl(350 50% 20%)`
- Shimmer/shine nos cards principais
- BorderBeam nos cards de ação
- Tipografia: títulos bold brancos, subtítulos dourados, textos `white/60`

### Dados e Mecânica
- Reutiliza `useQuestoesAreasCache` para áreas e contagens
- Reutiliza `useQuestoesTemas` para temas por área
- Reutiliza `user_questoes_stats` para estatísticas do usuário
- Reutiliza `QuestoesConcurso` para resolver questões
- Reutiliza `gerarFeedbackArabella` para a Dra. Arabella

