

## Plano: Animação slide-in da direita para esquerda em todas as páginas

### O que será feito
Trocar a animação atual de entrada de página (fade + scale) por um **slide da direita para esquerda**, criando o efeito de "push" usado em apps móveis nativos.

### Mudanças

**1. Atualizar keyframe `page-enter` no `tailwind.config.ts`**
- De: `opacity: 0, scale(0.98), translateY(4px)` → `opacity: 1, scale(1), translateY(0)`
- Para: `opacity: 0, translateX(30%)` → `opacity: 1, translateX(0)`
- Manter duração rápida (~250ms) com easing `ease-out` para fluidez

**2. Nenhuma mudança em `PageTransition.tsx` ou `Layout.tsx`**
- O componente já aplica `animate-page-enter` globalmente em todas as páginas (mobile e desktop)
- Como o `PageTransition` envolve todo o `children` no Layout, todas as funções (Estudos, Biblioteca, Legislação, etc.) já herdam a animação automaticamente

### Resultado
Toda navegação a partir do início — clicar em qualquer card, função, atalho — abrirá a nova página deslizando da direita para a esquerda, como um app nativo.

### Arquivos modificados
| Arquivo | Alteração |
|---|---|
| `tailwind.config.ts` | Atualizar keyframe `page-enter` para slide horizontal |

