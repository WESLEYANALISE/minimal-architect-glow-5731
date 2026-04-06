

## Plano: Redesign Desktop da Biblioteca — Sidebar lateral + Detalhe tela cheia

### Problema atual
No desktop, as categorias (Classicos, Estudos, OAB...) ficam como abas horizontais no topo. Ao clicar num livro, abre um painel lateral de 35%. O usuario quer:
1. Categorias como **sidebar vertical** no lado esquerdo
2. Livros em **grid** no centro
3. Ao clicar num livro, abrir **tela cheia** com todos os detalhes (nao painel lateral)
4. Header seguindo o padrao global

### Mudancas

**1. Reestruturar o layout desktop em `Bibliotecas.tsx`**

Substituir o layout atual (abas horizontais + grid + painel lateral) por:

```text
┌─────────────────────────────────────────────────┐
│  Header global (DesktopTopNav)                  │
├────────────┬────────────────────────────────────┤
│  SIDEBAR   │  GRID DE LIVROS                   │
│            │                                    │
│ Classicos ◄│  [capa] [capa] [capa] [capa] ...  │
│ Estudos    │  [capa] [capa] [capa] [capa] ...  │
│ OAB        │                                    │
│ Politica   │  Busca no topo do grid             │
│ Oratoria   │  Plano/Favoritos como botoes       │
│ Portugues  │                                    │
│ Lideranca  │                                    │
│ Fora Toga  │                                    │
│ Pesquisa   │                                    │
│            │                                    │
│ ── Info ── │                                    │
│ Total obras│                                    │
│ Colecoes   │                                    │
└────────────┴────────────────────────────────────┘
```

- Sidebar fixa (w-64) com lista vertical de categorias, icones, contagem de livros, item ativo destacado
- Area central com busca + grid de capas
- Botoes Plano/Favoritos movidos para a sidebar ou topo do grid

**2. Tela cheia ao clicar num livro**

Em vez do `BibliotecaLivroDetalhePanel` lateral, ao clicar num livro no desktop:
- Abrir um **overlay/modal de tela cheia** (ou estado inline que substitui o grid)
- Mostrar capa grande, titulo, autor, sobre, botoes Ler/Download/Video
- Botao de fechar (X) ou voltar que retorna ao grid
- Reutilizar a logica do `BibliotecaLivroDetalhePanel` mas em layout expandido

**3. Header padrao**

- Remover o header customizado interno
- Usar o `StandardPageHeader` que ja existe (titulo "Bibliotecas", botao voltar via Header global)

### Detalhes tecnicos

- Manter o `selectedCollection` state para sidebar ativa
- Substituir `selectedBookId` + painel lateral por `selectedBookId` + overlay fullscreen
- Manter queries existentes (contagens, livros preview)
- Mobile permanece identico (bloco `lg:hidden` nao muda)
- Componente novo: `BibliotecaLivroFullscreen` — reutiliza dados do DetalhePanel mas em layout centralizado com mais espaco

### O que NAO muda
- Queries Supabase, dados, cache
- Layout mobile (lg:hidden)
- Rotas, lazy loading
- BibliotecaTopNav (usado apenas no mobile)
- Paginas individuais (BibliotecaClassicos, etc.)

