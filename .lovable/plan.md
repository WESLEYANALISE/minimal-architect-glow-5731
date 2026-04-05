

## Auditoria Completa do Vade Mecum: Problemas e Melhorias

### Resumo

O Vade Mecum tem uma arquitetura mista: o `CodigoView.tsx` (1007 linhas) serve como hub unificado para ~80 leis via `/codigo/:id`, mas ainda existem **2 páginas legadas ativas** (`EstatutoView`, `SumulaView`) e **13 páginas legadas mortas** (não importadas em nenhum lugar). Identifiquei **8 problemas** divididos em 3 categorias.

---

### PROBLEMA 1 — Codigo morto: 13 arquivos View abandonados

Estes arquivos existem mas **nenhuma rota os importa** — todas as rotas antigas redirecionam para `/codigo/:id`:

```text
AbusoAutoridadeView.tsx    CrimesDemocraticosView.tsx
CrimesHediondosView.tsx    InterceptacaoTelefonicaView.tsx
JuizadosEspeciaisView.tsx  LeiDrogasView.tsx
LeiPenalGenericView.tsx    LeiPenalLavagemDinheiro.tsx
LepView.tsx                MariaDaPenhaView.tsx
OrganizacoesCriminosasView.tsx  PacoteAnticrimeView.tsx
TorturaView.tsx
```

Total: ~4.600 linhas de codigo morto. Usam hooks antigos (`useCacheFirstArticles`, `useAutoNarracaoGeneration`), nao tem Modo Realeza, nao tem layout desktop.

**Melhoria**: Deletar todos os 13 arquivos.

---

### PROBLEMA 2 — EstatutoView e SumulaView duplicam CodigoView

Ambas sao rotas ativas (`/estatuto/:id`, `/sumula/:id`) mas replicam 90% da logica do CodigoView com diferenças:

- **EstatutoView** (686 linhas): Usa `useCacheFirstArticles` (hook antigo, sem progressive loading), tem layout desktop via `VadeMecumDesktopLayout`, mas **sem Modo Realeza** (fundo `bg-background` generico), sem `DotPattern`, sem gradiente bordo.
- **SumulaView** (461 linhas): Adapta sumulas para formato Article, tem layout desktop, mas tambem **sem Modo Realeza**, sem `DotPattern`, usa `useCacheFirstArticles`.

**Melhoria**: Migrar ambas para o CodigoView unificado adicionando mapeamentos em `codeNames`/`tableNames`/`lawNumbers` para estatutos e sumulas, e configurar redirects nas rotas. Isso eliminaria ~1.150 linhas duplicadas.

---

### PROBLEMA 3 — Mapeamentos triplicados no CodigoView

O CodigoView tem **3 objetos de mapeamento enormes** dentro do componente (~150 linhas cada):

1. `codeNames` (slug → nome legivel) — linhas 153-228
2. `tableNames` (slug → nome tabela) — linhas 230-305
3. `lawNumbers` (slug → numero da lei) — linhas 308-383

Estes repetem parcialmente o `CODIGO_TO_TABLE` de `codigoMappings.ts` mas com slugs diferentes (ex: `lei-beneficios` vs `beneficios`). Aliases inconsistentes.

**Melhoria**: Centralizar tudo em `codigoMappings.ts` com um unico objeto:
```ts
{ slug, tableName, displayName, lawNumber, urlPlanalto }
```

---

### PROBLEMA 4 — Desktop sem Modo Realeza

O `VadeMecumDesktopLayout.tsx` (linha 207-298) usa `bg-background` generico, sem gradiente bordo, sem DotPattern, sem acentos dourados. No mobile do CodigoView ja tem Modo Realeza, mas no desktop nao.

**Melhoria**: Aplicar gradiente bordo e DotPattern no container principal do desktop layout, com bordas douradas na sidebar.

---

### PROBLEMA 5 — Busca do desktop isolada da busca mobile

No mobile, a `BuscaCompacta` aparece no CodigoView diretamente. No desktop, ela aparece dentro do `ArtigoListaCompacta` (via props `searchInput`/`onSearchInputChange`). Nao ha atalho de teclado `/` para focar a busca no desktop apesar do footer do sidebar indicar isso.

**Melhoria**: Implementar o atalho `/` que esta documentado no sidebar mas nao funciona.

---

### PROBLEMA 6 — Performance: EstatutoView/SumulaView usam hook antigo

`useCacheFirstArticles` faz um unico fetch de todos os artigos. O `useProgressiveArticles` (usado no CodigoView) carrega 100 primeiro e o resto em background com IndexedDB cache. Estatutos e Sumulas nao se beneficiam desse ganho.

**Melhoria**: Resolvido automaticamente ao migrar para CodigoView (Problema 2).

---

### PROBLEMA 7 — `gerarAulasBackground` dispara em toda lei

O `CodigoView` dispara `processar-aulas-background` 3s apos abrir **qualquer** lei. Para leis com 500+ artigos isso gasta Edge Function invocations inutilmente se ja foram processadas.

**Melhoria**: Verificar cache antes de disparar, ou limitar a leis com aulas pendentes.

---

### PROBLEMA 8 — Falta de loading skeleton coerente no desktop

O desktop layout mostra skeletons genericos (`animate-pulse flex gap-3`) sem o estilo Realeza. O mobile usa skeletons com `bg-card rounded-2xl`.

**Melhoria**: Usar o `LegislacaoSkeleton` existente ou criar versao com gradiente bordo.

---

### Plano de Implementacao (priorizado)

#### Fase 1 — Limpeza (impacto alto, risco baixo)
1. Deletar os 13 arquivos View mortos
2. Centralizar mapeamentos em `codigoMappings.ts` com estrutura unificada

#### Fase 2 — Unificacao (impacto alto, risco medio)
3. Migrar EstatutoView para CodigoView (adicionar slugs de estatutos)
4. Migrar SumulaView para CodigoView (adapter de sumula → artigo)
5. Atualizar rotas para redirect

#### Fase 3 — Visual e UX
6. Aplicar Modo Realeza no VadeMecumDesktopLayout
7. Implementar atalho `/` para busca no desktop
8. Otimizar `gerarAulasBackground` com verificacao de cache

### Arquivos a modificar

1. **Deletar** 13 arquivos `*View.tsx` mortos
2. **Refatorar** `src/lib/codigoMappings.ts` — objeto unificado com displayName + lawNumber
3. **Simplificar** `src/pages/CodigoView.tsx` — usar mapeamento centralizado, remover 150 linhas de objetos internos
4. **Migrar** `src/pages/EstatutoView.tsx` → adicionar slugs ao CodigoView, depois deletar
5. **Migrar** `src/pages/SumulaView.tsx` → adicionar slugs ao CodigoView com adapter, depois deletar
6. **Atualizar** `src/routes/vadeMecumRoutes.tsx` — redirects de `/estatuto/:id` e `/sumula/:id`
7. **Estilizar** `src/components/vade-mecum/VadeMecumDesktopLayout.tsx` — Modo Realeza
8. **Otimizar** `src/pages/CodigoView.tsx` — gerarAulasBackground condicional

### O que NAO muda
- Funcionalidades (drawer, busca, playlist, ranking, grifos, anotacoes, pratica)
- Edge Functions
- Dados e tabelas
- ArtigoFullscreenDrawer, ArtigoListaCompacta
- Layout mobile do CodigoView (ja tem Modo Realeza)

