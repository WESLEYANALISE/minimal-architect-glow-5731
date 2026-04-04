

## Plano: Categorizar Ferramentas + Sugestões de Novas Funções

### Situação Atual
O menu Ferramentas (Sheet mobile) lista 8 itens em lista plana, sem agrupamento. A página desktop (`Ferramentas.tsx`) tem apenas 3 itens (Acesso Desktop, Localizador, Ranking).

### Proposta de Categorias

**1. 🎓 Faculdade** — Ferramentas para o estudante de Direito
- Simulados *(já existe)*
- Carreiras Jurídicas *(já existe)*
- Ranking de Faculdades *(já existe na página, não no Sheet)*
- **Pesquisar TCC** *(já existe em `/ferramentas/tcc`, mas não aparece no Sheet)*
- **Plano de Estudos** *(já existe em `/plano-estudos`, não aparece no Sheet)*

**2. 💼 Advogado** — Ferramentas para o dia a dia profissional
- Evelyn (Assistente IA) *(já existe)*
- Dicionário *(já existe)*
- **Consulta CNPJ** *(já existe em `/advogado/consulta-cnpj`, não aparece no Sheet)*
- **Calculadora de Prazos** *(já existe em `/advogado/prazos`, não aparece no Sheet)*
- Localizador Jurídico *(já existe na página desktop)*

**3. 📰 Informação** — Conteúdo e atualidades jurídicas
- Boletins *(já existe)*
- Política *(já existe)*
- Análises *(já existe)*
- Documentários *(já existe)*

**4. 🔗 Links Úteis** — Portais jurídicos externos
- *(manter os links do STF, STJ, CNJ etc. como seção final ou aba separada)*

### Funções que Faltam (sugestões de novas)

| Função | Categoria | Descrição |
|---|---|---|
| **Calculadora de Honorários** | Advogado | Calcula honorários com base na tabela da OAB estadual |
| **Gerador de Procuração** | Advogado | Cria procurações ad judicia e ad negotia com IA |
| **Cronômetro de Audiência** | Advogado | Timer para controlar tempo de sustentação oral |
| **Consulta Processual** | Advogado | Busca processos por número nos tribunais |
| **Mapa Mental** | Faculdade | *(já existe em `/mapa-mental`, colocar no Sheet)* |
| **Agenda Jurídica** | Advogado | Calendário com feriados forenses e prazos |

### Implementação no Sheet Mobile

- Adicionar um label de seção (texto cinza, tipo "FACULDADE", "ADVOGADO", "INFORMAÇÃO") antes de cada grupo
- Manter a mesma estética dos cards atuais
- Adicionar os itens que já existem mas não aparecem no Sheet (CNPJ, Prazos, TCC, Plano de Estudos, Ranking, Localizador, Mapa Mental)

### Implementação na Página Desktop

- Reorganizar `ferramentasLista` em arrays por categoria
- Renderizar com subtítulo de seção antes de cada grupo
- Mover os 3 itens atuais para as categorias corretas

### Arquivos modificados
| Arquivo | Alteração |
|---|---|
| `src/components/FerramentasSheet.tsx` | Reorganizar itens em categorias com labels de seção |
| `src/pages/Ferramentas.tsx` | Reorganizar em categorias no desktop também |

