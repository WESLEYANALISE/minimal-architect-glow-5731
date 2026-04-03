

# Plugins e Melhorias para Compatibilidade Cross-Device, iframe e Mobile

## Resumo

Depois de investigar o projeto, a internet e repositorios no GitHub, identifiquei **4 melhorias concretas** que faltam no seu projeto para funcionar melhor em todos os dispositivos, iframes e modelos de celular.

---

## 1. `tailwindcss-safe-area` — Safe Area para todos os celulares

**Problema atual**: Vocè usa `env(safe-area-inset-bottom)` manualmente em 31+ arquivos com `style={{ paddingBottom: 'env(...)' }}`. Isso e fragil, inconsistente e nao funciona sem `viewport-fit=cover` no meta tag (que esta faltando!).

**Solucao**: Instalar o plugin `tailwindcss-safe-area@0.8.0` (compativel com Tailwind v3) que adiciona classes utilitarias como `pb-safe`, `pt-safe`, `min-h-screen-safe`, etc.

**O que muda**:
- Adicionar `viewport-fit=cover` na meta tag viewport do `index.html`
- Instalar e configurar o plugin no `tailwind.config.ts`
- Substituir gradualmente os `style={{ paddingBottom: 'env(...)' }}` inline por classes `pb-safe`
- Funciona automaticamente em iPhones com notch, Dynamic Island, e Android com barra de navegacao gestual

---

## 2. `@vitejs/plugin-legacy` — Compatibilidade com navegadores antigos

**Problema atual**: O build usa `target: 'es2020'`, que exclui Safari < 14, Chrome < 80, e navegadores antigos de Android. Usuarios com celulares mais antigos veem tela branca.

**Solucao**: Instalar `@vitejs/plugin-legacy` que gera automaticamente polyfills e bundles alternativos para navegadores antigos.

**O que muda**:
- Instalar `@vitejs/plugin-legacy` e `terser` (dependencia)
- Configurar no `vite.config.ts` com targets: `['defaults', 'not IE 11', 'safari >= 13', 'chrome >= 64', 'iOS >= 13']`
- Gera automaticamente bundles legacy com polyfills so para quem precisa
- Usuarios modernos nao sao afetados (carregam o bundle otimizado normal)

---

## 3. CSS de Estabilidade de Viewport para iframe e Mobile

**Problema atual**: Quando o site roda em iframe (ex: preview do Lovable, webviews, redes sociais), o viewport pode se comportar de forma erratica, especialmente com teclado virtual no mobile.

**Solucao**: Adicionar regras CSS globais no `index.css`:

- `overscroll-behavior: none` no `html` e `body` — evita o "bounce" e pull-to-refresh acidental dentro de iframes
- `touch-action: manipulation` nos elementos interativos — remove o delay de 300ms de tap no mobile e evita zoom acidental em double-tap
- `@supports (height: 100dvh)` para usar `dvh` (dynamic viewport height) que se ajusta quando o teclado virtual abre/fecha no mobile

---

## 4. Meta tags extras para iframe e PWA

**O que falta no `index.html`**:
- `viewport-fit=cover` na meta viewport (necessario para safe areas)
- `<meta name="mobile-web-app-capable" content="yes">` (Chrome/Android PWA)
- `<meta name="format-detection" content="telephone=no">` — evita que o Safari transforme numeros em links de telefone automaticamente

---

## Detalhes Tecnicos

### Arquivos modificados

**`package.json`** — novas dependencias:
```
tailwindcss-safe-area@0.8.0
@vitejs/plugin-legacy
terser
```

**`tailwind.config.ts`** — adicionar plugin:
```ts
plugins: [
  require("tailwindcss-safe-area"),
  // ... plugins existentes
]
```

**`index.html`** — viewport meta atualizada:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
<meta name="mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no">
```

**`vite.config.ts`** — plugin legacy:
```ts
import legacy from '@vitejs/plugin-legacy';
// No array de plugins:
legacy({
  targets: ['defaults', 'not IE 11', 'safari >= 13', 'chrome >= 64', 'iOS >= 13'],
})
```

**`src/index.css`** — regras globais:
```css
html {
  overscroll-behavior: none;
}
body {
  overscroll-behavior: none;
  -webkit-text-size-adjust: 100%;
}
button, a, input, select, textarea, [role="button"] {
  touch-action: manipulation;
}
```

### Impacto esperado
- Safe areas funcionando corretamente em todos os iPhones e Androids com gestos
- Compatibilidade com Safari 13+, Chrome 64+, iOS 13+ (cobre 99%+ dos usuarios)
- Sem bounce/pull-to-refresh acidental em iframes
- Tap mais responsivo no mobile (sem delay de 300ms)
- Viewport estavel quando teclado virtual abre/fecha

