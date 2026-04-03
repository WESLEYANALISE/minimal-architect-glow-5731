
# Otimizações Vercel para o Direito Prime

## O que vamos instalar e configurar

### 1. `@vercel/speed-insights` — Monitoramento de Core Web Vitals
Pacote oficial que coleta métricas reais (LCP, FID, CLS, FCP, TTFB) dos seus usuários e exibe no dashboard da Vercel. Ajuda a identificar páginas lentas.

- Instalar o pacote npm
- Adicionar o componente `<SpeedInsights />` no `App.tsx`

### 2. `@vercel/analytics` — Web Analytics
Analytics leve e privacy-friendly da Vercel (sem cookies). Mostra visitantes, pageviews, referrers, países — complementa o GTM que você já tem.

- Instalar o pacote npm
- Adicionar o componente `<Analytics />` no `App.tsx`

### 3. Headers de Cache otimizados no `vercel.json`
Configurar headers HTTP para que o CDN da Vercel cache seus assets de forma agressiva:

- **Assets com hash** (JS, CSS do Vite): `max-age=31536000, immutable` — cache de 1 ano, nunca revalida
- **Imagens/fontes**: `max-age=86400, stale-while-revalidate=604800` — 1 dia fresh + 7 dias stale
- **HTML**: `max-age=0, must-revalidate` — sempre busca a versão mais recente
- **Service Worker**: `max-age=0, must-revalidate` — garante atualização imediata

### 4. Headers de segurança no `vercel.json`
Mover os headers de segurança que hoje estão em meta tags (CSP, X-Frame-Options, etc.) para headers HTTP reais no `vercel.json`. Headers HTTP são mais confiáveis e performáticos que meta tags.

### 5. Compressão automática
A Vercel já aplica Brotli e Gzip automaticamente no CDN. Isso significa que os plugins `vite-plugin-compression` no `vite.config.ts` são **redundantes** para deploys na Vercel — geram arquivos `.br` e `.gz` que a Vercel ignora. Podemos removê-los para acelerar o build.

---

## Detalhes técnicos

### Arquivos modificados

**`package.json`** — adicionar dependências:
```
@vercel/speed-insights
@vercel/analytics
```

**`src/App.tsx`** — adicionar componentes:
```tsx
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
// No JSX, junto aos outros componentes globais:
<SpeedInsights />
<Analytics />
```

**`vercel.json`** — expandir com headers:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff|woff2))",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=86400, stale-while-revalidate=604800" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**`vite.config.ts`** — remover os dois plugins `viteCompression` (Brotli + Gzip) e o import de `vite-plugin-compression`, já que a Vercel comprime automaticamente no edge.

### Impacto esperado
- **Build mais rápido**: sem gerar arquivos `.br`/`.gz` desnecessários
- **Cache CDN agressivo**: assets com hash nunca são re-baixados
- **Visibilidade**: Core Web Vitals reais no dashboard Vercel
- **Segurança**: headers HTTP reais em vez de meta tags
