

## Plano: Refazer Noticia Detalhes — conteudo pronto + markdown correto

### Problemas identificados

1. **Carregamento lento**: Quando o usuario clica numa noticia, o `NoticiaDetalhes.tsx` verifica se `conteudo_formatado + analise_ia + termos_json` estao todos no cache. Se faltar qualquer um, chama a Edge Function `processar-noticia-juridica` que busca HTML, chama Gemini, e processa — demora 10-30 segundos mostrando "Carregando e processando..."

2. **Markdown nao renderiza**: O `conteudo_formatado` contem markdown (`###`, `**`, `•`, `---`) mas a funcao `renderizarConteudoFormatado()` apenas faz split por `\n` e renderiza como `<p>` tags de texto puro. Resultado: o usuario ve `### Titulo` como texto literal

3. **Edge Function inexistente no fluxo**: A funcao `processar-noticia-juridica` existe mas e chamada sob demanda quando o usuario abre a noticia — deveria ser pre-processada

### Solucao

**Principio**: A noticia deve aparecer **instantaneamente** quando o usuario clica. Se o conteudo formatado ja existe no cache, mostrar direto. Se nao existe, mostrar o `conteudo_completo` (texto bruto) ou a `descricao` como fallback imediato — sem esperar processamento IA.

**Mudancas no `NoticiaDetalhes.tsx`:**

1. **Substituir `renderizarConteudoFormatado()`** por `ReactMarkdown` com `remarkGfm` — assim `###`, `**`, `---`, listas renderizam corretamente como HTML estilizado

2. **Remover o fluxo de processamento sob demanda**: Nao chamar mais `processar-noticia-juridica` quando o usuario abre a noticia. Apenas buscar do cache o que ja existe (`conteudo_formatado`, `conteudo_completo`, `analise_ia`, `termos_json`)

3. **Fallback inteligente sem espera**:
   - Se tem `conteudo_formatado` → renderizar com ReactMarkdown
   - Se so tem `conteudo_completo` → renderizar texto limpo
   - Se nao tem nenhum → mostrar `descricao` + botao "Abrir no navegador"
   - Nunca mostrar loading de processamento

4. **Buscar `conteudo_formatado` e `conteudo_completo` ja na listagem**: Adicionar esses campos ao select da query em `NoticiasJuridicas.tsx` e passar via `location.state` — assim quando o usuario chega na pagina de detalhes, o conteudo ja esta disponivel sem query adicional

5. **Estilizar markdown corretamente**: Usar classes `prose prose-sm dark:prose-invert` no container do ReactMarkdown para garantir tipografia bonita (headings, bold, listas, separadores)

### Arquivos a modificar

1. **`src/pages/NoticiaDetalhes.tsx`** — Substituir `renderizarConteudoFormatado` por ReactMarkdown, remover chamada a Edge Function, implementar fallback imediato, adicionar estilos prose
2. **`src/pages/NoticiasJuridicas.tsx`** — Adicionar `conteudo_formatado, conteudo_completo` ao select da query para passar no state

### O que NAO muda
- Edge Functions (continuam processando em background via cron)
- Tabelas do banco
- Rotas
- Layout mobile/desktop
- Funcionalidade de analise IA (aba "Analise" continua usando dados do cache)
- Funcionalidade de termos juridicos

