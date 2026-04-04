

## Plano: Cache Headers Longos para Arquivos Estáticos

### Situação Atual

O projeto já tem uma boa base de cache, mas há lacunas:

**Já funciona bem (1 ano, immutable):**
- `/assets/*` no `vercel.json` — todos os arquivos processados pelo Vite (JS, CSS, imagens importadas via `src/assets/`) já recebem hash no nome e cache de 1 ano. As **6 capas de Estudos** (`cover-aulas.jpg`, `cover-resumos.jpg`, etc.) e todas as 200+ imagens em `src/assets/` já se beneficiam disso.

**Problema — cache fraco (apenas 24h):**
- Arquivos em `public/` (áudios, sons, vídeos, imagens hero) não passam pelo Vite, não recebem hash, e pegam apenas a regra genérica de 24h. São ~20 arquivos de áudio e ~5 imagens hero que **nunca mudam** mas o navegador re-valida diariamente.

**Problema — Supabase Storage:**
- Imagens de capas de carreiras, deputados, bibliotecas vêm do Supabase Storage. O Service Worker já faz CacheFirst por 60 dias, mas o `vercel.json` não ajuda aqui (domínio externo).

### O que será feito

**1. Expandir `vercel.json` com regras específicas para `public/`**

Adicionar regras para áudios e vídeos estáticos que nunca mudam:

| Padrão | Cache | Arquivos cobertos |
|---|---|---|
| `/audio/*`, `/sounds/*` | 1 ano, immutable | 18 arquivos de áudio/sons |
| `/videos/*`, `/animations/*` | 1 ano, immutable | Vídeos e animações |
| `/*.mp4`, `/*.webm` | 1 ano, immutable | splash-intro.mp4, splash-logo.webm |
| Hero banners na raiz (`/hero-*.webp`) | 1 ano, stale-while-revalidate | 4 imagens hero no root de public |

**2. Subir a regra genérica de imagens de 24h para 7 dias + stale 30 dias**

A regra `(.*\.(?:png|jpg|jpeg|webp...))` atual tem apenas `max-age=86400`. Como a maioria dessas imagens em `public/` raramente muda, aumentar para 7 dias com `stale-while-revalidate` de 30 dias.

**3. Supabase Storage — aumentar cache do SW para 90 dias**

No `vite.config.ts`, aumentar o `maxAgeSeconds` do runtime cache `supabase-images` de 60 para 90 dias, já que capas de carreiras e fotos de deputados são praticamente imutáveis.

### Capas que já estão otimizadas (não precisam de mudança)
- `src/assets/covers/cover-*.jpg` — processadas pelo Vite, recebem hash, já têm 1 ano immutable
- `src/assets/thumbnails/*` — idem
- `src/assets/aulas-em-tela/modulo-*.jpg` — idem
- Todas as ~200+ imagens em `src/assets/` — idem

### Arquivos modificados
| Arquivo | Alteração |
|---|---|
| `vercel.json` | Adicionar regras de cache 1 ano para audio/sounds/videos e aumentar cache de imagens genéricas |
| `vite.config.ts` | Aumentar maxAgeSeconds do supabase-images para 90 dias |

