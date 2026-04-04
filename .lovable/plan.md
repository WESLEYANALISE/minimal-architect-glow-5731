

## Plano: Criar Nova Tela de Assinatura (Preview no Admin)

### Objetivo
Criar uma nova página de assinatura do zero em `/admin/assinatura-nova`, usando os mesmos assets (imagem hero, logo), mesma lógica de pagamento (cartão, PIX, planos), mas com layout e design repensado. A página antiga (`/assinatura`) permanece intacta.

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `src/pages/AssinaturaNova.tsx` | **Criar** — Nova página de assinatura completa |
| `src/routes/adminRoutes.tsx` | **Modificar** — Adicionar rota `/admin/assinatura-nova` |

### Design da nova página

A nova página vai:
- Usar os mesmos assets: `assinatura-bg.webp`, `logo-direito-premium-new.png`
- Manter os mesmos 3 planos (Mensal R$21,90 / Anual R$149,90 / Vitalício R$249,90)
- Reutilizar os mesmos componentes de checkout: `CheckoutCartaoModal`, `PixPaymentScreen`, `PaymentMethodModal`
- Reutilizar os mesmos hooks: `useMercadoPagoPix`, `useFacebookPixel`, `useSubscriptionFunnelTracking`
- Incluir as mesmas verificações (login, isPremium → `AssinaturaGerenciamento`)
- Layout reconstruído do zero com seções organizadas de forma diferente

### Estrutura da nova página

1. **Hero** — Imagem de fundo full-width com logo e título "Acesso Prime"
2. **Banner trial** — Mostra status do trial (ativo ou expirado)
3. **Frase de impacto** — Texto motivacional aleatório
4. **Lista de benefícios** — Cards com ícones e descrições
5. **Seleção de planos** — 3 cards (Mensal, Anual, Vitalício)
6. **CTA principal** — Botão de assinar
7. **Garantia** — Texto de segurança
8. **Modais de pagamento** — Cartão, PIX, CPF input (mesmos componentes)

### Detalhes técnicos

- A nova página será uma cópia funcional da atual, recriada do zero como arquivo independente
- Rota admin: `/admin/assinatura-nova` para preview
- Quando aprovada, bastará trocar a rota `/assinatura` para apontar para a nova página e excluir a antiga

