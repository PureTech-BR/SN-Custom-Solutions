# Modelo de dados

A V2 usa três campos existentes em `service_availability`, sem tabela customizada.

| Campo | Rótulo | Tipo | Conteúdo |
|---|---|---|---|
| `u_total_degradation` | Total degradation | glide_duration | Duração líquida degradada no modo selecionado |
| `u_absolute_degradation` | Total degradation % | decimal | Percentual, armazenado com duas casas no campo existente |
| `u_absolute_degradation_count` | Total degradation periods | integer | Trechos resultantes com duração elegível positiva |

O nome técnico `u_absolute_degradation` foi mantido por compatibilidade. Quando `usecommitment=true`, seu valor representa o percentual dentro da agenda efetiva. O modo não é armazenado em um quarto campo; por isso é necessário sincronizar a base após alterar a configuração.

| Estado | Duração/contagem | Percentual e indicador |
|---|---|---|
| Registro criado ou entradas invalidadas, antes do evento | Vazios | Vazio; sem indicador |
| Cálculo válido sem degradação, com base positiva | Zero | 0%; cor configurada para zero |
| Cálculo com degradação | Valores apurados | Percentual e cor da faixa |
| Agenda sem horário elegível no intervalo | Zero | Vazio; sem indicador, divisão não definida |

Percentual vazio não distingue sozinho ausência de processamento, falha e base zero; consultar contexto e logs. O booleano `u_degradation_calculated` não é lido nem escrito por componentes V2 e não está no XML. Se já existir da V1, permanece sem função na V2 para permitir reversão.

Os campos nativos de disponibilidade, downtime, compromisso atendido e métricas OOTB não são alterados pelo motor complementar. A gravação atualiza os três resultados e os metadados nativos de controle `sys_mod_count`, `sys_updated_on` e `sys_updated_by`.

Os metadados completos dos campos estão em `fields.json`; as três configurações estão em `properties.json`.
