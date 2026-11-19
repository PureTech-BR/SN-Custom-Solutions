# Dashboard de Disponibilidade de Serviços e Ofertas

Inventário conferido na instância em **19/11/2026**, após os ajustes do dashboard. Esta documentação descreve a configuração efetivamente capturada nessa data.

- Dashboard: **NTT - Disponibilidade de Serviços e Ofertas**.
- Identificador: `a0b869a7c3d45b94e079b13ed4013122`.
- [Abrir dashboard](https://dev437951.service-now.com/now/platform-analytics-workspace/dashboards/params/edit/false/sys-id/a0b869a7c3d45b94e079b13ed4013122).
- [Abrir Update Set concluído](https://dev437951.service-now.com/sys_update_set.do?sys_id=4c839edbc3e49fd8e079b13ed401314f).
- Update Set: **NTT - Dashboard Disponibilidade de Serviços e Ofertas - 2026-11-19**, aplicação **Global**, estado **Complete**, **33 Customer Updates**.
- [Configuração dos 22 componentes](dashboard_configuration.json): fotografia técnica das propriedades dos 14 reports/visualizações, 6 filtros e 2 títulos. Esse JSON serve para consulta e comparação; a importação entre instâncias deve usar o XML nativo do Update Set.

## O que o dashboard faz

Apresenta os resultados de disponibilidade das ofertas e permite analisá-los pelo serviço ao qual pertencem. A fonte principal é `service_availability`; os resultados continuam sendo calculados pelo processo nativo.

Neste dashboard, os “reports” são visualizações configuradas diretamente no Platform Analytics e armazenadas no layout/propriedades dos widgets. Não foi encontrada referência a um report clássico `sys_report` nas fontes dos 22 componentes inventariados. O transporte foi feito pelo comando nativo **Add to Update Set / Unload Dashboard**, preservando essas configurações.

`scheduled_availability` é a disponibilidade realizada considerando o compromisso; `absolute_availability` é a disponibilidade absoluta. A média desses campos não representa a meta contratada. Agregar por `service_offering.parent` também não cria um novo resultado nativo de disponibilidade para o serviço.

## Reports: o que mostram e como foram montados

Todos os 14 componentes de dados estão com `followFilters=true` e `filterConfigurations=@state.parFilters`. Os filtros da fonte abaixo se somam aos filtros interativos.

### 1. Maior Downtime - Período

Mostra o maior tempo de indisponibilidade dentro do compromisso entre os registros selecionados. É o pior resultado individual do recorte; não é soma nem união dos outages do serviço.

- **Formato:** Card de valor único.
- **Fonte:** `service_availability`.
- **Montagem:** `MAX(scheduled_downtime)`; sem agrupamento.
- **Filtro fixo:**

```text
service_offeringISNOTEMPTY^service_commitmentISNOTEMPTY^absolute_downtime>=javascript:gs.getDurationDate('0 0:0:1')
```

- **Widget:** `3cf7194fc328d7d8e079b13ed401314a`.

**Observação da revisão:** o texto de descrição salvo no widget ainda menciona média. A operação configurada é `MAX(scheduled_downtime)`; esta documentação segue a operação real. O filtro mínimo de um segundo usa `absolute_downtime`, enquanto a métrica usa `scheduled_downtime`. A descrição foi preservada no pacote.

### 2. Média Compromisso (%)

Mostra a média da disponibilidade realizada dentro das janelas dos compromissos. O nome não significa média das metas contratadas.

- **Formato:** Card de valor único.
- **Fonte:** `service_availability`.
- **Montagem:** `AVG(scheduled_availability)`; sem agrupamento.
- **Filtro fixo:**

```text
service_offeringISNOTEMPTY^service_commitmentISNOTEMPTY
```

- **Widget:** `30f7194fc328d7d8e079b13ed4013161`.

### 3. Média Disponibilidade (%)

Mostra a média da disponibilidade absoluta dos resultados selecionados, sem limitar o percentual à janela do compromisso.

- **Formato:** Card de valor único.
- **Fonte:** `service_availability`.
- **Montagem:** `AVG(absolute_availability)`; sem agrupamento.
- **Filtro fixo:**

```text
service_offeringISNOTEMPTY^service_commitmentISNOTEMPTY
```

- **Widget:** `bcf7194fc328d7d8e079b13ed401315c`.

### 4. Média Compromisso (%) - Pelo Serviço

Mostra, mês a mês e por serviço parent, a média da disponibilidade realizada nos compromissos das ofertas. É uma média dos registros das ofertas; não recalcula uma disponibilidade única do serviço.

- **Formato:** Série temporal; variação `stacked`.
- **Fonte:** `service_availability`.
- **Montagem:** `AVG(scheduled_availability)`, agrupado por `service_offering.parent`.
- **Eixo de tempo:** `start`, frequência `month`, calendário `standard`.
- **Filtro fixo:**

```text
service_offeringISNOTEMPTY^service_commitmentISNOTEMPTY
```

- **Widget:** `e14dca53c3a49fd8e079b13ed40131b6`.

### 5. Compromissos atendidos

Conta resultados de apuração que atenderam ao compromisso. Uma oferta e um mesmo compromisso podem contribuir com vários resultados em períodos diferentes.

- **Formato:** Card de valor único.
- **Fonte:** `service_availability`.
- **Montagem:** `COUNT(*)`; sem agrupamento.
- **Filtro fixo:**

```text
met_commitment=true^service_offeringISNOTEMPTY
```

- **Widget:** `f689a9efc3d45b94e079b13ed4013164`.

### 6. Compromissos violados

Conta resultados de apuração que não atenderam ao compromisso. Não é contagem distinta de ofertas nem de definições de compromisso.

- **Formato:** Card de valor único.
- **Fonte:** `service_availability`.
- **Montagem:** `COUNT(*)`; sem agrupamento.
- **Filtro fixo:**

```text
met_commitment=false^service_offeringISNOTEMPTY
```

- **Widget:** `e12bede7c3185b94e079b13ed401314f`.

### 7. Outages Relacionados

Conta outages distintos vinculados às ofertas e sobrepostos às janelas das apurações selecionadas. O mesmo outage entra uma vez no total, mesmo quando a view retorna várias linhas.

- **Formato:** Card de valor único.
- **Fonte:** `u_availability_related_outage`.
- **Montagem:** `COUNT DISTINCT(out_sys_id)`; sem agrupamento.
- **Filtro fixo:**

```text
av_service_offeringISNOTEMPTY^av_service_commitmentISNOTEMPTY^out_sys_idISNOTEMPTY^out_type=outage^out_beginISNOTEMPTY^out_endISNOTEMPTY
```

- **Widget:** `f8d061c7c32cd7d8e079b13ed40131b9`.

### 8. Média do % de Disponibilidade - Compromisso

Compara as ofertas pela média da disponibilidade realizada dentro da janela do compromisso.

- **Formato:** Gráfico de barras; variação `stacked`.
- **Fonte:** `service_availability`.
- **Montagem:** `AVG(scheduled_availability)`, agrupado por `service_offering`.
- **Filtro fixo:**

```text
service_commitmentISNOTEMPTY^service_offeringISNOTEMPTY
```

- **Widget:** `7466352bc31c5b94e079b13ed4013105`.

### 9. Soma de Indisponibilidade - Compromisso

Compara as ofertas pelo total de downtime considerado nas janelas dos compromissos. A soma acumula os resultados selecionados; não deduplica intervalos entre ofertas ou compromissos.

- **Formato:** Gráfico de barras; variação `stacked`.
- **Fonte:** `service_availability`.
- **Montagem:** `SUM(scheduled_downtime)`, agrupado por `service_offering`.
- **Filtro fixo:**

```text
service_commitmentISNOTEMPTY^service_offeringISNOTEMPTY
```

- **Widget:** `b466792bc31c5b94e079b13ed40131c5`.

### 10. Média de % Disponibilidade - Por Oferta

Mostra a evolução mensal da média de disponibilidade absoluta de cada oferta.

- **Formato:** Série temporal; variação `stacked`.
- **Fonte:** `service_availability`.
- **Montagem:** `AVG(absolute_availability)`, agrupado por `service_offering`.
- **Eixo de tempo:** `start`, frequência `month`, calendário `standard`.
- **Filtro fixo:**

```text
service_commitmentISNOTEMPTY^service_offeringISNOTEMPTY
```

- **Widget:** `7866792bc31c5b94e079b13ed40131c9`.

### 11. Downtime Total x Downtime do Compromisso

Compara, por oferta, a soma do downtime absoluto com a soma do downtime dentro do compromisso.

- **Formato:** Gráfico de barras; variação `grouped`.
- **Fonte:** `service_availability`.
- **Montagem:** `SUM(scheduled_downtime); SUM(absolute_downtime)`, agrupado por `service_offering`.
- **Filtro fixo:**

```text
service_commitmentISNOTEMPTY^service_offeringISNOTEMPTY
```

- **Widget:** `fc66b92bc31c5b94e079b13ed401310b`.

### 12. Evolução da disponibilidade por oferta - Baseado no Compromisso

Mostra a evolução mensal da média de disponibilidade no compromisso de cada oferta.

- **Formato:** Série temporal; variação `stacked`.
- **Fonte:** `service_availability`.
- **Montagem:** `AVG(scheduled_availability)`, agrupado por `service_offering`.
- **Eixo de tempo:** `start`, frequência `month`, calendário `standard`.
- **Filtro fixo:**

```text
service_commitmentISNOTEMPTY^service_offeringISNOTEMPTY
```

- **Widget:** `b066b92bc31c5b94e079b13ed4013110`.

### 13. Histórico detalhado de disponibilidade

Lista os resultados nativos de disponibilidade para investigar oferta, compromisso, período, percentuais, downtime e atendimento.

- **Formato:** Lista de registros.
- **Fonte:** `service_availability`.
- **Montagem:** lista de registros; as colunas definem a apresentação. A configuração mantém uma métrica herdada (`AVG(scheduled_availability)`), mas a lista exibe os registros individuais..
- **Colunas:** `service_offering,service_commitment,start,end,type,absolute_downtime,absolute_availability,scheduled_availability,scheduled_downtime,met_commitment`.
- **Paginação:** 20 registros por página; opção de visualizar todos habilitada.
- **Filtro fixo:**

```text
service_commitmentISNOTEMPTY^service_offeringISNOTEMPTY
```

- **Widget:** `f466b92bc31c5b94e079b13ed4013114`.

### 14. Resultados com compromisso violado

Lista somente as apurações com compromisso violado para apoiar a investigação dos resultados.

- **Formato:** Lista de registros.
- **Fonte:** `service_availability`.
- **Montagem:** lista de registros; as colunas definem a apresentação. A configuração mantém uma métrica herdada (`AVG(scheduled_availability)`), mas a lista exibe os registros individuais..
- **Colunas:** `service_offering,service_commitment,start,end,type,scheduled_downtime,scheduled_availability,absolute_downtime,absolute_availability,met_commitment,allowed_downtime`.
- **Paginação:** 20 registros por página; opção de visualizar todos habilitada.
- **Filtro fixo:**

```text
service_commitmentISNOTEMPTY^service_offeringISNOTEMPTY^met_commitment=false
```

- **Widget:** `bc66b92bc31c5b94e079b13ed4013156`.

## Filtros incluídos

Os seis filtros são componentes do layout e estão capturados no Update Set. Seus destinos incluem as duas fontes do dashboard:

| Filtro | Campo em service_availability | Campo em u_availability_related_outage | Padrão salvo |
|---|---|---|---|
| Serviço | `service_offering.parent.name` | `av_service_offering.parent.name` | Sem seleção |
| Oferta | `service_offering` | `av_service_offering` | Sem seleção |
| Tipo de apuração | `type` | `av_type` | Monthly (`monthly`) |
| Compromisso | `service_commitment` | `av_service_commitment` | Sem seleção |
| Período de apuração | `start` | `av_start` | Sem intervalo padrão |
| Fuso horário | `time_zone` | `av_time_zone` | Sem seleção |

Serviço, Oferta, Tipo, Compromisso e Fuso são seleções únicas; Período é um filtro de data. O máximo configurado de opções é 500, com ordenação ascendente. Todos usam o escopo da aba `68b869e7c3d45b94e079b13ed401316a`.

### Serviço e Oferta

O filtro Serviço obtém os nomes a partir de `service_availability.service_offering.parent.name`. Também publica o destino `service_offering.parent.name` na tabela de ofertas. O filtro Oferta segue o filtro Serviço pela configuração `cascadingConfig.filtersFollowing`.

A fonte de Oferta é `service_offering`, restrita às ofertas com associação a compromisso:

```text
^RLQUERYservice_offering_commitment.service_offering,>=1,m2m^ENDRLQUERY
```

O filtro Serviço usa o **nome** do parent para parte dos destinos. Serviços com nomes iguais podem compartilhar o mesmo recorte; a configuração foi transportada como estava.

### Período, fuso e estado de navegação

Período filtra o **início da apuração**, e a view procura outages que se sobreponham a essa janela de apuração. Isso não equivale a filtrar diretamente o início do outage pelo intervalo escolhido.

O fuso seleciona os registros com aquele `time_zone`; não altera a definição do compromisso.

As seleções observadas na sessão — por exemplo, serviço, últimos seis meses e fuso — não são todas valores padrão do layout. O link fornecido também contém um estado de navegação `__state__` com query de lista. Não se deve tratar esse estado temporário como configuração persistida dos filtros. O padrão explicitamente salvo no componente Tipo é Monthly; os demais componentes não possuem seleção padrão nessa fotografia.

## Database View

- Nome: `u_availability_related_outage`.
- Label: **Disponibilidade — Outages relacionados**.
- Identificador: `f07ca50fc3201bd8e079b13ed401312f`.
- Aplicação: Global.
- Finalidade: relacionar a apuração da oferta aos outages vinculados à oferta por MTOM e sobrepostos à janela.

| Ordem | Tabela | Prefixo | Where clause |
|---|---|---|---|
| 100 | `service_availability` | `av` | Sem condição na tabela inicial |
| 200 | `cmdb_outage_ci_mtom` | `rel` | `rel_ci_item = av_service_offering` |
| 300 | `cmdb_ci_outage` | `out` | `out_sys_id = rel_outage && out_begin < av_end && out_end > av_start` |

O join exige sobreposição real: o outage começa antes do fim da apuração e termina depois do início. Um outage que apenas encosta na fronteira não atende às desigualdades.

O card aplica ainda `out_type=outage` e exige início/fim preenchidos. Assim, degradações e outages sem término não entram nesse card.

A view pode repetir o mesmo outage por oferta, compromisso ou período; por isso o card usa contagem distinta de `out_sys_id`. Essa deduplicação identifica o registro de outage e não une intervalos de outages diferentes. A view não calcula downtime dentro do calendário do compromisso: ela identifica vínculos e sobreposição com a janela da apuração.

As somas e médias de disponibilidade continuam sobre `service_availability`, evitando multiplicação dos resultados pelos joins da view.

## Conteúdo do Update Set

| Tabela de configuração | Quantidade | O que transporta |
|---|---:|---|
| `par_dashboard` | 1 | Registro do dashboard |
| `par_dashboard_canvas` | 2 | Layout da aba e canvas adicional vazio |
| `par_dashboard_tab` | 1 | Aba New Tab 21 |
| `par_dashboard_visibility` | 1 | Configuração de visibilidade existente |
| `par_dashboard_widget` | 22 | 14 visualizações, 6 filtros e 2 títulos |
| `sys_metadata_link` | 2 | Snapshots de metadados do dashboard |
| `sys_db_view` | 1 | Definição da Database View |
| `sys_db_view_table` | 3 | Tabelas, prefixos e condições dos joins |
| **Total** | **33** | **Customer Updates conferidos na origem** |

O canvas adicional possui `layout=[]` e foi mantido porque faz parte do transporte nativo. As seis definições de filtros e seus mapeamentos estão tanto nas configurações dos componentes quanto no layout capturado.

Os dados de serviços, ofertas, compromissos, associações a compromissos, resultados de disponibilidade, outages e associações MTOM não são entregues pelo pacote. Não foram incluídas alterações nos cálculos nativos ou nos campos de degradação.

## Exportação e instalação

O Update Set foi marcado **Complete** na origem. A ação nativa **Export to XML** foi acionada, porém o Chrome exibiu **ERR_BLOCKED_BY_CLIENT**. O XML exportado não foi obtido nem incluído neste diretório. O JSON de configuração não substitui esse XML.

Para exportar, abrir o Update Set pelo link acima e usar **Export to XML** em um navegador no qual o download esteja permitido. No destino:

1. Confirmar a disponibilidade do Platform Analytics e das tabelas/campos usados nas fontes.
2. Importar o XML em **Retrieved Update Sets**.
3. Executar **Preview Update Set**, revisar dependências e colisões e então realizar o commit conforme o processo do ambiente.
4. Conferir usuários referenciados nos metadados e a visibilidade transportada. Não foram concedidas novas permissões durante o empacotamento.
5. Validar as 14 visualizações e os seis filtros, incluindo Serviço → Oferta e o mapeamento para a view.
6. Conferir o card Outages Relacionados com um outage ligado a mais de uma oferta: o valor deve considerar o mesmo `out_sys_id` uma vez no recorte.
7. Conferir o valor máximo de `scheduled_downtime`, as médias de percentuais e as contagens de `met_commitment` contra os resultados filtrados de `service_availability`.

## Validação realizada e limites

Foram conferidos os payloads de configuração do canvas, as métricas dos 14 componentes, os seis filtros e destinos, os joins da view, os 33 registros do pacote e o estado Complete. A inclusão do dashboard foi confirmada pelo ServiceNow como **Unload Dashboard**, e a inclusão da view informou as tabelas **Database View** e **View Table**.

Não foi realizada importação/Preview/Commit em uma segunda instância. A documentação registra a configuração capturada; os passos de instalação acima são a validação necessária no destino.

As médias são aritméticas por registro, sem ponderação por duração ou criticidade. As somas podem acumular períodos/compromissos sobrepostos. Para análises consistentes, manter um único tipo de apuração e um fuso coerente com os resultados desejados. O dashboard não aplica uma regra adicional de consolidação ou deduplicação temporal para calcular a disponibilidade única de um serviço.

