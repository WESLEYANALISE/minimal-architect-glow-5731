

## Plano: Corrigir brasão, aplicar Modo Realeza e otimizar performance no CodigoView

### Problemas identificados

1. **Brasão com fundo verde**: A imagem `brasao-republica.webp` tem fundo verde embutido. O `LeiHeader` exibe sem tratamento. Existe `brasao-brasil-hd.webp` e `brasao-brasil.webp` como alternativas — verificar qual tem fundo transparente. Se nenhum tiver, aplicar `mix-blend-mode: luminosity` ou trocar por versão sem fundo.

2. **Sem Modo Realeza**: O `CodigoView.tsx` mobile usa `bg-background` genérico, sem DotPattern, sem gradientes bordô, sem acentos dourados, sem Playfair Display. Falta a estética premium que ja existe em Questões, Flashcards, Resumos e Vade Mecum.

3. **Performance ao abrir artigo**: O drawer (`ArtigoFullscreenDrawer`) ja tem `skipInitialAnimation={true}`, mas o clique no artigo aciona `registrarVisualizacao` (INSERT no Supabase) de forma síncrona antes de abrir — isso pode causar micro-delay. Mover para `requestIdleCallback` ou `setTimeout(0)`.

---

### Implementação

#### 1. Corrigir brasão (LeiHeader.tsx)
- Adicionar `className="mix-blend-mode: luminosity"` ou usar CSS `filter: drop-shadow()` com fundo circular escuro por trás para mascarar o verde
- Alternativa mais limpa: usar a versão HD (`brasao-brasil-hd.webp`) se tiver fundo transparente, senão aplicar `mix-blend-luminosity` no img

#### 2. Aplicar Modo Realeza no CodigoView.tsx (mobile)
- Trocar `bg-background` por gradiente bordô: `background: linear-gradient(to bottom, hsl(345, 65%, 30%), hsl(350, 40%, 15%))`
- Adicionar `DotPattern` no fundo com opacidade baixa
- Ajustar `LeiHeader` para usar tipografia `Playfair Display` no título
- Cards de artigo: bordas douradas sutis `hsla(40, 60%, 50%, 0.12)`
- Botões/tabs com acentos dourados
- Linha decorativa dourada no header

#### 3. Atualizar LeiHeader.tsx para estética Realeza
- Bordas douradas ao redor do brasão: `border: 2px solid hsla(40, 60%, 50%, 0.25)`
- Título em Playfair Display
- Linha decorativa de `bg-accent` para dourado `hsl(40, 80%, 55%)`
- Glow sutil dourado no brasão em vez de `bg-accent/20`

#### 4. Otimizar abertura de artigo
- Mover `registrarVisualizacao` para dentro de `requestIdleCallback` ou `setTimeout(() => ..., 0)` para não bloquear a abertura do drawer
- Garantir que `setDrawerOpen(true)` e `setSelectedArticle` executem antes do INSERT

---

### Arquivos a modificar

1. **`src/components/LeiHeader.tsx`** — Corrigir fundo verde do brasão (mix-blend-mode ou imagem alternativa), aplicar estética dourada
2. **`src/pages/CodigoView.tsx`** — Aplicar gradiente bordô + DotPattern no layout mobile, otimizar registrarVisualizacao para não bloquear drawer

### O que NAO muda
- Funcionalidades (busca, drawer, modais, playlist, ranking)
- Layout desktop (VadeMecumDesktopLayout)
- Rotas
- Dados e queries

