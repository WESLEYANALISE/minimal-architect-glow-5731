

## Auditoria de Compatibilidade: Plugins, Polyfills e Cross-Browser

### Resumo Executivo

Analisei o app inteiro em busca de problemas de compatibilidade com navegadores antigos (Safari 13+, Chrome 64+, iOS 13+), funcionamento em iframes, e estabilidade na tela de autenticacao. Encontrei **7 problemas criticos** e **4 melhorias recomendadas**.

---

### PROBLEMAS CRITICOS ENCONTRADOS

#### 1. Supabase Client NAO usa capacitorStorage (BUG ATIVO)

O arquivo `src/integrations/supabase/client.ts` usa `localStorage` diretamente, ignorando o `capacitorStorage` que foi criado especificamente para persistir sessao no mobile nativo. Isso causa **logouts inesperados** em iOS/Android quando o SO limpa memoria.

```text
ATUAL:   storage: localStorage
CORRETO: storage: capacitorStorage (de src/lib/capacitorStorage.ts)
```

**Impacto**: Usuarios mobile perdem sessao apos o app ficar em background.

#### 2. `@vitejs/plugin-legacy` versao 8 com config incompleta

O plugin legacy esta configurado mas falta o parametro `modernPolyfills` para garantir que Safari 13-15 receba polyfills de APIs modernas que o app usa (como `structuredClone`, `AbortController.prototype.reason`, `Array.prototype.at`).

**Correcao**: Adicionar `modernPolyfills: true` para polyfill automatico do bundle moderno em Safari 13-15.

#### 3. CSP (Content Security Policy) bloqueando recursos em iframe

A meta tag CSP no `index.html` tem `frame-ancestors` implicito (via `X-Frame-Options: SAMEORIGIN`) que **impede o app de funcionar dentro de iframes de terceiros**. Alem disso, falta o dominio do Lovable preview e possiveis dominios de embed.

**Correcao**: Remover `X-Frame-Options` meta tag (nao funciona via meta tag de qualquer forma — so via header HTTP) e adicionar dominios necessarios ao CSP `frame-src`.

#### 4. Autenticacao em iframe: cookies de terceiros bloqueados

Safari (todas as versoes) e Chrome 120+ bloqueiam cookies de terceiros em iframes. O Supabase auth usa `localStorage` que funciona, MAS o fluxo de `resetPasswordForEmail` redireciona para uma URL externa que, dentro de um iframe, pode falhar silenciosamente.

**Correcao**: O fluxo de recovery via OTP (codigo de 6 digitos) ja esta implementado e funciona em iframes. Garantir que esse seja o unico fluxo oferecido quando `window.self !== window.top` (iframe detectado).

#### 5. Falta polyfill de `scrollTo({ behavior: 'smooth' })` para Safari 13-14

O app usa `scrollTo({ behavior: 'smooth' })` em `src/lib/utils.ts` e outros locais. Safari 13-14 nao suporta `behavior: 'smooth'` — faz scroll instantaneo sem erro, mas quebra a UX.

**Correcao**: O `@vitejs/plugin-legacy` com `modernPolyfills: true` cobre isso automaticamente via `smoothscroll-polyfill`.

#### 6. `navigator.clipboard` sem fallback adequado em iframe

O `copyToClipboard` em `src/lib/utils.ts` tem um fallback com `document.execCommand('copy')`, que esta **deprecated** e falha em iframes com sandbox restrito. O fallback funciona, mas quando o iframe tem `sandbox` sem `allow-same-origin`, ambos os metodos falham silenciosamente.

**Correcao**: Ja tem fallback razoavel. Adicionar `allow-clipboard-write` quando o app e embeddado em iframes controlados.

#### 7. PWA Service Worker conflita com iframe embedding

O `vite-plugin-pwa` com `skipWaiting: true` e `clientsClaim: true` pode causar reloads inesperados quando o app roda dentro de um iframe, pois o novo SW assume controle e forca refresh.

**Correcao**: Adicionar logica para desabilitar auto-update do SW quando em iframe (`if (window.self === window.top)`).

---

### MELHORIAS RECOMENDADAS

#### A. Adicionar `detectBrowser()` utility para fallbacks condicionais

Criar um utilitario que detecta Safari/iOS/Chrome versao para aplicar fallbacks especificos (ex: desabilitar backdrop-filter em Safari < 15, usar CSS simples).

#### B. Adicionar `modernPolyfills` no plugin-legacy

```typescript
legacy({
  targets: ['defaults', 'not IE 11', 'safari >= 13', 'chrome >= 64', 'iOS >= 13'],
  modernPolyfills: true, // ADICIONAR
})
```

Isso adiciona ~15KB gzipped de polyfills ao bundle moderno, cobrindo:
- `Array.prototype.at()` (Safari < 15.4)
- `structuredClone` (Safari < 15.4)
- `Object.hasOwn` (Safari < 15.4)
- `crypto.randomUUID` (Safari < 15.4)
- Smooth scroll behavior

#### C. Configurar `detectFrameContext()` para autenticacao

Detectar automaticamente se o app esta em iframe e ajustar o fluxo de auth:
- Em iframe: usar apenas email+senha e OTP (sem redirecionamentos externos)
- Fora de iframe: fluxo completo disponivel

#### D. Adicionar `-webkit-` prefixos faltantes

O `autoprefixer` ja esta instalado, mas verificar que `backdrop-filter` sempre tenha `-webkit-backdrop-filter` como fallback (Safari 13-14 precisa do prefixo).

---

### PLANO DE IMPLEMENTACAO

**Arquivos a modificar:**

1. **`src/integrations/supabase/client.ts`** — Usar `capacitorStorage` em vez de `localStorage`
2. **`vite.config.ts`** — Adicionar `modernPolyfills: true` ao plugin-legacy
3. **`index.html`** — Remover meta tag `X-Frame-Options` (ineficaz via meta), ajustar CSP
4. **`src/lib/frameDetection.ts`** (NOVO) — Utilitario para detectar contexto iframe
5. **`src/pages/Auth.tsx`** — Desabilitar fluxos que dependem de redirecionamento externo quando em iframe
6. **`src/main.tsx`** — Condicionar registro do SW para evitar auto-reload em iframes
7. **`src/index.css`** — Garantir `-webkit-backdrop-filter` em classes que usam `backdrop-filter`

### O que NAO muda
- Funcionalidades existentes
- Layout mobile/desktop
- Edge Functions
- Rotas
- Dados e queries

