

## Plano: Corrigir erro de deploy no Vercel (ERESOLVE)

### Problema
O `npm install` no Vercel falha com `ERESOLVE` — conflitos de peer dependencies entre pacotes. O Lovable sandbox usa configuracoes mais permissivas, mas o Vercel usa `npm install` padrao que e estrito.

### Solucao
Criar um arquivo `.npmrc` na raiz do projeto com `legacy-peer-deps=true` para que o Vercel ignore conflitos de peer dependencies durante a instalacao.

### Mudanca

**1. Criar `.npmrc`** (raiz do projeto)
```
legacy-peer-deps=true
```

Isso e a forma padrao de resolver conflitos ERESOLVE no Vercel sem alterar nenhuma dependencia. Uma unica linha resolve o problema.

### O que NAO muda
- `package.json`, dependencias, versoes
- Vite config, build config
- Nenhum codigo da aplicacao

