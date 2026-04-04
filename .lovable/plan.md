

## Por que as capas dos simulados carregam instantaneamente e as outras nao

### Diagnostico

A diferenca esta na **origem das imagens**:

| Secao | Origem da imagem | Velocidade |
|-------|-----------------|------------|
| Simulados | Arquivos `.webp` **bundled no app** (`import capaOab from "@/assets/..."`) | Instantaneo — ja esta no JS |
| Estudos em Midia | Arquivos `.jpg` **bundled no app** (`import capaIniciante from "@/assets/..."`) | Instantaneo |
| Biblioteca | URLs remotas do Supabase (`url_capa_gerada`, `Capa-livro`) | Lento — precisa query + download |
| Legislacao | URLs remotas do Supabase (`url_capa`) | Lento — precisa query + download |
| Politica | URLs remotas do Supabase (`thumbnail`) | Lento — precisa query + download |
| Jornada | URLs remotas do Supabase (`capa_url`) | Lento — precisa query + download |

Os simulados importam imagens WebP direto do codigo (`import capaEscrevente from "@/assets/capa-escrevente.webp"`), entao elas ja vem junto com o JavaScript — nao dependem de nenhuma requisicao extra.

As outras secoes precisam: (1) fazer uma query ao Supabase para descobrir a URL, (2) depois fazer outro request HTTP para baixar a imagem. Sao 2 etapas de rede vs 0 etapas.

### Plano de correcao

**Estrategia**: Usar `<link rel="preload">` no `<head>` para as imagens remotas mais visiveis, e carregar todas as URLs de imagem **em paralelo** assim que os dados do Supabase chegarem, sem esperar scroll ou idle.

**Arquivos a modificar:**

1. **`src/hooks/useHomePreloader.ts`** — Ja faz preload de imagens, mas com limite de 50 e delay de 300ms. Vamos:
   - Priorizar as imagens das secoes visiveis acima do fold (Biblioteca, Legislacao) com `fetchPriority: "high"`
   - Disparar o preload das URLs assim que a query retornar, sem batch/intervalo

2. **`src/components/home/BibliotecaHomeSection.tsx`** — Adicionar `loading="eager"` nas primeiras 4-6 capas visiveis (em vez de lazy)

3. **`src/components/home/LegislacaoHomeSection.tsx`** — Adicionar `loading="eager"` nas primeiras capas e usar `decoding="async"` para nao bloquear o thread

4. **`src/components/home/PoliticaHomeSection.tsx`** — Trocar `loading="lazy"` por `loading="eager"` nos primeiros 3-4 itens visiveis

5. **`src/components/home/JornadaHomeSection.tsx`** — Mesmo tratamento: eager nas primeiras capas

**Tecnica adicional**: Injetar `<link rel="preload" as="image">` no head para as primeiras 6 URLs de capa assim que o useHomePreloader receber os dados, usando `document.head.appendChild()`. Isso faz o browser comecar o download antes mesmo dos componentes renderizarem.

### Impacto esperado
- Imagens das primeiras secoes aparecerao **1-3s mais cedo**
- Secoes abaixo do fold continuam com lazy load normal
- Nenhuma mudanca visual

