

## Plano: Biblioteca responsiva para Desktop + abrir livro na mesma pagina

### Problemas identificados

1. **Paginas de detalhe dos livros** (8 arquivos `Biblioteca*Livro.tsx`) usam layout mobile-only — sem `useDeviceType`, sem grid desktop, sem aproveitar o espaco da tela
2. **Falta o cabeçalho DesktopTopNav** visivel nas paginas de livros (o `StandardPageHeader` mobile aparece por cima)
3. **O usuario quer que o livro abra "na mesma pagina"** — ou seja, ao clicar num livro no desktop, o detalhe deve abrir inline (painel lateral ou overlay) em vez de navegar para outra rota

### Solucao

**Abordagem: Detalhe inline no desktop da Biblioteca**

Ao clicar num livro no desktop (pagina `Bibliotecas.tsx`), em vez de `navigate('/biblioteca-classicos/123')`, abrir um **painel de detalhe lateral** (drawer/sidebar direita) dentro da propria pagina da Biblioteca. O layout fica:

```text
┌─────────────────────────────────────────────────────┐
│ DesktopTopNav (Estudos, Biblioteca, Legislação...)  │
├──────────────────────────┬──────────────────────────┤
│ Grade de livros          │ Detalhe do livro         │
│ (coleção selecionada)    │ - Capa + titulo + autor  │
│                          │ - Botão Ler / Download   │
│                          │ - Sobre o livro          │
│                          │ - Videoaula              │
│                          │ - Favoritar              │
└──────────────────────────┴──────────────────────────┘
```

No mobile, o comportamento continua igual (navega para rota separada).

### Arquivos a modificar

**1. `src/pages/Bibliotecas.tsx`** (principal)
- Adicionar estado `selectedBookId` e `selectedBookBiblioteca`
- No desktop, ao clicar num livro: setar o ID em vez de navegar
- Renderizar painel lateral direito com dados do livro selecionado (query por ID)
- Layout: grade de livros ocupa ~60%, detalhe ocupa ~40%
- Incluir no painel: capa, titulo, autor, sobre, botoes (Ler, Download, Favoritar, Videoaula)
- No mobile: manter `navigate()` normal

**2. `src/pages/BibliotecaClassicosLivro.tsx`** (e os outros 7 arquivos de livro)
- Adicionar layout desktop responsivo com `useDeviceType`
- No desktop: layout horizontal (capa a esquerda, info a direita), sem `pb-20`, sem `StandardPageHeader` (o DesktopTopNav global ja aparece)
- Manter funcionalidade igual (PDF, video, leitura dinamica, favoritos, premium gate)

### Detalhes tecnicos

- Criar componente `BibliotecaLivroDetalhePanel.tsx` reutilizavel para o painel inline do desktop
- O painel faz sua propria query ao Supabase (`useQuery` com o ID do livro e tabela)
- Integrar `BibliotecaFavoritoButton`, `PDFReaderModeSelector`, `PremiumFloatingCard` dentro do painel
- As 8 paginas de livro individuais ganham layout desktop com `useDeviceType` para quando o usuario acessa diretamente pela URL

### Arquivos a criar/modificar (10)

1. **Criar** `src/components/biblioteca/BibliotecaLivroDetalhePanel.tsx` — painel inline reutilizavel
2. **Modificar** `src/pages/Bibliotecas.tsx` — integrar painel lateral no desktop
3-9. **Modificar** os 7 arquivos `Biblioteca*Livro.tsx` — adicionar layout desktop responsivo
10. Nenhuma rota muda — acesso direto por URL continua funcionando

### O que NAO muda
- Funcionalidades (PDF, video, leitura dinamica, favoritos, premium)
- Rotas existentes
- Layout mobile
- Dados e hooks

