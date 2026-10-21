# Reportar Incidente — abertura assistida no Employee Center

Record Producer em aplicação **Global** para abertura de incidentes com seleção de Serviço/Oferta, identificação de indisponibilidades conhecidas e classificação inicial pelas respostas do cliente.

## Pacote

- Versão: **1.0.0**.
- XML: `incident-assisted-intake-v1.0.0.xml`.
- Update Set: `LAB - Reportar Incidente Assistido`.
- Sys ID de origem: `4c25603dc3c09310e079b13ed401318b`.
- Record Producer: `Reportar Incidente` (`0745a07dc3c09310e079b13ed4013110`).

## Comportamento

O formulário apresenta Serviço e suas Ofertas dependentes. Também permite marcar que a oferta não foi identificada. Os seletores autenticados disponibilizam apenas nome e identificador dos serviços/ofertas operacionais das classes configuradas, sem conceder leitura geral da CMDB.

As perguntas incluem sintoma, extensão total/parcial, pessoas afetadas, possibilidade de continuar a atividade, início e descrição. Detalhes de funcionalidade, lentidão, frequência, erro e alternativa aparecem conforme as respostas. A indisponibilidade parcial exige detalhamento. O servidor valida as opções e impede selecionar uma oferta de outro serviço.

O incidente recebe título no padrão **Serviço - Sintoma**, descrição com as respostas e variáveis associadas pelo mecanismo nativo do Record Producer. Anexos usam o recurso padrão do catálogo.

### Classificação

| Resposta | Impacto |
|---|---|
| Apenas o solicitante | 3 — Low |
| Total e várias equipes/todos os usuários | 1 — High |
| Demais combinações | 2 — Medium |

| Continuidade | Urgência |
|---|---|
| Atividade bloqueada, sem alternativa | 1 — High |
| Consegue continuar sem bloqueio | 3 — Low |
| Alternativa, dificuldade significativa ou não sabe avaliar | 2 — Medium |

A **prioridade é calculada pela matriz já existente na instância**. O pacote não altera o Priority Data Lookup. Respostas desconhecidas são sinalizadas para triagem. Um outage existente não determina automaticamente a prioridade do novo incidente.

### Aviso e correlação

A consulta considera `cmdb_ci_outage` de tipo outage ou degradation, com início <= agora e fim vazio ou >= agora. Inclui impacto direto na oferta, no serviço pai e vínculos de CIs afetados em `cmdb_outage_ci_mtom`.

O aviso distingue Serviço de Negócio e Oferta de Serviço e apresenta uma lista com recuo no formato **INC — OUT — IC associado ao outage**, permitindo que o usuário continue a abertura.

No envio, uma nova consulta produz o bloco **Auto Impact** na descrição. O INC associado é procurado em `task_number` e `task_outage`, com deduplicação por par INC/outage. Sem INC, essa condição é registrada. Não são criadas relações de pai/filho nem afirmada causa comum.

Informações do incidente de origem são copiadas para a descrição somente quando legíveis pelo solicitante. Detalhes restritos e identificadores técnicos ficam nas notas internas. O widget recebe apenas dados públicos de apresentação; o servidor não confia na variável oculta do aviso para efetuar a correlação.

## Componentes

- Record Producer, variáveis, opções e associações ao catálogo, categoria e tópico do Employee Center.
- Script Includes `LabIncidentIntakeService` e `LabIncidentIntakeAjax`.
- Catalog Client Scripts de inicialização e alteração das respostas.
- Widget `LAB Intake - Outage Notice` e variáveis de apresentação do aviso.

## Instalação

1. Importe o XML em **System Update Sets > Retrieved Update Sets > Import Update Set from XML**.
2. Execute **Preview Update Set** e revise conflitos e dependências.
3. Faça **Commit Update Set** na aplicação Global.
4. Confira as associações ao catálogo, categoria e tópico. Os identificadores desses registros vêm da instância de origem e devem existir ou ser adaptados no destino.
5. Abra `/esc?id=sc_cat_item&sys_id=0745a07dc3c09310e079b13ed4013110`.

Requer Incident Management, Service Catalog e Employee Center/Service Portal. Serviços, ofertas, outages e incidentes de negócio não são transportados pelo pacote. As ACLs e a matriz de prioridade do ambiente de destino continuam aplicáveis.

## Validação na PDI

- 60 combinações de classificação verificadas localmente.
- Envios reais com prioridades P1 a P4, outage direto, herdado e ausente.
- Respostas persistidas; ofertas incompatíveis e parcial sem detalhes rejeitados.
- Testes pelo Employee Center como administrador e como usuário sem papéis administrativos.
- Dados restritos do INC de origem protegidos, com rastreabilidade interna preservada.
- Avisos de Serviço/Oferta com recuo e linhas separados conferidos no portal.

Os incidentes criados apenas para teste foram mantidos na PDI para inspeção do usuário; eles não fazem parte do Update Set.
