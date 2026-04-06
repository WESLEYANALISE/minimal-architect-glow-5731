
## Plano: Investigar e corrigir a falha de deploy no Vercel

### Achados da investigação
- `package.json` já está com `@vitejs/plugin-legacy` fixado em `5.4.3`.
- `.npmrc` já existe com `legacy-peer-deps=true`.
- Mas `package-lock.json` está desalinhado do `package.json`: ele não reflete dependências que hoje existem no manifesto, incluindo `@vitejs/plugin-legacy`.
- Também existe `bun.lock` ainda carregando o range antigo `^5.4.0`, o que mostra drift entre lockfiles.
- O Vercel está buildando o commit `d4c1cbe`; se esse commit no GitHub não contém os arquivos corrigidos e sincronizados, o erro vai continuar.

### Causa provável
A falha está muito provavelmente na camada de dependências, não no código da aplicação:
1. o `package.json` foi corrigido;
2. o `package-lock.json` não foi atualizado junto;
3. o Vercel usa npm e depende desse lockfile para montar a árvore de instalação;
4. o repositório remoto pode ainda estar com uma versão antiga/incompleta da correção.

### O que ajustar
1. **Sincronizar os manifests**
   - manter `@vitejs/plugin-legacy: "5.4.3"` no `package.json`
   - manter `.npmrc` com `legacy-peer-deps=true`

2. **Regenerar o lockfile do npm**
   - recriar `package-lock.json` com base no `package.json` atual
   - garantir que o lockfile passe a incluir `@vitejs/plugin-legacy@5.4.3` e as demais dependências ausentes

3. **Padronizar o gerenciador para deploy**
   - usar npm como fonte de verdade no Vercel
   - evitar depender de um estado misto entre `package-lock.json` e `bun.lock`

4. **Garantir que o GitHub recebeu a correção**
   - confirmar que foram enviados ao repositório:
     - `package.json`
     - `package-lock.json`
     - `.npmrc`
   - só depois disso disparar novo deploy

5. **Revalidar no Vercel**
   - primeiro verificar se o build sai de `Installing dependencies...`
   - se surgir um novo erro depois disso, tratar o próximo conflito já com a instalação estabilizada

### Arquivos envolvidos
- `package.json`
- `package-lock.json`
- `.npmrc`
- opcionalmente `bun.lock` / `bun.lockb`

### Detalhes técnicos
- O principal sinal hoje é a inconsistência entre `package.json` e `package-lock.json`.
- Em especial, `@vitejs/plugin-legacy` está no manifesto, mas não aparece no lockfile npm atual.
- Isso explica por que o Vercel pode continuar resolvendo dependências de forma diferente do esperado, mesmo após a correção aparente no `package.json`.
