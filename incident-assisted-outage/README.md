# Incident Assisted Outage

Ação **Create Outage** no Incident para registrar manualmente indisponibilidade ou degradação nos serviços impactados. Compatível com a interface clássica e o **Service Operations Workspace**.

| Item | Valor |
|---|---|
| Versão | 1.0.0 — 19/10/2026 |
| Aplicação | Global |
| Update Set | LAB - Incident Manual Service Outages |
| Identificador de origem | `2c05ab91c344df18e079b13ed4013184` |
| Estado na origem | Complete, após validação do solicitante |
| Pacote | [incident-assisted-outage-v1.0.0.xml](incident-assisted-outage-v1.0.0.xml) |

## Instalação

1. Baixe o XML desta pasta.
2. Na instância de destino, acesse **System Update Sets → Retrieved Update Sets → Import Update Set from XML**.
3. Importe o arquivo e execute **Preview Update Set**.
4. Revise os conflitos e as dependências; depois execute **Commit Update Set**.
5. Reabra um incidente em **In Progress**, com registros em **Impacted Services/CIs**, e valide o botão em Classic e SOW.

Pré-requisitos: Incident Management, tabelas `task_cmdb_ci_service`, `cmdb_ci_outage` e `task_outage` (funcionalidade Task-Outage Relationship), estrutura de Service/Offering com o campo `parent` preenchido e, para SOW, os componentes de ação de formulário do Configurable Workspace. Para propagar o impacto do pai às offerings, as regras nativas de Outage/Affected CIs da instância precisam estar ativas. O pacote utiliza esse comportamento; não o reimplementa.

O XML contém somente os seis componentes da solução. Incidentes, serviços, offerings, Outages de teste, usuários e credenciais não fazem parte do pacote. Não há dependência de nomes ou sys_ids dos CIs do laboratório.

## Uso e regras

O botão aparece para incidente salvo em **In Progress** (`state=2`), com serviços impactados relacionados e permissões para a operação. A elegibilidade usa os papéis `itil`, `sn_incident_write` ou `admin`, além das ACLs de leitura/escrita do incidente e criação de Outage.

1. Clique em **Create Outage**.
2. Escolha **Type**: `Outage` (padrão) ou `Degradation`.
3. Confira **Início**, preenchido com `incident.opened_at`. O campo é editável; **Fim** é opcional. As datas seguem o fuso da sessão ServiceNow e são armazenadas em UTC.
4. Selecione os alvos e clique em **Revisar seleção → Criar Outages**.

Todos os registros legíveis de `task_cmdb_ci_service` são apresentados, sem repetir CIs:

- **Services / Offerings:** offerings agrupadas por seu `parent`, que também pode ser selecionado. Ao selecionar um Service, suas offerings são desmarcadas e ficam somente leitura. Ao desmarcá-lo, voltam a ser selecionáveis.
- **Service Instances / Application Services:** apresentados na seção seguinte, incluindo subclasses de `cmdb_ci_service_auto`. Podem ser combinados com services e offerings de outros grupos.
- Outros tipos de CI permanecem visíveis para consulta, sem seleção.

É possível selecionar vários Services de pais diferentes, várias Offerings ou combinações com Service Instances. Cada CI selecionado gera **um** registro `cmdb_ci_outage`. Selecionar um pai gera somente um Outage nele: a plataforma relaciona suas offerings como **Affected CIs**, sem a customização criar Outages adicionais nos filhos.

O tipo selecionado é aplicado a todos os registros daquela operação. O campo **Message** recebe exatamente:

```text
[OUTAGE - Manual] - Criação Assistida
```

Cada Outage aponta para o incidente em `task_number`, com associação padrão em `task_outage`. O usuário da sessão é registrado em `sys_created_by`; a operação também gera work note no incidente. As regras nativas de descrição e disponibilidade continuam atuando.

## Sobreposições e validações

A revisão destaca Outages existentes com períodos sobrepostos, incluindo relações com pais e offerings afetadas, com links para o **Outage** e as **Tasks** associadas. Essa tabela informa registros anteriores; não é a lista de novos Outages a criar.

Sobreposição **não bloqueia** uma nova criação manual. A solução não deduplica Outages de operações distintas; o processamento de disponibilidade permanece com o ServiceNow/Service Commitment.

O servidor revalida estado, permissões, vínculos e alvos no envio. Rejeita pai e filho simultâneos, tipo diferente de outage/degradation e fim anterior ao início. Há proteção contra reenvio da mesma solicitação na sessão. Limites: 100 alvos por operação e 100 sobreposições exibidas, com aviso quando houver mais. Falhas parciais são apresentadas ao operador.

## Componentes do Update Set

| Tipo | Nome | Função |
|---|---|---|
| Script Include | IncidentManualOutageService | Elegibilidade, agrupamento, datas, sobreposição, validação e criação no servidor |
| Script Include | IncidentManualOutageAjax | Comunicação autenticada com a UI Page via GlideAjax |
| UI Page | manual_incident_outage | Seleção agrupada, horários, tipo, revisão e resultado |
| UI Action | Create Outage | Botão do Incident; GlideModal no Classic e g_modal.showFrame no SOW |
| UX Form Action | Create Outage | Integração da UI Action com Configurable Workspace |
| UX Form Action Layout Item | Create Outage / Registrar Outage | Posicionamento da ação no layout do Workspace |

## Validação e manutenção

Validados na PDI: abertura e gravação em Classic/SOW, bloqueio pai/filhos, seleção combinada, vínculo Task-Outage, autoria do usuário, propagação nativa do pai, fim vazio, horário inicial da abertura do incidente, aviso de sobreposição e gravação de Degradation com Message exato. Validação realizada com sessão administrativa; testar as ACLs dos perfis operacionais na instância de destino.

Para desabilitar a funcionalidade, desative a UI Action correspondente. Antes de transportar alterações posteriores, use outro Update Set. Não é necessário alterar o banco de dados da aplicação nem instalar serviços externos.
