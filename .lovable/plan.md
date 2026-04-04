

## Plano: Melhorar Conversor de Imagens com Categorias e TinyPNG

### Situação Atual
A página `ConverterImagens.tsx` já lista ~60 tabelas/colunas do banco, mas mostra tudo como lista plana de "tabela:coluna" — difícil de entender e navegar. A edge function `converter-imagem-webp` já usa TinyPNG para comprimir e converter para WebP.

### O que muda

**1. Reorganizar em categorias visuais com nomes amigáveis**

| Categoria | Tabelas incluídas |
|---|---|
| **Capas Principais** | CURSOS (capa, capa-modulo, capa-area), JURIFLIX, CAPA-BIBILIOTECA, carreiras_capas, radar_capas_diarias |
| **Bibliotecas** | Todas as BIBLIOTECA-* (OAB, Estudos, Clássicos, Oratória, Liderança, Fora da Toga) |
| **Blog e Notícias** | BLOGGER_JURIDICO, blogger_politico, noticias_juridicas_cache, noticias_politicas_cache |
| **Resumos e Flashcards** | RESUMO, RESUMOS_ARTIGOS_LEI, FLASHCARDS, flashcards_areas_capas |
| **Simulados e Questões** | SIMULADO-OAB, SIMULADO-ESCREVENTE, SIMULADO-JUIZ, QUESTOES_*, SIMULACAO_* |
| **Áudio e Vídeo** | AUDIO-AULA, audiencias_*, documentarios_juridicos, CURSOS-APP |
| **Política** | Todos os rankings de deputados/senadores, tres_poderes, senado_senadores |
| **Outros** | LEITURA_FORMATADA, leitura_interativa, mapas_mentais, notificacoes_push, meu_brasil_juristas, ESTAGIO-BLOG |

**2. Interface renovada**

- Filtro por categoria no topo (chips/tabs horizontais scrolláveis)
- Ao selecionar categoria, mostra as tabelas daquela categoria com preview de imagens
- Estatísticas por categoria (total, WebP, pendentes)
- Botão "Converter" por categoria ou geral
- Paleta de cores do app (vermelho/accent), sem amber

**3. Melhorias de UX**

- Nomes amigáveis nas tabelas (ex: "JuriFlix — Capas" em vez de "JURIFLIX:capa")
- Mostrar thumbnail das imagens pendentes diretamente na lista
- Progresso visual por categoria
- Indicador de economia total em destaque

### Arquivos modificados
| Arquivo | Alteração |
|---|---|
| `src/pages/ferramentas/ConverterImagens.tsx` | Reescrever com categorias, filtros, nomes amigáveis e paleta correta |

