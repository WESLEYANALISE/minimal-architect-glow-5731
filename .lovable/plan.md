

## Plano: Reconstruir pagina de assinatura do zero

### Contexto

Existem **3 paginas de assinatura** no codigo:
- `AssinaturaNova.tsx` (430 linhas) — v2, atualmente mapeada em `/assinatura`
- `Assinatura.tsx` (523 linhas) — v1 antiga
- `EscolherPlano.tsx` (327 linhas) — outra versao antiga

Alem de **20 componentes** em `src/components/assinatura/` (modais de pagamento, PIX, cartao, etc).

### O que sera feito

1. **Apagar** `AssinaturaNova.tsx`, `Assinatura.tsx` e `EscolherPlano.tsx`
2. **Criar** um novo `src/pages/AssinaturaNova.tsx` do zero com design limpo e moderno
3. **Manter** todos os componentes de pagamento existentes (`CheckoutCartaoModal`, `PixPaymentScreen`, `PaymentMethodModal`, `CheckoutCartao`) — eles funcionam e serao reutilizados
4. **Manter** hooks existentes (`useMercadoPagoPix`, `useSubscriptionFunnelTracking`, `useFacebookPixel`, etc.)
5. **Remover** rota `/escolher-plano` do `App.tsx` (codigo morto)

### Nova pagina — estrutura

A nova pagina tera:

- **Header minimalista**: logo + titulo "Acesso Prime"
- **Secao de beneficios**: grid 2 colunas com icones e numeros (Vade Mecum 2026, +136 mil questoes, etc.)
- **Cards de planos**: 3 cards lado a lado (Mensal R$21,90 / Anual R$149,90 / Vitalicio R$249,90) com cores tematicas (azul, amber, roxo)
- **Botao CTA**: cor muda conforme plano selecionado
- **Garantia**: selo de 7 dias
- **Se ja for Premium**: mostra `AssinaturaGerenciamento`

Fluxo de pagamento: CTA abre direto o `CheckoutCartaoModal` (cartao priorizado). PIX disponivel via input de CPF.

### Arquivos modificados

1. **APAGAR** `src/pages/Assinatura.tsx`
2. **APAGAR** `src/pages/EscolherPlano.tsx`
3. **REESCREVER** `src/pages/AssinaturaNova.tsx` — novo design do zero
4. **EDITAR** `src/App.tsx` — remover import e rota de `EscolherPlano`

### O que NAO muda
- Componentes de pagamento (`CheckoutCartaoModal`, `PixPaymentScreen`, `CheckoutCartao`, `PaymentMethodModal`)
- Hooks (`useMercadoPagoPix`, `useSubscriptionFunnelTracking`, etc.)
- `AssinaturaGerenciamento` (tela para quem ja e premium)
- `AssinaturaCheckout`, `AssinaturaCallback`
- Edge Functions de pagamento (Asaas)
- Rotas admin
- Contextos de subscription

