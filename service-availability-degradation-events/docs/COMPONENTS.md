# Componentes do Update Set

**26 Customer Updates, somente recursos válidos da solução atual.**

| Grupo | Quantidade | Uso |
|---|---:|---|
| BRs | 3 | Captura de Outage, vínculo e disponibilidade |
| Script Includes | 2 | Motor e cores |
| Script Actions | 2 | Evento customizado e sincronização nativa 200 |
| Event Registry | 1 | aoop.degradation.recalculate |
| Fix Script | 1 | Carga inicial e reprocessamento manual |
| Client Script | 1 | Ícone no formulário |
| Field Styles | 4 | Bolinhas na lista |
| Dicionário | 3 | Três resultados customizados |
| Rótulos | 6 | Português e inglês para os três campos |
| Properties | 3 | Chave geral, modo e cores |

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
| `sys_script` | AOOP - Degradation V2 - Affected CI | Ativo |
| `sys_script` | AOOP - Degradation V2 - Availability | Ativo |
| `sys_script` | AOOP - Degradation V2 - Outage | Ativo |
| `sys_script_client` | AOOP - Degradation V2 - Percentage color | Ativo |
| `sys_script_fix` | AOOP - Degradation V2 - Initial sync | Configurado |
| `sys_script_include` | AOOP_DegradationEventColors | Ativo |
| `sys_script_include` | AOOP_DegradationEventEngine | Ativo |
| `sys_ui_style` | service_availability — 7fd6507d | Configurado |
| `sys_ui_style` | service_availability — c4e6507d | Configurado |
| `sys_ui_style` | service_availability — c4e6907d | Configurado |
| `sys_ui_style` | service_availability — c8e6507d | Configurado |
| `sysevent_register` | aoop.degradation.recalculate | Configurado |
| `sysevent_script_action` | AOOP - Degradation V2 - Native sync | Ativo |
| `sysevent_script_action` | AOOP - Degradation V2 - Recalculate | Ativo |

## Gatilhos

As três BRs usam before, ordem 900. Outage e vínculo cobrem insert/update/delete; disponibilidade cobre insert/update de suas entradas. A property geral é avaliada antes da captura.

As Script Actions são `Recalculate`, ordem 100 em `aoop.degradation.recalculate`, e `Native sync`, ordem 200 em `spm.availability.calculate`. Não há BR na property de modo.

## Instalação independente

Não há registros inativos, componentes da solução anterior, Scheduled Job, campo `u_degradation_calculated` ou pacote de migração/reversão. Outages, disponibilidades calculadas, agendas, dados de teste e componentes OOTB também não são transportados.
