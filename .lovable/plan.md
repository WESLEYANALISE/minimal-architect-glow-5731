

## Analise de Performance GTmetrix — Direito Prime

### Resultados Atuais

| Metrica | Valor | Status |
|---------|-------|--------|
| GTmetrix Grade | **D** | Ruim |
| Performance | **56%** | Ruim |
| Structure | **77%** | Razoavel |
| LCP (Largest Contentful Paint) | **5.0s** | Ruim (meta: < 2.5s) |
| TBT (Total Blocking Time) | **557ms** | Ruim (meta: < 200ms) |
| CLS (Cumulative Layout Shift) | **0.02** | Bom |

### Diagnostico: Por que esta lento?

**1. LCP de 5.0s — O maior problema**
O elemento LCP (provavelmente o hero banner ou imagem principal) demora muito para aparecer. Causas:
- **8 fontes Google Fonts** carregadas no index.html (Inter, Source Sans, Source Serif, Cinzel, Oswald, Crimson Text, Playfair Display, Merriweather) — mesmo com `media="print"`, o browser ainda precisa parsear e eventualmente carregar todas
- **Scripts bloqueantes no head**: GTM carrega sincronamente antes do conteudo
- **SDK Mercado Pago e PagBank** carregam no head de TODAS as paginas, mesmo que so sejam usados na tela de pagamento

**2. TBT de 557ms — JavaScript pesado**
O browser fica bloqueado processando JS por mais de meio segundo:
- Bundle grande com muitas dependencias (Recharts, Framer Motion, muitos componentes Radix)
- `AggressivePreloader` dispara imports de ~22 chunks logo apos o carregamento
- `useHomePreloader` faz multiplas queries ao Supabase simultaneamente no load
- Facebook Pixel SDK carrega no body e executa JS

**3. Scripts de terceiros competindo por recursos**
- GTM (sincrono no head)
- Facebook Pixel (no body, mas ainda bloqueia)
- Google Analytics (adiado, mas carrega apos 5s)
- Mercado Pago SDK + PagBank SDK (no head, `async` mas ainda baixa e parseia)

### Plano de Otimizacao (por impacto)

**A. Reduzir fontes (impacto alto no LCP)**
- Manter apenas **Inter** (usada em 95% do app) e **Cinzel** (usada no Vade Mecum)
- Remover Source Sans, Source Serif, Oswald, Crimson Text, Playfair Display, Merriweather do carregamento inicial
- Carregar fontes decorativas sob demanda apenas nas paginas que as utilizam

**B. Mover SDKs de pagamento para lazy load (impacto alto no TBT)**
- Remover `<script src="sdk.mercadopago.com">` e `<script src="pagseguro">` do index.html
- Carregar dinamicamente apenas quando o usuario acessa a tela de assinatura/pagamento

**C. Adiar GTM (impacto medio no LCP)**
- Trocar o GTM sincrono no `<head>` por carregamento adiado (apos 3s ou primeira interacao), similar ao que ja e feito com GA

**D. Reduzir preload agressivo (impacto medio no TBT)**
- Aumentar delay da Fase 1 do `AggressiveChunkPreloader` para 15s+ no mobile
- Reduzir queries simultaneas do `useHomePreloader` ou adia-las mais

**E. Otimizar hero/LCP element (impacto alto no LCP)**
- Garantir que a imagem hero tenha `fetchpriority="high"` e `<link rel="preload">` efetivo
- Considerar inline SVG ou CSS gradient como placeholder ate a imagem real carregar

**F. Reduzir CSS critico**
- O `<style>` inline no head esta bom, mas as fontes competem com ele

### Resumo de Impacto Esperado

| Acao | LCP | TBT | Esforco |
|------|-----|-----|---------|
| Reduzir fontes de 8 para 2 | -1.0s | -50ms | Baixo |
| Lazy load SDKs pagamento | — | -100ms | Baixo |
| Adiar GTM | -0.5s | -80ms | Baixo |
| Reduzir preloaders | — | -150ms | Medio |
| Otimizar hero LCP | -1.0s | — | Medio |

Com essas mudancas, o LCP pode cair para ~2.5-3.0s e o TBT para ~200ms, elevando a nota para B/C (70-80%).

### Detalhes tecnicos

- Arquivos modificados: `index.html`, `src/hooks/useAggressiveChunkPreloader.ts`, `src/hooks/useHomePreloader.ts`
- Novos arquivos: possivel hook `usePaymentSDK.ts` para lazy load dos SDKs
- Sem impacto visual — todas as mudancas sao de carregamento/performance

