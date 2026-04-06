

## Plano: Corrigir erro de deploy Vercel (plugin-legacy incompativel)

### Problema
O deploy Vercel falha porque o `@vitejs/plugin-legacy` esta sendo resolvido como versao `8.0.1`, que exige `vite@^8.0.0`. O projeto usa Vite 5. Mesmo com `.npmrc` tendo `legacy-peer-deps=true`, o conflito persiste no GitHub — provavelmente o `package.json` no repositorio tem uma versao diferente (com caret `^` que permitiu upgrade para v8).

### Solucao

**1. Fixar versao exata do plugin-legacy no `package.json`**

Mudar de:
```
"@vitejs/plugin-legacy": "^5.4.0"
```
Para:
```
"@vitejs/plugin-legacy": "5.4.3"
```
(sem caret, versao exata compativel com Vite 5)

**2. Garantir `.npmrc` esta presente** (ja existe, apenas confirmar que sera commitado)

```
legacy-peer-deps=true
```

### Por que funciona
- A versao exata `5.4.3` impede o npm de resolver para v8
- O `.npmrc` serve como fallback para outros conflitos menores

### O que NAO muda
- Vite config, build config
- Nenhum codigo da aplicacao
- Funcionalidade do plugin-legacy

