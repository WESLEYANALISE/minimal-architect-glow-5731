

## Plano: Pré-carregar Leis no Startup do App

### Problema
Quando o usuário entra na Constituição ou qualquer código, o `useProgressiveArticles` precisa:
1. Abrir IndexedDB → verificar cache → se vazio, buscar primeiro chunk (200 artigos) → depois carregar o resto em background

Isso causa delay de 2-5 segundos na primeira visita. O `useHomePreloader` já pré-carrega tabelas da home (notícias, capas, cursos), mas **não pré-carrega nenhuma lei/código**.

### Solução
Adicionar uma fase de pré-carregamento de leis no `useHomePreloader` que roda em background após os dados da home, preenchendo o cache IndexedDB que o `useProgressiveArticles` já usa. Quando o usuário entrar na Constituição ou qualquer código, o cache já estará populado e a exibição será instantânea.

### Implementação

**Arquivo: `src/hooks/useHomePreloader.ts`**

Adicionar uma nova função `preloadLegislation()` que:
- Define as tabelas prioritárias de legislação (CF, CP, CC, CPC, CPP, CLT, CDC, CTN, ECA)
- Para cada tabela, verifica se já existe no IndexedDB (`vade-mecum-db` → store `articles`)
- Se não existe, busca todos os artigos em chunks de 500 usando `.range()` e salva no IndexedDB com o mesmo formato/chave que o `useProgressiveArticles` usa
- Roda com `requestIdleCallback` após o preload principal (fase 2, ~10s depois do app abrir)
- Prioriza CF e CP primeiro (mais acessados), depois os demais

A chave de cache usada pelo `useProgressiveArticles` é: `{tableName}:{idMin}:{idMax}` — para a CF com seções, são duas chaves separadas (cf body e adct). Para os demais códigos sem filtro de ID, a chave é `{tableName}:min:max`.

```text
Fluxo:
App abre → useHomePreloader
  Fase 1 (imediata): dados da home (já existe)
  Fase 2 (~8s): pré-carregar leis prioritárias em IndexedDB
    CF body (id < 273)
    CF adct (id >= 273)  
    CP, CC, CPC, CPP, CLT, CDC, CTN, ECA
```

### Arquivos modificados
| Arquivo | Alteração |
|---|---|
| `src/hooks/useHomePreloader.ts` | Adicionar `preloadLegislation()` chamada após preload principal |

