

# Plano: Tornar Todas as Páginas Responsivas para Desktop

## Contexto

Analisei todas as ~400 páginas do projeto. Encontrei **29 páginas que já usam `useDeviceType`** com layout desktop dedicado, e **~20 páginas importantes que NÃO têm** — ficam com layout mobile estreito no desktop, desperdiçando espaço.

## Padrão de Referência

Baseado nos dashboards open-source com shadcn/Tailwind (como shadcn-dashboard-landing-template), o padrão ideal para este projeto é:

```text
┌──────────────────────────────────────────────────┐
│  DesktopTopNav (já existe, 4.5rem)               │
├──────────┬───────────────────────┬───────────────┤
│ Sidebar  │   Conteúdo Principal  │  Sidebar Dir  │
│ (já      │   max-w-5xl           │  (opcional)   │
│  existe) │   grid responsivo     │               │
│          │   4-5 cols no desktop │               │
└──────────┴───────────────────────┴───────────────┘
```

O padrão já existente no projeto (ex: FlashcardsHub, QuestoesEscolha, Dicionario) é:
- `useDeviceType()` → `if (isDesktop)` retorna layout dedicado
- `height: calc(100vh - 4.5rem)` para ocupar tela inteira
- Grid de 3-5 colunas no conteúdo
- Sidebar opcional com dicas/filtros

## Páginas a Adaptar (por prioridade)

### Fase 1 — Páginas de Hub/Navegação (mais impacto visual)

| Página | Arquivo | O que fazer |
|--------|---------|-------------|
| Jogos Jurídicos | `JogosJuridicos.tsx` | Grid 3-4 cols, remover PageHero, título inline |
| Meu Brasil | `MeuBrasil.tsx` | Grid 3 cols com cards, busca no topo |
| Política | `Politica.tsx` | Layout 2 colunas: conteúdo + sidebar notícias |
| Carreiras | `CarreirasJuridicas.tsx` | Já tem `isDesktop` mas layout básico — melhorar com header compacto |
| Advogado | `Advogado.tsx` | Grid 3 cols com sidebar de blog |
| Cursos | `Cursos.tsx` | Grid de áreas em 3-4 cols, header compacto |
| Leitura Dinâmica | `LeituraDinamica.tsx` | Grid 4 cols de livros, busca no topo |

### Fase 2 — Páginas de Conteúdo

| Página | Arquivo | O que fazer |
|--------|---------|-------------|
| Evelyn | `Evelyn.tsx` | Card central flutuante (igual ChatProfessora) |
| Três Poderes (3 pgs) | `TresPoderes*.tsx` | Grid responsivo de membros/itens |
| Boletins Jurídicos | `BoletinsJuridicos.tsx` | Grid 3 cols |
| Posts Jurídicos | `PostsJuridicos.tsx` | Grid 2-3 cols |
| Novidades | `Novidades.tsx` | Timeline central com max-width |
| Estagios | `Estagios.tsx` | Grid 3 cols + filtros laterais |

### Fase 3 — Páginas Secundárias

| Página | Arquivo | O que fazer |
|--------|---------|-------------|
| Politica Blog | `PoliticaBlog.tsx` | Grid de artigos |
| DicionarioLetra | `DicionarioLetra.tsx` | Lista expandida com sidebar |
| Simulação Jurídica | `SimulacaoJuridica.tsx` | Grid de opções |
| Gamificação | `Gamificacao.tsx` | Grid de jogos |

## Abordagem Técnica

Para cada página, o padrão será:

1. Importar `useDeviceType`
2. Adicionar bloco `if (isDesktop)` no início do render
3. No desktop:
   - Remover `PageHero` / `StandardPageHeader` (substituir por título inline compacto)
   - Remover `pb-20` (não há bottom nav no desktop)
   - Usar `height: calc(100vh - 4.5rem)` com `overflow-y-auto`
   - Grids de 3-5 colunas dependendo do conteúdo
   - Background mais sutil (`bg-background` ao invés de gradientes escuros)
4. Manter o layout mobile intacto (é o fallback)

## Resultado Esperado

Todas as ~20 páginas identificadas passarão a ter layout desktop dedicado que:
- Ocupa a tela inteira sem desperdício de espaço
- Usa grids responsivos (3-5 colunas)
- Remove elementos mobile-only (PageHero, bottom padding)
- Mantém consistência visual com as páginas que já têm desktop layout

