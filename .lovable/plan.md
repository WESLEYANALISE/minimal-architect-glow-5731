

## Plano: Modo Realeza para Resumos Juridicos

### Objetivo
Recriar o modulo de Resumos Juridicos com a estetica "Realeza" (mesma paleta dourada/escura do QuestoesHubNovo), mantendo todas as funcionalidades existentes mas com design premium unificado.

### Paginas afetadas (5 paginas principais)

1. **ResumosJuridicosLanding** (`/resumos-juridicos`) — Hub principal com carousel, tabs (Metodos/Grade/Raio-X/Sobre)
2. **ResumosJuridicosEscolha** (`/resumos-juridicos/prontos`) — Lista de areas do Direito
3. **ResumosJuridicosTemas** (`/resumos-juridicos/temas`) — Temas dentro de uma area
4. **ResumosProntos** (`/resumos-juridicos/prontos/:area`) — Subtemas dentro de um tema
5. **ResumosProntosView** (`/resumos-juridicos/prontos/:area/:tema`) — Visualizacao do resumo

### Mudancas de design (aplicadas em todas as paginas)

- **Fundo escuro**: `hsl(0 0% 10%)` com `DotPattern` sutil (igual Questoes)
- **Cards**: fundo `hsla(0, 0%, 100%, 0.04)`, borda `hsla(40, 60%, 50%, 0.12)`, sombra multicamada com brilho interno dourado
- **Shimmer hover**: reflexo dourado diagonal nos cards
- **Acentos dourados**: titulos brancos, subtitulos em `hsl(40, 80%, 55%)`, contagens em dourado
- **Icones de area**: badges com fundo `hsla(40, 60%, 50%, 0.12)` e icone dourado
- **Tabs**: fundo escuro com tab ativa em dourado
- **Animacoes**: fade-in escalonado (30ms delay), slide transitions com framer-motion
- **Coroa dourada**: areas bloqueadas para usuarios gratuitos
- **Header**: gradiente escuro com tipografia branca, sem StandardPageHeader

### Navegacao inline (igual Questoes)

- Transicoes entre subviews (areas → temas → subtemas) via `AnimatePresence` + `motion.div` com slide lateral, sem recarregar pagina
- Unificar Landing + Escolha + Temas numa unica pagina `ResumosHubRealeza.tsx`

### Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/ResumosHubRealeza.tsx` | Novo — hub unificado com subviews inline |
| `src/routes/estudosRoutes.tsx` | Apontar `/resumos-juridicos` e `/resumos-juridicos/prontos` para o novo hub |
| `src/pages/ResumosProntos.tsx` | Aplicar paleta Realeza |
| `src/pages/ResumosProntosView.tsx` | Aplicar paleta Realeza |

### Estrutura do Hub unificado

```text
ResumosHubRealeza
├── SubView: "landing" (metodos, carousel, tabs)
├── SubView: "areas" (lista de areas com favoritos/recentes)
├── SubView: "temas" (temas da area selecionada)
└── Navegacao: slide direita→esquerda via AnimatePresence
```

### Detalhes tecnicos

- Reutiliza `DotPattern`, `NumberTicker` e `DisciplinaCardRealeza` como referencia de estilo
- Reutiliza hooks existentes: `useResumosCount`, `useResumosTemas`, `useResumosAreasCache`
- Reutiliza dados do Supabase (tabela `RESUMO`, `METODOLOGIAS_GERADAS`)
- Paleta HSL: dourado `hsl(40, 80%, 55%)`, fundo `hsl(0, 0%, 10%)`, bordas `hsla(40, 60%, 50%, 0.12)`
- Paginas antigas permanecem como fallback, rotas redirecionam para o novo hub
- Responsivo: layout desktop com grid multi-colunas, mobile lista vertical

