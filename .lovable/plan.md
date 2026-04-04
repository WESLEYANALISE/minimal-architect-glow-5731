

# Sistema de Temas Visuais com Seletor no Admin

## Resumo

Criar **4 presets de tema** baseados na paleta vermelho/rose dos cards "Estudos no Computador", com um seletor no painel Admin para alternar entre eles em tempo real. Cada tema modifica as CSS variables do design system (`--card`, `--background`, `--primary`, `--accent`, `--border`, etc.).

---

## Os 4 Temas

| Tema | Descrição | Estilo base |
|------|-----------|-------------|
| **Neutro** (atual) | Cinza puro + vermelho accent | `--card: 0 0% 11%`, `--primary: 0 72% 42%` |
| **Cards & Botões** | Cards com gradiente vermelho escuro, botões rose/red | `--card: 0 30% 11%`, bordas com tint vermelho |
| **Fundos de Seção** | Containers e seções com fundo vermelho profundo | `--muted: 0 25% 10%`, `--secondary: 0 20% 12%` |
| **Full Red** | Tudo com tint vermelho — cards, fundos, borders, badges | Combina os dois acima + `--border: 0 15% 18%` |

---

## Arquitetura

### 1. CSS Variables por tema (`src/index.css`)
Definir 4 classes de tema (`:root`, `.theme-cards`, `.theme-sections`, `.theme-full-red`) com variações das CSS variables. A troca aplica a classe no `<html>`.

### 2. Context de Tema (`src/contexts/ThemeContext.tsx`)
- Estado do tema ativo (salvo no `localStorage` + tabela Supabase `app_settings`)
- Função `setTheme(preset)` que aplica a classe CSS e persiste
- Provider no `App.tsx`

### 3. Página Admin — Seletor de Tema (`src/pages/Admin/AdminTemas.tsx`)
- 4 cards de preview com miniatura visual de cada tema
- Ao clicar, aplica o tema instantaneamente
- Botão "Salvar como padrão" grava no Supabase para todos os usuários

### 4. Rota + Link no AdminHub
- Nova rota `/admin/temas`
- Card no `AdminHub.tsx` com ícone `Palette`

---

## Detalhes Técnicos

### CSS Variables por tema (adições no `index.css`)

```css
/* Tema atual = padrão (sem classe extra) */

.theme-cards {
  --card: 0 30% 11%;
  --border: 0 20% 16%;
  --input: 0 20% 13%;
  --popover: 0 28% 10%;
}

.theme-sections {
  --muted: 0 25% 10%;
  --secondary: 0 20% 12%;
  --background: 0 8% 7%;
}

.theme-full-red {
  --card: 0 30% 11%;
  --border: 0 15% 18%;
  --muted: 0 25% 10%;
  --secondary: 0 20% 12%;
  --background: 0 8% 7%;
  --input: 0 20% 13%;
  --popover: 0 28% 10%;
}
```

### Persistência
- `localStorage.setItem('app_theme', preset)`
- Supabase `app_settings` table (chave `active_theme`) para sincronizar entre dispositivos

### Arquivos modificados/criados
1. **Criar** `src/contexts/ThemeContext.tsx` — Provider + hook `useTheme()`
2. **Criar** `src/pages/Admin/AdminTemas.tsx` — Página de seleção visual
3. **Editar** `src/index.css` — 3 classes de tema adicionais
4. **Editar** `src/App.tsx` — Envolver com `ThemeProvider`
5. **Editar** `src/pages/Admin/AdminHub.tsx` — Adicionar card "Temas"
6. **Editar** roteamento para `/admin/temas`

