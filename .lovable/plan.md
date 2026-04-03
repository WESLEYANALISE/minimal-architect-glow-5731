

# Capas para Funções de Estudo + Reordenação de Seções

## O que será feito

### 1. Gerar 6 imagens de capa para as funções de estudo

Cada card do grid "Pratique Agora" (Aulas, Resumos, Flashcards, Questões, Biblioteca, Audioaulas) vai ganhar uma imagem de capa gerada programaticamente, mantendo a paleta de cores atual de cada card:

| Função | Paleta atual | Tema visual da capa |
|--------|-------------|---------------------|
| Aulas | Vermelho/bordô (`#b8334a → #6e1a2c`) | Livros abertos, lousa, ambiente acadêmico |
| Resumos | Verde-esmeralda (`#0f766e → #064e3b`) | Documentos organizados, marca-texto |
| Flashcards | Azul (`#1d4ed8 → #1e3a5f`) | Cards empilhados, memorização |
| Questões | Laranja (`#c2410c → #7c2d12`) | Alvo, checklist, prova |
| Biblioteca | Âmbar/dourado (`#92400e → #572508`) | Estantes de livros, biblioteca clássica |
| Audioaulas | Roxo (`#7b2d8e → #3d1547`) | Fones de ouvido, ondas sonoras |

As imagens serão geradas via canvas (Python/Pillow) com padrões geométricos, ícones vetoriais e gradientes que combinam com cada cor. Serão salvas como WebP em `src/assets/` e importadas nos componentes.

### 2. Atualizar `HomePratiqueSlide.tsx`

Cada card passará a exibir a imagem de capa como fundo, com overlay gradiente por cima para manter legibilidade do texto. O layout muda de "ícone + texto" para "imagem de fundo + overlay + ícone + texto" — similar ao que já existe no `PortalDeVideosSection`.

### 3. Mover "Estudos em Mídia" acima de "Estudos"

No `Index.tsx` (mobile), trocar a ordem das seções:
- **Antes**: EstudosViewCarousel → PortalDeVideosSection
- **Depois**: PortalDeVideosSection → EstudosViewCarousel

Linha ~597-606 do `Index.tsx` — inverter os dois blocos.

---

## Detalhes Técnicos

### Arquivos criados
- `src/assets/capa-aulas.webp`
- `src/assets/capa-resumos.webp`
- `src/assets/capa-flashcards.webp`
- `src/assets/capa-questoes.webp`
- `src/assets/capa-biblioteca.webp`
- `src/assets/capa-audioaulas.webp`

### Arquivos modificados
- **`src/components/home/HomePratiqueSlide.tsx`** — importar as 6 capas, adicionar imagem de fundo em cada card com overlay gradiente semitransparente
- **`src/pages/Index.tsx`** (~linha 596-606) — mover o bloco `PortalDeVideosSection` para antes do `EstudosViewCarousel`

### Estilo dos cards com capa
```
┌──────────────────┐
│  [imagem de capa] │  ← imagem WebP como background
│  ████████████████ │  ← overlay gradiente (mesmas cores atuais, ~60% opacidade)
│  [ícone]          │
│  Aulas            │
│  Estudos      ›   │
└──────────────────┘
```

