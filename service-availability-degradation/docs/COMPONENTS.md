# Inventário dos componentes

O pacote contém **29 Customer Updates**. Inclui quatro campos de `service_availability` e sete rótulos, transportados separadamente.

| Tipo | Nome | Função | Definição na origem |
|---|---|---|---|
| sys_script_include | AOOP_ServiceAvailabilityDegradation | Seleciona disponibilidades por Degradation encerrada; calcula degradação menos Planned; ignora o tipo Outage. | [9485eb19c3e8d358e079b13ed40131c5](https://dev437951.service-now.com/sys_script_include.do?sys_id=9485eb19c3e8d358e079b13ed40131c5) |
| sys_script | AOOP - Degradation - Outage change | Captura inclusão/alteração de Degradation ou Planned e envia intervalos/CIs anteriores e atuais. | [28852f19c3e8d358e079b13ed4013131](https://dev437951.service-now.com/sys_script.do?sys_id=28852f19c3e8d358e079b13ed4013131) |
| sys_script | AOOP - Degradation - Outage deletion | Captura exclusão de Degradation ou Planned antes da remoção do registro. | [60852f19c3e8d358e079b13ed401313a](https://dev437951.service-now.com/sys_script.do?sys_id=60852f19c3e8d358e079b13ed401313a) |
| sys_script | AOOP - Degradation - Mode change | Detecta mudança efetiva da property usecommitment e envia evento. | [645388a5c3a41758e079b13ed40131ee](https://dev437951.service-now.com/sys_script.do?sys_id=645388a5c3a41758e079b13ed40131ee) |
| sys_script | AOOP - Degradation - Affected CI deletio | Captura remoção de CI afetado de Degradation ou Planned antes da exclusão do vínculo. | [74852f19c3e8d358e079b13ed401314a](https://dev437951.service-now.com/sys_script.do?sys_id=74852f19c3e8d358e079b13ed401314a) |
| sys_script | AOOP - Degradation - Availability inputs | Em before, limpa resultados do próprio registro quando entradas mudam. | [bc852f19c3e8d358e079b13ed401315e](https://dev437951.service-now.com/sys_script.do?sys_id=bc852f19c3e8d358e079b13ed401315e) |
| sys_script | AOOP - Degradation - Affected CI change | Captura inclusão/alteração de CI afetado de Degradation ou Planned. | [e0852f19c3e8d358e079b13ed4013142](https://dev437951.service-now.com/sys_script.do?sys_id=e0852f19c3e8d358e079b13ed4013142) |
| sysevent_register | aoop.degradation.mode_changed | Registro do evento assíncrono. | [945388a5c3a41758e079b13ed4013170](https://dev437951.service-now.com/sysevent_register.do?sys_id=945388a5c3a41758e079b13ed4013170) |
| sysevent_register | aoop.availability.degradation.invalidate | Registro do evento assíncrono. | [e485eb19c3e8d358e079b13ed40131cb](https://dev437951.service-now.com/sysevent_register.do?sys_id=e485eb19c3e8d358e079b13ed40131cb) |
| sysevent_script_action | AOOP - Degradation - Mode invalidation | Consome o evento e chama o método do motor. | [645388a5c3a41758e079b13ed40131e8](https://dev437951.service-now.com/sysevent_script_action.do?sys_id=645388a5c3a41758e079b13ed40131e8) |
| sysevent_script_action | AOOP - Degradation - Invalidate affected | Consome o evento e chama o método do motor. | [a4852f19c3e8d358e079b13ed401312a](https://dev437951.service-now.com/sysevent_script_action.do?sys_id=a4852f19c3e8d358e079b13ed401312a) |
| sysauto_script | AOOP - Service Availability - Calculate degradation | Job diário 06h00 São Paulo; parte apenas de Degradation encerrada; limites de 500 lotes/10min. | [70852f19c3e8d358e079b13ed4013167](https://dev437951.service-now.com/sysauto_script.do?sys_id=70852f19c3e8d358e079b13ed4013167) |
| sys_script_fix | AOOP - Degradation - Reprocess scope | Reprocessamento direcionado por CI/Oferta e intervalo; simulação por padrão. | [0348a795c32cd358e079b13ed40131ab](https://dev437951.service-now.com/sys_script_fix.do?sys_id=0348a795c32cd358e079b13ed40131ab) |
| sys_properties | aoop_service_availability_degradation_max_runtime_seconds | Configuração ou cursor de execução. | [0885ab19c3e8d358e079b13ed40131ed](https://dev437951.service-now.com/sys_properties.do?sys_id=0885ab19c3e8d358e079b13ed40131ed) |
| sys_properties | aoop_service_availability_degradation_batch_size | Configuração ou cursor de execução. | [7375ab19c3e8d358e079b13ed40131e5](https://dev437951.service-now.com/sys_properties.do?sys_id=7375ab19c3e8d358e079b13ed40131e5) |
| sys_properties | aoop_service_availability_degradation_cursor | Configuração ou cursor de execução. | [8085eb19c3e8d358e079b13ed4013134](https://dev437951.service-now.com/sys_properties.do?sys_id=8085eb19c3e8d358e079b13ed4013134) |
| sys_properties | aoop_service_availability_calculate_degradation | Configuração ou cursor de execução. | [d775ab19c3e8d358e079b13ed4013189](https://dev437951.service-now.com/sys_properties.do?sys_id=d775ab19c3e8d358e079b13ed4013189) |
| sys_properties | aoop_service_availability_degradation_usecommitment | Configuração ou cursor de execução. | [e775ab19c3e8d358e079b13ed401319e](https://dev437951.service-now.com/sys_properties.do?sys_id=e775ab19c3e8d358e079b13ed401319e) |
| sys_dictionary | u_total_degradation | Definição do campo em service_availability. | [01838359c3ec9358e079b13ed401317d](https://dev437951.service-now.com/sys_dictionary.do?sys_id=01838359c3ec9358e079b13ed401317d) |
| sys_dictionary | u_absolute_degradation | Definição do campo em service_availability. | [19f4cb59c3ec9358e079b13ed40131ff](https://dev437951.service-now.com/sys_dictionary.do?sys_id=19f4cb59c3ec9358e079b13ed40131ff) |
| sys_dictionary | u_degradation_calculated | Definição do campo em service_availability. | [72752f59c3a8d358e079b13ed4013167](https://dev437951.service-now.com/sys_dictionary.do?sys_id=72752f59c3a8d358e079b13ed4013167) |
| sys_dictionary | u_absolute_degradation_count | Definição do campo em service_availability. | [e7b5c35dc320d358e079b13ed4013138](https://dev437951.service-now.com/sys_dictionary.do?sys_id=e7b5c35dc320d358e079b13ed4013138) |
| sys_documentation | u_degradation_calculated [en] | Rótulo e ajuda do campo. | [03756b19c3e8d358e079b13ed40131ae](https://dev437951.service-now.com/sys_documentation.do?sys_id=03756b19c3e8d358e079b13ed40131ae) |
| sys_documentation | u_absolute_degradation [en] | Rótulo e ajuda do campo. | [1b3583d9c320d358e079b13ed40131aa](https://dev437951.service-now.com/sys_documentation.do?sys_id=1b3583d9c320d358e079b13ed40131aa) |
| sys_documentation | u_absolute_degradation_count [en] | Rótulo e ajuda do campo. | [4c560fddc320d358e079b13ed40131da](https://dev437951.service-now.com/sys_documentation.do?sys_id=4c560fddc320d358e079b13ed40131da) |
| sys_documentation | u_total_degradation [pb] | Rótulo e ajuda do campo. | [6244cb95c320d358e079b13ed4013193](https://dev437951.service-now.com/sys_documentation.do?sys_id=6244cb95c320d358e079b13ed4013193) |
| sys_documentation | u_absolute_degradation [pb] | Rótulo e ajuda do campo. | [a475031dc320d358e079b13ed40131b3](https://dev437951.service-now.com/sys_documentation.do?sys_id=a475031dc320d358e079b13ed40131b3) |
| sys_documentation | u_total_degradation [en] | Rótulo e ajuda do campo. | [cdc38715c320d358e079b13ed40131d1](https://dev437951.service-now.com/sys_documentation.do?sys_id=cdc38715c320d358e079b13ed40131d1) |
| sys_documentation | u_absolute_degradation_count [pb] | Rótulo e ajuda do campo. | [d896cb95c320d358e079b13ed40131f1](https://dev437951.service-now.com/sys_documentation.do?sys_id=d896cb95c320d358e079b13ed40131f1) |

## Escopo dos componentes

A seleção do job exige **Degradation encerrada**. As BRs de eventos também acompanham **Planned** para invalidar resultados quando o desconto muda. **Outage** não integra o cálculo complementar; uma mudança de tipo é avaliada pelos estados anterior e atual. Consulte a [matriz de tipos](ARCHITECTURE.md#escopo-por-tipo-de-evento).

## Referências técnicas

- [components.json](../components.json): identificadores, gatilhos, condições e caminhos dos fontes.
- [fields.json](../fields.json): tipos, defaults e identificação dos quatro campos.
- [properties.json](../properties.json): configurações capturadas.
- [src/](../src/): scripts efetivamente capturados no XML.

As BRs de Outage/CI afetado dependem de operações com execução normal de Business Rules. Escritas feitas com supressão de workflow podem não emitir os eventos; nesses casos, solicite reprocessamento direcionado.

Nenhum Customer Update de AvailabilityCalculatorV2, AvailabilitySummarizerV2, AvailabilityRecord, AvailabilityUtils, do botão Recalculate results ou do relacionamento Outages During Interval integra este pacote.

