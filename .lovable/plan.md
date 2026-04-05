

## Plano: Sidebar de historico de conversas no Chat Professora (estilo ChatGPT)

### Problema
A pagina `/chat-professora` mostra apenas o chat centralizado sem historico de conversas. O usuario quer ver uma lista lateral esquerda com conversas anteriores agrupadas por data, como no ChatGPT.

### Solucao

No desktop (lg+), adicionar sidebar esquerda com historico de conversas. No mobile, manter layout atual com um botao para abrir o historico em drawer/sheet.

```text
Desktop:
┌──────────────┬──────────────────────────────────────┐
│  + Nova conv │  Header (Professora / Estudar)       │
│  ──────────  │  ────────────────────────────────────│
│  Hoje        │                                      │
│  · Conv 1    │  Chat messages                       │
│  · Conv 2    │                                      │
│  Ontem       │                                      │
│  · Conv 3    │                                      │
│  Anteriores  │                                      │
│  · Conv 4    │  Input                               │
└──────────────┴──────────────────────────────────────┘
```

### Mudancas

**1. `src/pages/ChatProfessora.tsx`**

- Importar e usar `useProfessoraConversations` (ja existe o hook completo)
- No desktop: layout `grid grid-cols-[280px_1fr]` envolvendo sidebar + card de chat
- Sidebar esquerda com:
  - Botao "Nova conversa" no topo
  - Lista de conversas agrupadas por data (`groupedConversations()`)
  - Cada item mostra titulo truncado, hover highlight, botao delete
  - Item ativo com borda/fundo destacado
- Ao clicar numa conversa: carregar mensagens via `loadConversationMessages`, popular o chat
- Ao enviar primeira mensagem de nova conversa: `createConversation` automaticamente
- Integrar persistencia: salvar mensagens na tabela `chat_professora_historico` com `conversation_id`
- No mobile: botao de historico no header que abre Sheet/Drawer com a mesma lista

**2. Integracao com `useStreamingChat`**
- Ao selecionar conversa existente, carregar mensagens e popular o estado do hook
- Ao iniciar nova conversa, resetar mensagens
- Ao receber resposta, atualizar `updated_at` da conversa

### O que NAO muda
- `useStreamingChat` (logica de streaming)
- `useProfessoraConversations` (hook ja pronto)
- Edge Functions de chat
- Layout mobile do chat em si
- Componentes de mensagem (`ChatMessageNew`, `ChatInputNew`)

