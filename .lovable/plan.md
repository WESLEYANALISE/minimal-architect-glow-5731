

## Plano: Remover Limite de 1000 Linhas no Conversor de Imagens

### Problema
O Supabase limita queries a 1000 linhas por padrão. O conversor mostra 18.299 imagens, mas muitas tabelas com mais de 1000 registros estão sendo truncadas silenciosamente.

Há dois pontos afetados:

1. **`carregarImagens()`** (linha 227-231) — busca `id` e coluna de imagem sem `.range()`, recebendo no máximo 1000 por tabela
2. **`carregarEconomia()`** (linha 189-191) — busca da tabela `cache_imagens_webp` também limitada a 1000

### Solução

Criar uma função auxiliar `fetchAllRows()` que faz paginação automática em blocos de 1000, iterando com `.range(from, to)` até receber menos que 1000 resultados. Aplicar nos dois pontos.

```text
fetchAllRows(tabela, coluna, filtros)
  página = 0
  todos = []
  loop:
    data = query.range(página*1000, (página+1)*1000-1)
    todos += data
    se data.length < 1000 → break
    página++
  retorna todos
```

### Arquivos modificados
| Arquivo | Alteração |
|---|---|
| `src/pages/ferramentas/ConverterImagens.tsx` | Adicionar `fetchAllRows()` e usá-la em `carregarImagens()` e `carregarEconomia()` |

