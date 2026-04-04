

## Plano: Mostrar DesktopTopNav em todas as rotas

### Problema
A linha 478 do `Layout.tsx` esconde o `DesktopTopNav` em todas as páginas exceto home, chat-professora e vade-mecum. Resultado: páginas internas (Audioaulas, Flashcards, etc.) ficam sem o cabeçalho com as abas de navegacao (Estudos, Biblioteca, Legislacao, Flashcards, Questoes, Perfil).

O `DesktopTopNav.tsx` ja tem a logica correta: mostra logo na home e botao de voltar nas demais paginas. So precisa deixar ele visivel sempre.

### Mudanca

**`src/components/Layout.tsx`**
1. Remover a variavel `hideDesktopTopNav` (linha 478) — o `DesktopTopNav` passa a ser renderizado **sempre** no desktop
2. Remover o bloco da "barra de navegacao compacta" (linhas 532-544) — nao e mais necessario pois o `DesktopTopNav` ja cumpre esse papel
3. Ajustar a condicao do breadcrumb que depende de `hideMainSidebar` se necessario

Resultado: todas as rotas internas mostrarao o cabeçalho completo com as 5 abas + Perfil, e o botao de voltar no lugar do logo.

