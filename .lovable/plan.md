

## Plano: Corrigir tela preta ao voltar dos flashcards

### Problema

Quando o usuario esta estudando um flashcard (inline via estado `estudarTema` dentro de `FlashcardsTemas`), o botao "Voltar" do Header faz navegacao por rota (`/flashcards/temas` → `/flashcards/areas`), em vez de simplesmente fechar o viewer inline (`setEstudarTema(null)`). Isso causa:

1. Desmontagem do componente lazy `FlashcardsTemas`
2. Remontagem via `Suspense` → tela preta/branca
3. Recarregamento completo dos dados

O componente `FlashcardsEstudar` e renderizado inline (sem mudanca de rota), mas o Header nao sabe disso — ele ve a rota `/flashcards/temas` e navega para `/flashcards/areas`.

### Solucao

Criar um mecanismo para o `FlashcardsTemas` interceptar a navegacao "voltar" quando esta no modo inline de estudo, fazendo `setEstudarTema(null)` em vez de navegar por rota.

### Mudancas

**1. `src/pages/FlashcardsTemas.tsx`**
- Registrar um callback global (via contexto ou window event) quando `estudarTema` esta ativo
- Usar `useEffect` para ouvir `popstate` ou expor callback via um ref/contexto que o Header possa consultar
- Abordagem mais simples: usar `window.__flashcardBackHandler` como callback temporario que o Header verifica antes de navegar

**2. `src/components/Header.tsx`**
- Em `handleBackNavigation`, antes de fazer `navigate(destination)`, verificar se existe `window.__flashcardBackHandler`
- Se existir, chamar o handler e retornar (sem navegar)
- Isso permite que qualquer pagina com sub-views inline intercepte o voltar

### Implementacao detalhada

```text
FlashcardsTemas.tsx:
  useEffect(() => {
    if (estudarTema) {
      window.__backInterceptor = () => setEstudarTema(null);
      return () => { delete window.__backInterceptor; };
    }
  }, [estudarTema]);

Header.tsx - handleBackNavigation:
  if (window.__backInterceptor) {
    window.__backInterceptor();
    return;
  }
  // ...resto da logica existente
```

### O que NAO muda
- Rotas, lazy loading, Suspense
- FlashcardsEstudar, FlashcardViewer
- Navegacao em todas as outras paginas
- Layout mobile/desktop

