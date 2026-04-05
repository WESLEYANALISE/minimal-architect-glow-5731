

## Plano: Responsividade desktop para SimuladosHub

### Problema
A pagina `/ferramentas/simulados` (SimuladosHub) tem layout mobile no desktop: lista vertical estreita, botao voltar duplicado (um no Header global + um interno), laterais vazias.

### Solucao

Seguir o padrao do projeto: usar `useDeviceType` para detectar desktop e criar layout de 3 colunas com sidebars laterais preenchidas. Remover botao voltar interno (o Header global ja cuida disso).

```text
Desktop:
┌──────────────┬──────────────────────────┬──────────────┐
│  Estatisticas│  Header (sem botao vol.) │  Info/Dicas  │
│  - Total     │  Cards de cargos         │  - Como      │
│    provas    │  (lista vertical com     │    funciona  │
│  - Total     │   cards maiores)         │  - Ranking   │
│    questoes  │                          │  - Ultimos   │
│  - Desempenho│                          │    resultados│
│  - Cargos    │                          │              │
└──────────────┴──────────────────────────┴──────────────┘
```

### Mudancas

**1. `src/pages/ferramentas/SimuladosHub.tsx`**

- Importar `useDeviceType`
- Remover botao voltar interno (ArrowLeft) — o Header global ja faz isso
- No desktop (`isDesktop`):
  - Layout `grid grid-cols-[260px_1fr_260px]` com altura `h-[calc(100vh-4.5rem)]`
  - **Sidebar esquerda**: estatisticas resumidas (total de cargos, total de provas, total de questoes, calculados dos dados ja carregados)
  - **Centro**: lista de cargos existente, cards um pouco maiores
  - **Sidebar direita**: dicas/info sobre simulados, como funciona, card motivacional
- No mobile: manter layout atual (sem o botao voltar duplicado)

### O que NAO muda
- Query de dados (Supabase)
- Logica de navegacao aos cargos
- `SimuladoFreeConfirmDialog`, `PremiumBadge`
- Paginas internas (CargoLista, Detalhes, Resolver, Resultado)
- Rotas

