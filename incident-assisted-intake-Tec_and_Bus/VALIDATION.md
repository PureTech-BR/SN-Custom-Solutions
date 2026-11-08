# Validação da v1.0.0

Data: 08/11/2026. Instância: `dev437951`. Execução em sessão administrativa. Update Set concluído com 155 Customer Updates.

## Envios reais pelo Employee Center

| Cenário | Resultado |
|---|---|
| Negócio: lentidão, parcial, algumas pessoas, alternativa, detalhes condicionais | `INC0010066`: impacto 2, urgência 2, prioridade 3; sem Outage criado |
| Técnico: dois SIs distintos, Total, todos, bloqueado, Website, rotina, URL | `INC0010067`: principal no cmdb_ci, dois CIs afetados sem duplicidade; `OUT0001466` somente para o principal, fim inicialmente vazio |
| Negócio: serviço/oferta de teste com relação direta ao SI do Outage em curso | `INC0010068`: aviso identifica a ocorrência de aplicação; CI correto derivado; não cria Outage adicional |

O Outage técnico foi criado com início `2026-11-08 13:20:02` UTC / `10:20:02` São Paulo. Message confirmado: `[OUTAGE Automático] - Assistido CAT ITEM`. Vínculo único em task_outage e task_number apontando ao INC.

Reabertura do formulário técnico com outro SI sem Outage e extensão Parcial confirmou tipo Degradation somente leitura, data inicial preenchida e dica visível abaixo do início. A dica foi convertida em Rich Text Label para permanecer visível após a divisão dos sets. Não foi realizado um segundo envio real para gerar Degradation; a derivação foi validada no servidor e no teste local.

Após os testes, o Outage de homologação foi encerrado, os três incidentes de teste cancelados e os quatro CIs criados exclusivamente para os testes aposentados. As evidências permanecem identificadas por `[TESTE SUITE TEC/BUS v1]`. Nenhum desses dados integra o XML.

## Verificações na instância

26 asserções aprovadas, incluindo 60 combinações de classificação. Resultado registrado em `tests/server-validation-result.json`.

- Serviço inválido e oferta de outro serviço rejeitados; oferta desconhecida aceita.
- Obrigatoriedade de funcionalidade parcial, ação/frequência na lentidão, descrição e esclarecimento para Total/Todos/Normal.
- Detecção de Outage vigente e reexecução do post-insert sem duplicar.
- CI principal e adicional distintos, sem relações task_ci duplicadas.
- Parcial deriva Degradation no servidor mesmo com tipo adulterado; início ausente e futuro rejeitados.
- Serviços/ofertas filtrados pela relação direta ao SI.
- Negócio não cria Outage; seleção com ocorrência existente atribui o CI correto.
- Message, fim vazio no momento da criação e associação INC/Outage conferidos.
- Producer legado, suas variáveis locais, scripts e núcleo compartilhado comparados com o baseline anterior às alterações: preservados.
- Os dois sets comuns estão vinculados ao novo item, que não tem variáveis locais.

## Testes do pacote

Comando: `npm test`, sem dependências externas.

| Teste | Cobertura | Resultado |
|---|---|---|
| validate.cjs | 60 combinações; IDs/escolhas inválidos; queries de Outage, janela e tipos | Passou |
| validate-outage-groups.cjs | Relação/direção/tipo; subclasses; deduplicação; exclusão de infraestrutura/indiretos; privacidade; recálculo no envio | Passou |
| validate-variable-editor.cjs | ACL e guest no endpoint; rótulos históricos; valores preservados; 16 campos somente leitura; condições | Passou |
| validate-syntax.cjs | Parse dos 41 arquivos JS; papel itil; adicionais distintos; tipo derivado; UTC/início futuro; ocorrência existente | Passou |
| validate-package.py | 155 payloads e hashes; 2 producers; 7 sets/2 compartilhados; 13 variáveis comuns; escolhas, vínculos e ausência de dados de execução | Passou |

Os três primeiros testes derivam da suíte do pacote original e foram adaptados aos caminhos e ao novo Ajax de negócio, mantendo seus cenários. O teste de sintaxe trata o controller de widget como expressão de função, conforme o formato nativo do Service Portal.

## Limites da homologação

- Não houve importação/Preview/Commit em outra instância.
- Não foi feita nova rodada de submissão real com conta não administrativa. Os testes locais cobrem verificações de papel, guest e ACL, mas não substituem a homologação do público no destino.
- Não foi executado teste simultâneo de carga para a reserva por SI. Foram conferidas a chave primária, a rechecagem e a idempotência sequencial.
- O grupo responsável não é fixado pelo pacote. O encaminhamento de um CI com grupo preenchido deve ser conferido com as regras nativas/configuradas da instância de destino; os CIs isolados de teste não comprovam esse roteamento.
- Responsividade em dispositivos móveis e acessibilidade completa não foram auditadas.
