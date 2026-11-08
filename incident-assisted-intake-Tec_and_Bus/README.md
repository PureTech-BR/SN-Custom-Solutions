# Incident Assisted Intake — Técnico e Negócio

Versão **1.0.0**, validada em **08/11/2026**, na instância `dev437951`.

Dois Record Producers abrem incidentes com perguntas adequadas ao público e reutilizam os mesmos blocos de caracterização, detalhamento e classificação. A visão técnica permite selecionar aplicações e criar um Outage após a criação do incidente. A visão de negócio mantém a experiência de seleção de serviço e oferta do primeiro item.

| Item | Público e ponto de entrada | sys_id |
|---|---|---|
| Criar Incidente - Serviços Instáveis ou Indisponíveis | Usuário autenticado; serviço e oferta | `6a6b9c7bc3185f94e079b13ed4013183` |
| Criar Incidente - Indisponibilidade de Aplicação/Sistema | Analistas com `itil`; Service Instance principal | `66309e07c3189f54e079b13ed401314a` |

O primeiro item, `0745a07dc3c09310e079b13ed4013110`, permanece intacto. Não é transportado nem desativado por este pacote. A pasta anterior `incident-assisted-intake` também é preservada.

## Instalação

Update Set de origem: **LAB - Incident Assisted Intake - Técnico e Negócio v1**, `121bdcb7c3185f94e079b13ed4013183`, estado **Complete**, com **155 Customer Updates**.

1. Verifique o SHA-256 do XML em `SHA256SUMS`.
2. Em uma instância de homologação, acesse **Retrieved Update Sets → Import Update Set from XML** e importe `incident-assisted-intake-Tec_and_Bus-v1.0.0.xml`.
3. Execute **Preview Update Set**. Resolva colisões, referências ausentes e alterações locais antes de **Commit Update Set**. O pacote é completo para as duas implementações; não exige importar previamente o Update Set antigo.
4. Confira catálogo, categoria, tópico do Employee Center e permissões no destino. As associações são transportadas com os IDs da origem; os respectivos catálogos, categorias e tópicos não são criados pelo pacote.
5. Confirme que os dois itens aparecem no portal, que os widgets renderizam e que os grupos de suporte seguem as regras nativas/configuradas do destino. O código não fixa grupo responsável nem altera a matriz de prioridade.
6. Repita os cenários de `VALIDATION.md` com usuários dos dois públicos. Importação e execução em uma segunda instância ainda não foram testadas nesta entrega.

Pré-requisitos: tabelas de Incident, Service Catalog/Record Producer, CMDB Services, Outages e Service Portal/Employee Center; escopo Global; papéis nativos `admin`/`itil`. Não são incluídos usuários, grupos, serviços, ofertas, SIs, relacionamentos de negócio, incidentes, Outages ou linhas de controle de execução.

O XML usa o envelope de Retrieved Update Set do pacote anterior e os **payloads nativos de `sys_update_xml`**, preservados integralmente. `components.json` registra os 155 nomes canônicos e o hash de cada payload.

## Variable Sets e reutilização

| Variable Set | Variáveis | Negócio | Técnico | Ordem |
|---|---:|:---:|:---:|---:|
| Serviços de negócio e ofertas | 6 | Sim | — | 100 |
| Aplicações/Sistemas afetados | 4 | — | Sim | 100 |
| Serviço e oferta (opcional) | 3 | — | Sim | 200 |
| Contexto da identificação técnica | 3 | — | Sim | 300 |
| **Caracterização do incidente** | **2** | **Sim** | **Sim** | 400 |
| Outage automático do SI principal | 6 | — | Sim | 450 |
| **Detalhamento e continuidade do incidente** | **11** | **Sim** | **Sim** | 500 |

São **7 Variable Sets distintos**, **9 vínculos** com os produtores e **13 variáveis compartilhadas** nos dois blocos comuns. Os scripts de comportamento compartilhado ficam no set de caracterização e controlam também os campos do detalhamento; reutilize os dois sets em conjunto.

Há 37 registros de variáveis no pacote: 35 pertencem aos sets e dois são componentes locais da visão técnica (`outage_notice_service` e `outage_status_data`), responsáveis pelo aviso de Outages e seu estado público. Não são perguntas adicionais ao solicitante. O novo item de negócio não possui variáveis locais.

`variables.json` contém configurações, escolhas, IDs e vínculos. `catalog-scripts.json` identifica o contexto de cada script; os arquivos em `src/catalog-client-scripts` usam sys_id para evitar colisões por nomes truncados na plataforma.

## Perguntas comuns

| Campo | Obrigatoriedade / condição |
|---|---|
| O que está acontecendo? | Obrigatório: não acessa, lentidão, erro ou outro sintoma configurado |
| Qual a extensão da indisponibilidade? | Obrigatório: Total, Parcial ou Não sei informar |
| Qual funcionalidade está afetada e o que ainda funciona? | Visível e obrigatório em Parcial |
| Em qual ação ocorre a lentidão? | Visível e obrigatório em Lentidão |
| Com que frequência o problema acontece? | Visível e obrigatório em Lentidão ou Erro |
| Qual mensagem de erro aparece? | Visível em Erro; opcional |
| Quem está sendo afetado? | Obrigatório |
| É possível continuar a atividade afetada? | Obrigatório |
| Qual alternativa está utilizando? | Visível quando há alternativa; opcional |
| Como consegue continuar a atividade com o serviço totalmente indisponível? | Obrigatório se Total + Todos + continuidade normal |
| Não sei informar quando começou / Quando o problema começou? | Checkbox marcado inicialmente; data obrigatória ao desmarcar |
| Descreva brevemente o problema | Obrigatório |

Campos condicionais são validados também no servidor. O servidor refaz a consulta de Outages no envio, ignorando dados de correlação forjados no navegador.

## Visão de negócio

Serviço obrigatório; oferta obrigatória quando o usuário não marca **Não sei identificar a oferta**. A oferta deve pertencer ao serviço selecionado e estar operacional. Preserva-se o qualificador original: classes `cmdb_ci_service`, `cmdb_ci_service_business` e `cmdb_ci_service_technical`, com `operational_status=1`.

O aviso distingue ocorrências no serviço/oferta das ocorrências em aplicações diretamente relacionadas à oferta. Relação considerada: **oferta → Depends on::Used by → aplicação**. Não faz busca transitiva em infraestrutura. Havendo Outage de aplicação elegível, o CI é derivado do primeiro registro na ordem início, número e sys_id. Não cria Outage e não vincula automaticamente o incidente como filho de outro.

## Visão técnica

| Campo | Regra |
|---|---|
| Service Instance principal | Obrigatório, referência a `cmdb_ci_service_auto`; exclui aposentados pelos estados configurados |
| Descrição da aplicação | Preenchida pela seleção, somente leitura |
| Múltiplos Service Instances? | Obrigatório, Sim/Não |
| Demais Service Instances | Em Sim, exige ao menos outro SI distinto; elimina duplicados |
| Serviço e oferta | Opcionais e exibidos em seleção de um único SI |
| Canal | Obrigatório: Website, Mobile, Desktop App, Auto-Atendimento Totem |
| URL | Opcional, abaixo de Canal |
| Identificação | Obrigatório: Monitoração - Não integrada; Usuário Interno - Negócio; Gestão da Rotina - Técnica; Fluxos Automatizados - Não Integrado |

Serviços/ofertas técnicos são limitados às ofertas operacionais com relação direta **oferta → Depends on::Used by → SI principal**, e aos serviços operacionais pais dessas ofertas. O servidor repete a validação. Com múltiplos SIs, serviço/oferta são limpos e não usados.

O SI principal preenche `incident.cmdb_ci`; os demais são adicionados a `task_ci` após o insert. A regra nativa da instância também associa o CI principal aos CIs afetados. O código não cria regra própria de atribuição; encaminhamento depende das regras e dados do CI no destino.

## Classificação

Usa o mesmo núcleo e a mesma regra nos dois itens. Prioridade é calculada pela matriz configurada na plataforma.

| Resposta | Impacto |
|---|---:|
| Somente eu | 3 |
| Total + Todos | 1 |
| Demais combinações, inclusive desconhecido | 2 |

| Continuidade | Urgência |
|---|---:|
| Não consigo continuar | 1 |
| Consigo continuar normalmente | 3 |
| Alternativa ou desconhecido | 2 |

São 3 extensões × 5 abrangências × 4 respostas de continuidade = **60 combinações** verificadas.

## Outage automático

Exclusivo do item técnico. O bloco aparece imediatamente abaixo da extensão quando ela é Total ou Parcial e não existe Outage/Degradation vigente para o SI principal. Considera vínculo principal e associação em `cmdb_outage_ci_mtom`; vigência: início ≤ agora e fim vazio ou ≥ agora. Planned Outage não bloqueia a criação.

| Extensão | Tipo derivado no servidor |
|---|---|
| Total | `outage` |
| Parcial | `degradation` |
| Não sei informar | Não solicita criação |

Tipo somente leitura; início preenchido com o horário atual, editável, sem campo de fim. Dica: **Altere para o horário em que foi identificado/reportado a indisponibilidade na aplicação.** O valor recebido do produtor é tratado como UTC (`GlideDateTime.setValue`); a exibição usa o fuso da sessão. Início ausente/inválido ou mais de 60 segundos no futuro é rejeitado.

O Record Producer valida antes do insert. Seu `post_insert_script` executa a automação somente depois de existir o INC, repete a checagem e cria `cmdb_ci_outage` com SI principal, tipo, início, fim vazio e `task_number` apontando para o INC. Também garante o vínculo em `task_outage`.

Message: **`[OUTAGE Automático] - Assistido CAT ITEM`**, 40 caracteres, compatível com o campo nativo. Não amplia o dicionário do Message. Outage somente do SI principal; não cria registros para SIs adicionais, serviço ou oferta.

Reexecução do mesmo INC é idempotente. A tabela customizada `u_lab_si_outage_guard` usa o sys_id do SI como chave primária para reservar a criação entre transações; possui referências ao INC/Outage e ACLs administrativas. Suas linhas são dados de execução e não são transportadas. Falha posterior ao insert preserva o incidente e registra erro/nota de trabalho. Não há Business Rule customizada ou evento adicional neste pacote.

## Título e descrição do INC

Negócio: **`<Serviço> - <Sintoma>`**. Exemplo: `Portal de Seguros - Lentidão`.

Técnico: **`<SI principal> [(+N aplicações)] - <Sintoma> - <Canal>`**. Exemplo: `Portal BSPN (+1 aplicação) - Não consigo acessar - Website`. O texto do sintoma usa a escolha configurada; títulos são limitados a 160 caracteres.

Descrição: relato informado, seleções e detalhes condicionais, classificação inicial, horário da consulta e os dois blocos de ocorrências. Na visão técnica, acrescenta aplicações, descrição do SI, canal, URL, origem da identificação e plano de Outage. Informações internas da correlação ficam em notas de trabalho; incidentes sem permissão de leitura não têm seus detalhes divulgados no aviso público.

## Conteúdo e manutenção

- `src/`: fontes extraídas dos payloads nativos, inclusive produtores, Script Includes, scripts de catálogo, editores de variáveis e widgets.
- `components.json`: inventário das 155 atualizações e hashes dos payloads.
- `variables.json`: variáveis, sets, vínculos e escolhas.
- `MIGRATION.md`: equivalências com o primeiro pacote e preservação do legado.
- `VALIDATION.md` e `tests/`: evidências e testes reproduzíveis.
- `SHA256SUMS`: integridade dos arquivos versionados desta pasta.

Para executar os testes locais: **Node.js + Python 3**, sem instalar dependências, usando `npm test`. Os testes com mocks não substituem Preview/Commit e homologação dos públicos no destino.
