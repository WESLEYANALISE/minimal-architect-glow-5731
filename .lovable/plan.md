

## Plano: Auditoria de Performance e Compatibilidade da Tela de Assinatura/Pagamento

### Problemas Identificados

#### 1. SDKs desnecessarios carregados (MercadoPago + PagBank)
O `usePaymentSDK.ts` carrega SDKs do MercadoPago e PagBank (~200KB+ combinados) na pagina `EscolherPlano`, mas o pagamento real usa **Asaas** via Edge Functions. Esses scripts sao **codigo morto** que bloqueiam largura de banda e podem causar erros em ambientes restritos (iframe com CSP rigorosa).

#### 2. Fetch de IP externo bloqueante no checkout
No `CheckoutCartao.tsx` (linha 474), antes de submeter o pagamento, faz `fetch('https://api.ipify.org')` para obter IP. Em iframes com CSP restritiva ou redes lentas, isso pode **travar o checkout por 5-10s** ou falhar silenciosamente.

#### 3. Clipboard sem fallback seguro em 39 arquivos
Encontrei 39 arquivos usando `navigator.clipboard.writeText()` diretamente sem o fallback seguro de `src/lib/utils.ts`. Em iframes sem `allow-clipboard-write`, o botao "Copiar codigo PIX" falha silenciosamente — o usuario pensa que copiou mas nao copiou.

#### 4. Polling agressivo no PixPaymentScreen (3s)
O `PixPaymentScreen.tsx` faz `refreshSubscription()` a cada 3 segundos. Isso gera ~20 queries/minuto ao Supabase. Combinado com o listener Realtime que ja existe, o polling e redundante e desperdiça recursos.

#### 5. CEP lookup via Edge Function no checkout
O `handleCepChange` (linha 399) chama `supabase.functions.invoke('geocode-cep')` a cada CEP completo digitado. Em iframe, essa chamada pode falhar se o Supabase client nao tiver sessao ativa (cookie bloqueado).

#### 6. AssinaturaWebView usa iframe para checkout externo
O `AssinaturaWebView.tsx` renderiza um `<iframe>` apontando para URLs externas de checkout. Em Safari/iOS, iframes de terceiros tem cookies bloqueados por padrao, podendo quebrar o fluxo de pagamento do gateway.

---

### Implementacao

#### Etapa 1 — Remover SDKs mortos
**`src/hooks/usePaymentSDK.ts`**: Esvaziar o hook (return void) ou remover completamente. Os scripts do MercadoPago e PagBank nao sao usados — todo pagamento vai via Edge Functions do Asaas.

**`src/pages/EscolherPlano.tsx`**: Remover a chamada `usePaymentSDK()`.

#### Etapa 2 — Tornar fetch de IP nao-bloqueante
**`src/components/assinatura/CheckoutCartao.tsx`**: Mover o `fetch('https://api.ipify.org')` para fora do fluxo de submit. Pre-carregar o IP ao montar o componente com `useEffect` + timeout de 3s. Se falhar, enviar `undefined` — o backend ja trata isso.

#### Etapa 3 — Unificar clipboard com fallback seguro
**`src/components/assinatura/PixPaymentScreen.tsx`** e demais arquivos que usam `navigator.clipboard` direto: Substituir por `copyToClipboard()` de `src/lib/utils.ts` que ja tem fallback via `document.execCommand` e funciona em iframes.

#### Etapa 4 — Reduzir polling do PIX
**`src/components/assinatura/PixPaymentScreen.tsx`**: Como ja existe listener Realtime (linhas 75-110), aumentar o intervalo de polling de 3s para 10s como fallback. O Realtime detecta o pagamento instantaneamente.

#### Etapa 5 — CEP lookup com fallback gracioso
**`src/components/assinatura/CheckoutCartao.tsx`**: Envolver o `geocode-cep` em try/catch com timeout de 3s. Se falhar (iframe/rede), simplesmente nao mostrar endereco — o CEP em si ja e suficiente para o pagamento.

#### Etapa 6 — AssinaturaWebView com deteccao de iframe
**`src/components/AssinaturaWebView.tsx`**: Quando `isInIframe` for true, abrir URL de checkout em `window.open()` (nova aba) em vez de iframe dentro de iframe (duplo embedding). Adicionar listener `postMessage` para detectar retorno.

---

### Arquivos a modificar (7)

1. **`src/hooks/usePaymentSDK.ts`** — Remover carregamento de SDKs mortos
2. **`src/pages/EscolherPlano.tsx`** — Remover `usePaymentSDK()`
3. **`src/components/assinatura/CheckoutCartao.tsx`** — IP pre-carregado + CEP com timeout
4. **`src/components/assinatura/PixPaymentScreen.tsx`** — Polling 10s + clipboard seguro
5. **`src/components/AssinaturaWebView.tsx`** — Abrir em nova aba quando em iframe
6. **`src/components/assinatura/PaymentMonitor.tsx`** — Polling 10s (ja tem Realtime)
7. **`src/lib/utils.ts`** — Nenhuma mudanca (ja tem fallback correto, serve de referencia)

### O que NAO muda
- Edge Functions (Asaas, PIX, cartao)
- Rotas, layout, design
- Logica de subscription/premium
- Facebook Pixel tracking
- Funcionalidades de pagamento

