

## Plano: Corrigir Evelyn respondendo "problemas tecnicos" para audio/imagem/PDF

### Causa raiz

Os logs confirmam o problema. Quando um usuario envia midia (imagem, audio, PDF), a Evelyn tenta os 3 modelos e **todos falham**:

```
Tentando modelo=gemini-2.5-flash key=3       → 429 (rate limited)
Tentando modelo=gemini-2.0-flash-lite key=3   → erro (NAO suporta multimodal)
Modelo gemini-1.5-flash indisponível           → 404 (descontinuado)
Concluído: modelo= (vazio) → resposta fallback "dificuldades tecnicas"
```

**Problemas especificos:**
1. **`gemini-2.0-flash-lite`** nao suporta entrada multimodal (imagens, audio, PDFs) — so aceita texto
2. **`gemini-1.5-flash`** foi descontinuado pela Google e retorna 404
3. **`gemini-2.5-flash`** funciona mas quando da 429 (rate limit), nao tem fallback funcional

### Solucao

Atualizar a lista de modelos na Edge Function para usar modelos que suportam multimodal:

**Arquivo:** `supabase/functions/processar-mensagem-evelyn/index.ts`

**Mudanca na linha 111:**
```typescript
// ANTES
const MODELOS = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];

// DEPOIS
const MODELOS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite-preview"];
```

- **`gemini-2.5-flash`** — modelo principal, suporta multimodal
- **`gemini-2.0-flash`** — fallback robusto, suporta multimodal (sem o "lite")
- **`gemini-2.5-flash-lite-preview`** — fallback leve mais recente que suporta multimodal

Adicionalmente, melhorar o log de erro para capturar **por que** cada modelo falhou (status code + corpo), facilitando debug futuro.

### O que NAO muda
- Logica de download de midia (downloadMedia)
- System prompt, historico, formatacao
- Fluxo do webhook

