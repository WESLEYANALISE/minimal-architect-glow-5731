

## Plano: Refazer estrutura completa do JuriFlix (Mobile + Desktop)

### Problemas atuais

1. **Layout 100% mobile** — JuriFlix.tsx nao usa `useDeviceType` para renderizar layout desktop dedicado
2. **Cards pequenos no desktop** — w-[140px] fixo, desperdicando espaco em telas grandes
3. **Hero comprimido** — h-56 mesmo em telas grandes, sem aproveitar backdrop
4. **Bottom nav propria** — conflita com a nav principal do app no desktop
5. **Pagina de detalhes** — funcional mas sem layout side-by-side otimizado para desktop
6. **Sem DesktopTopNav** — falta o cabecalho de navegacao global no desktop

### Solucao

**Desktop: Layout Netflix de verdade**

```text
┌──────────────────────────────────────────────────────────┐
│ DesktopTopNav (Estudos, Biblioteca, Legislação...)       │
├──────────────────────────────────────────────────────────┤
│ Hero fullwidth (h-[400px]) com backdrop + info overlay   │
├──────────────────────────────────────────────────────────┤
│ Tabs filtro (Todos | Filmes | Séries | Docs)             │
│ + Busca integrada à direita                              │
├──────────────────────────────────────────────────────────┤
│ Carrossel: Filmes (cards ~200px, 6-8 visiveis)           │
│ Carrossel: Séries                                        │
│ Carrossel: Documentários                                 │
│ OU grid 5-6 colunas quando filtro ativo                  │
├──────────────────────────────────────────────────────────┤
│ Sidebar tabs (Top Notas, Por Ano, Favoritos) inline      │
└──────────────────────────────────────────────────────────┘
```

**Mobile: Refinamento do layout atual**
- Manter estrutura de carrossel horizontal + bottom nav
- Melhorar hero com aspect ratio mais cinematografico
- Cards um pouco maiores (w-[150px])

**Pagina de Detalhes Desktop:**
```text
┌──────────────────────────────────────────────────────────┐
│ Backdrop fullwidth (h-[450px])                           │
├──────────────────────────────────────────────────────────┤
│ Poster (esq) │ Info + Botoes + Streaming (dir, 2 cols)   │
│              │ Generos, Nota, Ano, Duracao                │
│              │ [Ver Trailer] [Assistir] [Compartilhar]    │
│              │ Onde Assistir (providers inline)           │
├──────────────┴───────────────────────────────────────────┤
│ Sinopse (60%)              │ Info Tecnica (40%)          │
│ Beneficios                 │ Elenco grid 4 cols          │
├────────────────────────────┴─────────────────────────────┤
│ Trailer (aspect-video)  │  Similares (carrossel)         │
├─────────────────────────┴────────────────────────────────┤
│ Comentarios + Avaliacoes (tabs)                          │
└──────────────────────────────────────────────────────────┘
```

### Arquivos a modificar

**1. `src/pages/JuriFlix.tsx`** — Reescrever com layout condicional
- Desktop: remover bottom nav propria, hero fullwidth h-[400px], cards w-[200px], grid 5-6 colunas no filtro, tabs Top Notas/Por Ano/Favoritos como secoes inline (nao bottom nav), busca no header ao lado das tabs
- Mobile: refinar hero, cards w-[150px], manter bottom nav, manter carrosseis

**2. `src/pages/JuriFlixDetalhesEnhanced.tsx`** — Layout responsivo
- Desktop: backdrop maior, layout 2 colunas (poster + info lado a lado com mais espaco), streaming providers em grid 3 cols, sinopse + info tecnica side-by-side, elenco grid 5-6 cols, trailer + similares lado a lado
- Mobile: manter layout atual com ajustes de spacing

**3. `src/components/JuriFlixCard.tsx`** — Aceitar prop `size` para variar entre mobile/desktop

### Detalhes tecnicos

- Usar `useDeviceType` para condicionar layouts
- Desktop: remover header sticky proprio (o DesktopTopNav global ja existe via Layout)
- Desktop: remover bottom nav (tabs viram inline no conteudo)
- Cards desktop: hover com scale + shadow mais pronunciado, sinopse visivel no hover
- Hero desktop: usar `backdrop_path` quando disponivel (imagem landscape), fallback para poster
- Manter toda a logica de dados, queries, favoritos, cache intacta

### O que NAO muda
- Queries Supabase, hooks, tipos, rotas
- Componentes auxiliares (JuriflixComentariosSection, AvaliacaoSection, FavoritoButton, ShareModal)
- Funcionalidades (favoritos, comentarios, avaliacoes, compartilhar, enriquecer TMDB)
- JuriflixBottomNav.tsx no mobile (se estiver sendo usado em outra rota)

