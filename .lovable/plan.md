

## Analise: Paginas que ainda precisam de layout desktop responsivo

### Paginas JA convertidas (com `useDeviceType`)
Estudos, Simulados, AudioaulasHub, Cursos, AulasDashboard, Ferramentas, OAB (3), VideoaulasAreasLista, JuriFlix, JuriFlixDetalhes, Bibliotecas, Dicionario, Noticias, Constituicao, BoletinsJuridicos, CarreirasJuridicas, JogosJuridicos, entre outras (~38 paginas).

### Paginas que FALTAM converter (priorizadas por impacto)

#### Prioridade ALTA — Hubs e paginas de uso frequente

| Pagina | Linhas | O que faz | Proposta desktop |
|--------|--------|-----------|------------------|
| **Perfil** | 586 | Dados pessoais, plano, suporte | Layout 2 colunas: avatar+dados (esq) + tabs Plano/Suporte/Localizacao (dir) |
| **Gamificacao** | 344 | Hub de jogos juridicos + ranking | Hero menor, grid 3-4 colunas de jogos, ranking como sidebar direita |
| **ChatProfessora** | 406 | Chat com IA (Evelyn embedded) | Sidebar esquerda com historico de conversas + area de chat expandida |
| **Pesquisar** | 290 | Busca global do app | Campo de busca centralizado, resultados em grid 3 cols, categorias como sidebar |
| **IniciandoDireito** | 340 | Areas do direito p/ iniciantes | Grid 3-4 colunas de areas, topicos na lateral direita |
| **Evelyn** | 565 | Landing da assistente WhatsApp | Layout 2 colunas: funcionalidades (esq) + formulario cadastro (dir) |

#### Prioridade MEDIA — Paginas de conteudo

| Pagina | Linhas | O que faz | Proposta desktop |
|--------|--------|-----------|------------------|
| **FlashcardsEscolha** | 361 | Escolher tipo de flashcard | Grid 3 colunas de opcoes + "Em Alta" na lateral |
| **FlashcardsTemas** | 451 | Lista de temas por area | Grid de temas + painel de estudo inline |
| **FlashcardsEstudar** | 484 | Estudar flashcards (card flip) | Card maior centralizado + progresso na lateral |
| **MapaMentalAreas** | 251 | Areas de mapas mentais | Grid 4 colunas |
| **MetodologiasHub** | 132 | Hub de metodologias de estudo | Grid 3 colunas |
| **ConceitosInicio** | 249 | Inicio trilha de conceitos | Grid de areas + info lateral |
| **Redacao** | 194 | Hub de redacao juridica | Grid 3 colunas de categorias |
| **PlanoEstudos** | 136 | Wizard de plano de estudos | Wizard centralizado mais largo |
| **BloggerJuridico** | 511 | Blog juridico | Layout blog classico: posts (esq 70%) + sidebar (dir 30%) |

#### Prioridade BAIXA — Paginas secundarias

| Pagina | Linhas | O que faz |
|--------|--------|-----------|
| **Novidades** | 172 | Lista de novidades |
| **EmAlta** | 259 | Conteudos em alta |
| **PostsJuridicos** | 133 | Lista de posts |
| **Ajuda** | 268 | FAQ e suporte |
| **ArsenalAcademico** | 169 | Hub de ferramentas academicas |
| **Assinatura/AssinaturaNova** | 523 | Pagina de planos |
| **DicaDoDia** | 134 | Dica diaria |
| **PeticoesContratosHub** | 255 | Hub de peticoes |
| **CursosModulos/CursosAulas** | 172/133 | Subpaginas de cursos |
| **SimuladosRealizar** | 719 | Tela de resolver simulado |

---

### Plano de implementacao

**Etapa 1 — Hubs principais (6 paginas)**

1. **`Perfil.tsx`** — Desktop: layout 2 colunas com avatar/dados na esquerda e tabs (Plano, Suporte, Localizacao) na direita ocupando mais espaco; remover padding mobile excessivo
2. **`Gamificacao.tsx`** — Desktop: hero compacto, jogos em grid 3-4 colunas, ranking como painel lateral direito fixo mostrando top 10
3. **`ChatProfessora.tsx`** — Desktop: sidebar esquerda com lista de modos/historico + chat expandido no centro; area de input mais larga
4. **`Pesquisar.tsx`** — Desktop: barra de busca centralizada no topo, categorias como chips horizontais, resultados em grid 3 colunas
5. **`IniciandoDireito.tsx`** — Desktop: grid 3-4 colunas de areas com cards maiores, topicos de aprendizado na lateral
6. **`Evelyn.tsx`** — Desktop: 2 colunas — funcionalidades/beneficios (esq) + formulario de cadastro (dir)

**Etapa 2 — Paginas de estudo (6 paginas)**

7. **`FlashcardsEscolha.tsx`** — Desktop: opcoes em grid 3 cols + carousel "Em Alta" abaixo em fullwidth
8. **`FlashcardsTemas.tsx`** — Desktop: grid de temas (esq 65%) + painel de estudo inline (dir 35%)
9. **`FlashcardsEstudar.tsx`** — Desktop: card de flashcard maior centralizado + barra de progresso lateral
10. **`MapaMentalAreas.tsx`** — Desktop: grid 4 colunas de areas
11. **`MetodologiasHub.tsx`** — Desktop: grid 3 colunas
12. **`ConceitosInicio.tsx`** — Desktop: grid de areas + sidebar de progresso

**Etapa 3 — Conteudo e secundarias (6 paginas)**

13. **`Redacao.tsx`** — Desktop: grid 3 colunas de categorias
14. **`BloggerJuridico.tsx`** — Desktop: layout blog (posts 70% + sidebar 30% com tags/populares)
15. **`PlanoEstudos.tsx`** — Desktop: wizard centralizado com max-w mais amplo
16. **`Novidades.tsx`** — Desktop: grid 3 colunas
17. **`EmAlta.tsx`** — Desktop: grid 3-4 colunas
18. **`Ajuda.tsx`** — Desktop: FAQ em 2 colunas

### Padrao tecnico para cada pagina

```text
1. Importar useDeviceType
2. No desktop: remover StandardPageHeader se houver (DesktopTopNav global ja existe)
3. No desktop: expandir conteudo para ocupar tela cheia (h-[calc(100vh-4.5rem)])
4. Usar grid multi-colunas ou layout sidebar+conteudo
5. Sidebars devem mostrar info complementar (ranking, progresso, historico, filtros)
6. Cards maiores no desktop, hover effects mais pronunciados
7. Manter funcionalidade mobile intacta
```

### Arquivos a modificar (18)

1. `src/pages/Perfil.tsx`
2. `src/pages/Gamificacao.tsx`
3. `src/pages/ChatProfessora.tsx`
4. `src/pages/Pesquisar.tsx`
5. `src/pages/IniciandoDireito.tsx`
6. `src/pages/Evelyn.tsx`
7. `src/pages/FlashcardsEscolha.tsx`
8. `src/pages/FlashcardsTemas.tsx`
9. `src/pages/FlashcardsEstudar.tsx`
10. `src/pages/MapaMentalAreas.tsx`
11. `src/pages/MetodologiasHub.tsx`
12. `src/pages/ConceitosInicio.tsx`
13. `src/pages/Redacao.tsx`
14. `src/pages/BloggerJuridico.tsx`
15. `src/pages/PlanoEstudos.tsx`
16. `src/pages/Novidades.tsx`
17. `src/pages/EmAlta.tsx`
18. `src/pages/Ajuda.tsx`

### O que NAO muda
- Funcionalidades, queries, hooks, rotas
- Layout mobile de todas as paginas
- Paginas ja convertidas
- Paginas internas de resolucao (SimuladosRealizar, FlashcardsEstudar no mobile, etc.)
- Paginas de View (leitura de leis, artigos — layout de leitura ja funciona)

