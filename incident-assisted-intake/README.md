# Reportar Incidente — abertura assistida no Employee Center

Record Producer Global para selecionar serviço/oferta, consultar outages em curso e abrir o incidente com respostas, classificação inicial e CI da aplicação afetada.

## Pacote completo v1.1.0

- [Baixar XML único](incident-assisted-intake-v1.1.0.xml): **56 componentes únicos**.
- Update Set: **LAB - Reportar Incidente Assistido - Variable Editor**, origem `103a3800c318d790e079b13ed401313b`.
- Record Producer: **Reportar Incidente**, `0745a07dc3c09310e079b13ed4013110`.
- O nome do conjunto foi mantido, mas seu conteúdo inclui toda a solução. **Não é necessário importar a versão 1.0.0 nem o primeiro update set.**
- [Checklist e evidências](VALIDATION.md), [histórico](CHANGELOG.md), [identificação do pacote](package.json) e [fontes para revisão](src/).

Incidentes, outages, serviços, ofertas, aplicações e relacionamentos de negócio não são transportados. Os exemplos desta documentação são ilustrativos.

## Instalação

1. Baixe `incident-assisted-intake-v1.1.0.xml`.
2. No destino, acesse **System Update Sets > Retrieved Update Sets > Import Update Set from XML** e importe o arquivo.
3. Execute **Preview Update Set**, revise conflitos e resolva referências ausentes.
4. Execute **Commit Update Set**, na aplicação **Global**.
5. Confira as associações do producer ao catálogo, categoria e tópico do Employee Center. Os vínculos estão no XML, mas os registros referenciados precisam existir ou ser adaptados no destino.
6. Confira serviços/ofertas operacionais e relações da CMDB conforme as regras abaixo.
7. Abra `/esc?id=sc_cat_item&sys_id=0745a07dc3c09310e079b13ed4013110` e execute o [checklist](VALIDATION.md), inclusive com o perfil real do solicitante.
8. Para ver as respostas no formulário clássico do incidente, inclua o formatter nativo **Variable Editor** na view usada pela equipe, caso ainda não esteja presente. O pacote contém o comportamento de exibição/somente leitura; não inclui personalizações de layout das views de incidente.

Requer Incident Management, Service Catalog e Employee Center/Service Portal, com acesso permitido ao producer. ACLs, matriz de prioridade e regras nativas do destino continuam aplicáveis. Instale pelo XML: copiar os fontes isoladamente não transporta variáveis e vínculos.

## Fluxo e validações no catálogo

O solicitante escolhe o serviço, uma oferta ou **Não sei identificar a oferta**, consulta o aviso e preenche sintoma, extensão, pessoas afetadas, continuidade, início e descrição. O aviso permite continuar a abertura.

| Regra | Comportamento |
|---|---|
| Serviço obrigatório | Apenas `operational_status=1`, classes `cmdb_ci_service`, `cmdb_ci_service_business` e `cmdb_ci_service_technical`. Não lista ofertas ou Application Services nesse seletor. |
| Oferta dependente | Apenas ofertas operacionais cujo `parent` seja o serviço escolhido. |
| Troca do serviço | Limpa a oferta anterior e recarrega as opções. |
| Oferta desconhecida | Limpa/desabilita a oferta e permite prosseguir apenas com serviço válido. |
| Serviço sem ofertas | Orienta a marcar que não sabe identificar a oferta. |
| Revalidação no servidor | Rejeita IDs inválidos, serviço fora do filtro e oferta incompatível ou não operacional. |

Serviço/Oferta são Select Box com Ajax autenticado: salvam `sys_id` e exibem nomes. Publicam uma projeção de nomes/IDs permitidos pelos filtros, sem criar ACL de leitura geral da CMDB.

| Condição | Validação / detalhe |
|---|---|
| Sempre | Sintoma, extensão, abrangência e continuidade exigem opções válidas. Descrição é obrigatória, inclusive após remover espaços nas extremidades. |
| Extensão **Parcial** | Exige informar funcionalidade afetada e o que ainda funciona. |
| Sintoma **Lentidão** | Exige ação em que ocorre lentidão e frequência. |
| Sintoma **Erro ao executar uma ação** | Exige frequência; mensagem de erro é opcional. |
| Continuidade com alternativa/dificuldade | Exibe alternativa utilizada, opcional. |
| Início | **Não sei informar quando começou** dispensa data/hora; ao desmarcar, o início passa a ser obrigatório. |
| Total + várias equipes/todos + continuidade normal | Exige esclarecimento de como consegue continuar a atividade. |
| Respostas desconhecidas | São válidas nas dimensões previstas e geram indicação de triagem na descrição. |

As exigências relevantes são repetidas no servidor, também em envio por API. Falha de validação aborta a criação com mensagem; ocultar um campo no navegador não dispensa a regra. Anexos usam o mecanismo nativo do catálogo.

## Outages: consulta e separação por camada

Nos dois blocos, consulta `cmdb_ci_outage` com tipo **outage** ou **degradation**, início <= agora e término vazio ou >= agora. Outages encerrados antes da consulta e com início futuro ficam fora. O estado do INC associado não substitui as datas do outage.

A consulta ocorre ao mudar serviço/oferta e é **refeita no envio**. O servidor não confia no JSON oculto do aviso. Antes de escolher a oferta, ou com oferta desconhecida, consulta somente o serviço. Falha de consulta na tela informa que haverá nova tentativa no envio; não é tratada como confirmação de ausência de outage.

### 1. Serviços de Negócio e Ofertas

Mantém a busca original por CI principal igual ao serviço pai ou à oferta selecionada, ou por associação desses CIs em `cmdb_outage_ci_mtom`. A origem exibida é **Serviço pai**, **Oferta diretamente** ou **CI afetado relacionado**.

### 2. Aplicações relacionadas à oferta

Consulta Service Instance / Application Service da hierarquia `cmdb_ci_service_auto`, incluindo subclasses descobertas e por tags. Exige uma relação direta:

```text
Oferta → Depends on → Aplicação
cmdb_rel_ci.parent = oferta selecionada
cmdb_rel_ci.type.name = Depends on::Used by
cmdb_rel_ci.child = aplicação
```

O CI principal do outage precisa ser essa aplicação. Não percorre relações indiretas, infraestrutura, outras ofertas ou relações invertidas. Sem oferta, mostra **Não consultado: oferta de serviço não informada**. Relações duplicadas não duplicam os outages.

### Deduplicação

Se um outage da aplicação também aparecer na busca original porque a oferta consta como CI afetado, ele é exibido **somente no bloco de aplicações**. A chave é o ID do outage, não o INC: outages distintos são mantidos mesmo associados ao mesmo incidente. Um outage com vários INCs associados pode ter uma linha por associação, sem repetição entre as camadas.

### Padrão do aviso na abertura

```text
Ocorrências em curso para a seleção informada. Consulte separadamente as camadas abaixo:

Serviços de Negócio e Ofertas
  INC0010100 — OUT0001500 — Acessos - Usuários e Grupos
  Indisponibilidade · Serviço pai · Início: 2026-10-27 14:00:00

Aplicações relacionadas à oferta
  INC0010101 — OUT0001501 — OpenLDAP
  Degradação · Aplicação diretamente relacionada à oferta · Início: 2026-10-27 14:10:00
  Oferta relacionada: Autenticação para Terceiros (relação direta)

Aplicações listadas possuem relação direta com a oferta selecionada.
O impacto no serviço será avaliado pela equipe de atendimento.

Você pode continuar e abrir seu incidente, se desejar.
Acompanhar status dos serviços
Verificado em: 2026-10-27 14:15:00.
```

Havendo apenas outage de aplicação, o primeiro bloco informa **Nenhuma ocorrência adicional de serviço ou oferta. Outages de aplicações estão no bloco abaixo.** Sem ocorrências nas duas camadas, o formulário mostra uma mensagem simples de ausência em vez do quadro de alerta.

## Regras do incidente criado

| Campo | Preenchimento |
|---|---|
| `caller_id` | Usuário autenticado do envio. |
| `contact_type` | `self-service`. |
| `business_service` / `service_offering` | Seleção validada; oferta vazia quando desconhecida. |
| `cmdb_ci` | Aplicação do **primeiro outage do bloco de aplicações** encontrado no envio. |
| `short_description` | `Nome do serviço - Texto do sintoma`, até 160 caracteres. |
| `description` | Texto livre + respostas + Auto Impact. |
| `impact` / `urgency` | Calculados pelas respostas, conforme as tabelas abaixo. |
| `priority` | Matriz já existente na plataforma. |
| `parent` / `parent_incident` | Não são associados automaticamente pela correlação. |
| `work_notes` | Rastreabilidade técnica da seleção, outages/INCs e escolha do CI. |

### CI quando há vários outages de aplicações

Ordena por **início crescente**, depois **número** e **sys_id** para desempate. O primeiro fornece o CI; é a mesma ordem do bloco de aplicações no resumo.

Exemplo: outage do OpenLDAP às 14:00 e do Portal às 14:10 → ambos ficam no Auto Impact e `cmdb_ci = OpenLDAP`. Um outage anterior do serviço de negócio não participa dessa escolha. Sem outage de aplicação direta em curso, esta lógica não atribui CI. Outros automatismos do destino podem ter regras próprias sobre o campo.

### Classificação inicial

| Resposta | Impacto |
|---|---|
| Apenas eu, independentemente da extensão | 3 — Low |
| Extensão Total e várias equipes/todos | 1 — High |
| Demais combinações | 2 — Medium |

| Continuidade | Urgência |
|---|---|
| Bloqueado e sem alternativa | 1 — High |
| Consegue continuar sem bloqueio | 3 — Low |
| Alternativa/dificuldade ou não sabe avaliar | 2 — Medium |

A versão não altera o Priority Data Lookup. Existência/quantidade de outages e CI associado não mudam automaticamente impacto/urgência e não comprovam causa comum. A prioridade final depende da matriz e das regras nativas do destino.

### Padrão da descrição do INC

```text
Não consigo acessar a autenticação de terceiros.

--- Reportar Incidente: informações do solicitante ---
Serviço: Acessos - Usuários e Grupos
Oferta: Autenticação para Terceiros
Sintoma: Não consigo acessar
Extensão: Total
Abrangência: Apenas eu
Continuidade: Não consigo continuar e não existe alternativa
Início informado: Não sei informar

Classificação inicial pelas respostas: Impacto=3; Urgência=1. Prioridade calculada pela matriz da plataforma.

--- Auto Impact: consulta no envio ---
Verificado em: 2026-10-27 14:15:00 (America/Sao_Paulo)

[1] Serviços de Negócio e Ofertas
- OUT0001500 | Indisponibilidade | Acessos - Usuários e Grupos
  Origem: Serviço pai | Início: 2026-10-27 14:00:00
  Incidente associado: INC0010100 - Falha no serviço de acessos

[2] Aplicações relacionadas à oferta
- OUT0001501 | Degradação | OpenLDAP
  Origem: Aplicação diretamente relacionada à oferta | Início: 2026-10-27 14:10:00
  Incidente associado: INC0010101 - Lentidão na autenticação
  Oferta relacionada: Autenticação para Terceiros (relação direta Depends on::Used by).

Aplicações listadas possuem relação direta com a oferta selecionada. O impacto no serviço será avaliado pela equipe de atendimento.
```

Respostas condicionais são acrescentadas antes da classificação: funcionalidade, ação com lentidão, frequência, mensagem de erro, alternativa e esclarecimento. Respostas desconhecidas geram a indicação de triagem.

O Auto Impact guarda o **retrato do momento do envio**. Um outage encerrado depois permanece nessa descrição histórica; novas aberturas fazem novas consultas.

### Correlação, segurança e variáveis salvas

- Procura o INC em `task_number` do outage e em `task_outage`, deduplicando o par outage/INC. Sem INC, informa essa condição.
- Número/título do INC são expostos somente quando legíveis via `GlideRecordSecure` e permissões dos campos. Caso contrário, mostra **INC com acesso restrito** no aviso e indicação equivalente na descrição.
- Detalhes e IDs técnicos ficam em work notes, sujeitos às permissões desse campo. A leitura técnica é limitada aos IDs associados aos outages encontrados e não oferece busca livre de incidentes no Ajax.
- O widget recebe dados mínimos de apresentação e os interpola como texto. Chamadas Ajax não permitem usuário guest.
- As respostas são preservadas pelo mecanismo nativo em `question_answer`. No Variable Editor, ficam somente leitura; nomes de serviço/oferta são resolvidos com ACLs do incidente e da CMDB, sem alterar os IDs salvos.
- Registro removido ou não legível aparece como **Registro removido ou sem acesso**. O bloqueio visual não substitui controles de segurança do servidor e não impede o preenchimento no catálogo.

## Componentes

| Componente | Quantidade |
|---|---:|
| Record Producer | 1 |
| Variáveis: 16 respostas e 3 técnicas/de apresentação | 19 |
| Opções das perguntas | 20 |
| Catalog Client Scripts: 1 onLoad e 8 onChange | 9 |
| Script Includes | 2 |
| Widget de aviso | 1 |
| Client Script do Variable Editor | 1 |
| Vínculos de catálogo, categoria e tópico | 3 |
| **Total** | **56** |

As regras de negócio descritas são implementadas nos Script Includes, no producer e nos Client Scripts. Isso não significa que o pacote crie registros adicionais da tabela Business Rule (`sys_script`).
