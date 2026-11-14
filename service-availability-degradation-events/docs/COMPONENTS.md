# Componentes do Update Set

**44 Customer Updates: 26 itens da solução atual + 18 desativações da V1.**

| Grupo | Quantidade | Uso |
|---|---:|---|
| BRs V2 | 3 | Captura de Outage, vínculo e disponibilidade |
| Script Includes V2 | 2 | Motor e cores |
| Script Actions V2 | 2 | Evento customizado e sincronização nativa 200 |
| Event Registry | 1 | aoop.degradation.recalculate |
| Fix Script V2 | 1 | Carga inicial e recuperação manual |
| Client Script V2 | 1 | Ícone no formulário |
| Field Styles V2 | 4 | Bolinhas na lista |
| Dicionário | 3 | Três resultados customizados |
| Rótulos | 6 | Português e inglês para os três campos |
| Properties | 3 | Chave geral, modo e cores |
| Registros legados desativados | 18 | Impedir execução simultânea da V1 |

## Inventário completo

| Tipo | Componente / alvo | Estado no pacote |
|---|---|---|
| `sys_dictionary` | Service Availability.Total degradation | Ativo |
| `sys_dictionary` | Service Availability.Total degradation % | Ativo |
| `sys_dictionary` | Service Availability.Total degradation periods | Ativo |
| `sys_documentation` | Service Availability.Total degradation [en] | Configurado |
| `sys_documentation` | Service Availability.Total degradation [pb] | Configurado |
| `sys_documentation` | Service Availability.Total degradation % [en] | Configurado |
| `sys_documentation` | Service Availability.Total degradation % [pb] | Configurado |
| `sys_documentation` | Service Availability.Total degradation periods [en] | Configurado |
| `sys_documentation` | Service Availability.Total degradation periods [pb] | Configurado |
| `sys_properties` | aoop_service_availability_calculate_degradation | Configurado |
| `sys_properties` | aoop_service_availability_degradation_color_ranges | Configurado |
| `sys_properties` | aoop_service_availability_degradation_usecommitment | Configurado |
| `sys_script` | AOOP - Degradation - Affected CI change | Inativo |
| `sys_script` | AOOP - Degradation - Affected CI deletio | Inativo |
| `sys_script` | AOOP - Degradation - Availability inputs | Inativo |
| `sys_script` | AOOP - Degradation - Color configuration | Inativo |
| `sys_script` | AOOP - Degradation - Display colors | Inativo |
| `sys_script` | AOOP - Degradation - Mode change | Inativo |
| `sys_script` | AOOP - Degradation - Outage change | Inativo |
| `sys_script` | AOOP - Degradation - Outage deletion | Inativo |
| `sys_script` | AOOP - Degradation V2 - Affected CI | Ativo |
| `sys_script` | AOOP - Degradation V2 - Availability | Ativo |
| `sys_script` | AOOP - Degradation V2 - Outage | Ativo |
| `sys_script_client` | AOOP - Degradation - Percentage color | Inativo |
| `sys_script_client` | AOOP - Degradation V2 - Percentage color | Ativo |
| `sys_script_fix` | AOOP - Degradation V2 - Initial sync | Configurado |
| `sys_script_include` | AOOP_DegradationColorConfig | Inativo |
| `sys_script_include` | AOOP_DegradationEventColors | Ativo |
| `sys_script_include` | AOOP_DegradationEventEngine | Ativo |
| `sys_script_include` | AOOP_ServiceAvailabilityDegradation | Inativo |
| `sys_ui_style` | service_availability — 13e62025 | Legado: condição javascript:false |
| `sys_ui_style` | service_availability — 13e62025 | Legado: condição javascript:false |
| `sys_ui_style` | service_availability — 7fd6507d | V2: indicador configurado |
| `sys_ui_style` | service_availability — 93e62025 | Legado: condição javascript:false |
| `sys_ui_style` | service_availability — c4e6507d | V2: indicador configurado |
| `sys_ui_style` | service_availability — c4e6907d | V2: indicador configurado |
| `sys_ui_style` | service_availability — c8e6507d | V2: indicador configurado |
| `sys_ui_style` | service_availability — d3e66c2d | Legado: condição javascript:false |
| `sysauto_script` | AOOP - Service Availability - Calculate degradation | Inativo |
| `sysevent_register` | aoop.degradation.recalculate | Configurado |
| `sysevent_script_action` | AOOP - Degradation - Invalidate affected | Inativo |
| `sysevent_script_action` | AOOP - Degradation - Mode invalidation | Inativo |
| `sysevent_script_action` | AOOP - Degradation V2 - Native sync | Ativo |
| `sysevent_script_action` | AOOP - Degradation V2 - Recalculate | Ativo |

## BRs e Script Actions

As BRs V2 são before, ordem 900. Outage e vínculo cobrem insert/update/delete; disponibilidade cobre insert/update de entradas. As condições verificam a chave geral antes de chamar os métodos de seleção do motor.

As Script Actions são: `Recalculate`, ordem 100, em `aoop.degradation.recalculate`; `Native sync`, ordem 200, em `spm.availability.calculate`. Não há BR ativa observando a property de modo.

## Legado e dependências

O grupo legado contém oito BRs (incluindo duas experimentais já inativas), dois Script Includes, duas Script Actions, um job, um Client Script e quatro estilos. A V2 usa somente seus novos componentes ativos. Os registros legados ainda podem conter referências à implementação anterior, mas estão desativados.

Não são transportados Outages, disponibilidades calculadas, agendas, dados de teste nem componentes OOTB. O atributo legado `u_degradation_calculated` não está no dicionário do pacote.
