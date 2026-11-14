# Operação e manutenção

## Eventos considerados na operação

**Somente registros do tipo Degradation (`degradation`), encerrados e associados à Oferta/CI, tornam uma disponibilidade elegível para cálculo.** O job usa início e fim da degradação para selecionar disponibilidades sobrepostas com ponteiro `false`.

| Tipo em `cmdb_ci_outage.type` | Seleciona disponibilidades para cálculo? | Participação no cálculo complementar |
|---|---|---|
| **Degradation** — `degradation` | **Sim**, com início e fim preenchidos e sobreposição de duração positiva | Compõe o tempo degradado; períodos sobrepostos são unificados |
| **Planned** — `planned` | **Não** | Quando encerrado, desconta apenas o tempo sobreposto às degradações selecionadas |
| **Outage** — `outage` | **Não** | Não entra no cálculo, não é somado e não é descontado da degradação |

Uma disponibilidade com apenas Planned ou Outage não é calculada por esta solução. **Mudanças em Planned podem invalidar resultados existentes**, pois alteram o desconto, mas o recálculo continua exigindo uma Degradation elegível. A property de uso do compromisso altera a janela de medição, não os tipos de evento considerados.

## Properties incluídas

| Property | Valor do pacote | Uso |
|---|---|---|
| `aoop_service_availability_calculate_degradation` | `true` | Habilita cálculo por Degradation e invalidação por Degradation/Planned e entradas |
| `aoop_service_availability_degradation_usecommitment` | `false` | Alterna intervalo integral e agenda do compromisso |
| `aoop_service_availability_degradation_batch_size` | `100` | Tentativas por lote |
| `aoop_service_availability_degradation_max_runtime_seconds` | `30` | Orçamento de tempo por lote |
| `aoop_service_availability_degradation_cursor` | Vazio | Ponto de retomada por sys_id de Outage |

O motor limita batch size ao intervalo efetivo 1–1000 e tempo por lote a 1–300 segundos; valores inválidos usam defaults de 50 e 30. O job tem limites fixos de **500 lotes e 600.000 ms** no seu script, separados das properties.

## Agenda diária

O job está ativo, diário às **06h00, America/Sao_Paulo**, e processa lotes em sequência. Não aguarda outro dia entre lotes dentro da mesma execução. Ao atingir limite ou erro, mantém o cursor; a próxima execução retoma.

“Execute Now” inicia a mesma rotina e pode atualizar muitos resultados customizados. Evite acioná-lo simultaneamente à execução diária ou a um recálculo nativo amplo. A solução não implementa um bloqueio próprio de múltiplas execuções manuais.

## Mudança do modo

Ao salvar a property `usecommitment` com outro valor efetivo:
1. A BR envia `aoop.degradation.mode_changed`.
2. A Script Action chama `invalidateCalculatedForModeChange()`.
3. Resultados com ponteiro `true` são limpos e marcados `false`.
4. O cursor é reiniciado.
5. O job posterior aplica o modo atual.

Salvar o mesmo modo não envia evento. A limpeza é assíncrona: não espere que todos os resultados desapareçam no mesmo instante do salvamento. O evento lê o modo efetivamente atual para o log; trocas rápidas podem provocar invalidações adicionais, mas o cálculo sempre consulta a property vigente.

Essa invalidação ocorre mesmo com o habilitador principal em `false`, para evitar conservar resultados de um modo anterior quando o cálculo for retomado.

## Reprocessamento direcionado

Use o Fix Script `AOOP - Degradation - Reprocess scope`:
- `TARGET_CI`: sys_id da Oferta/CI.
- `BEGIN_UTC` e `END_UTC`: limites em UTC; fim posterior ao início.
- `DRY_RUN=true`: apenas conta os registros afetados.
- Após conferir, `DRY_RUN=false`: limpa resultados e marca pendente.

O Fix Script não calcula. O job selecionará somente disponibilidades alcançadas por **Degradation encerrada**. Invalidar um registro que tem apenas Planned ou Outage não fará o job calculá-lo.

Alterações de agenda, timezone, manutenção ou associação de compromisso exigem esse reprocessamento quando não modificam diretamente as entradas do registro de disponibilidade. Não há BR de configuração de agenda nesta versão.

Se o habilitador ficou desativado enquanto Outages/vínculos mudavam, revalide e invalide o escopo afetado ao retomar. A reativação do habilitador não reconstrói automaticamente mudanças que não foram capturadas durante a pausa.

## Logs

Use **System Logs → All**, com filtro de data recente e prefixo da mensagem:

| Prefixo | Conteúdo |
|---|---|
| `[AOOP Degradation]` | Cada lote: calculados, erros, candidatos, tempo e cursor; erros incluem sys_id da disponibilidade |
| `[AOOP Degradation Daily]` | Resumo da execução diária, lotes, tempo e conclusão |
| `[AOOP Degradation Configuration]` | Mudança de modo, quantidade invalidada e tempo |

Exemplo de lote:

```json
{"status":"completed","calculated":100,"errors":0,"candidates":100,"elapsed_ms":2340,"resume":"<sys_id_do_outage>"}
```

O log é armazenado nas estruturas nativas e segue a retenção da instância. Não existe histórico próprio de resultados. Use intervalo de data no filtro para evitar buscas caras em todo o histórico de logs.

## Recalculate results nativo

O botão nativo não é alterado. O fluxo consultado na origem recalcula resultados e limpa registros de timezones anteriores; não é uma exclusão integral incondicional.

- Novas disponibilidades recebem ponteiro default `false`.
- Mudanças de início/fim, Oferta/CI, compromisso ou timezone invalidam diretamente.
- Atualizações apenas nos indicadores nativos, sem mudança dessas entradas, não invalidam por si só.
- Nos registros de Ofertas, o vínculo pode estar em `service_offering`, com `cmdb_ci` vazio. Confira a coluna correta.

## Interpretação dos resultados

`true` indica resultado calculado, inclusive zero. `false` indica ausência de resultado válido; sem degradação elegível, o registro continua fora do cálculo.

Base elegível zero: duração/contagem podem ser zero e percentual vazio, com ponteiro `true`. Confira a agenda e o timezone antes de tratar isso como falha.

## Desempenho e carga inicial

O limite de 100 refere-se a disponibilidades calculadas, não a Outages lidos. Vários Outages podem alimentar uma disponibilidade mensal/anual; um Outage também pode atingir vários períodos e compromissos.

A seleção revisita degradações encerradas a cada ciclo completo, mesmo quando não há pendências. Antes de usar com 25.000 eventos, meça consultas, índices, agendas, distribuição por CI e intervalos agregados. Não extrapole linearmente o benchmark pequeno.

Pendências novas ou falhas anteriores ao cursor só serão encontradas quando o percurso voltar ao início. O fim do percurso encerra o ciclo atual; não há passagem extra automática na mesma execução diária.


## Alterar faixas e cores

Edite `aoop_service_availability_degradation_color_ranges` e recarregue formulário/lista. Essa alteração não limpa resultados, não envia evento e não exige execução do job. São quatro faixas numéricas crescentes, terminando em 100, com cores green/yellow/orange/red. Valores inválidos usam o padrão 25/50/75/100. Veja formato, comportamento e exemplos em [COLOR-INDICATORS.md](COLOR-INDICATORS.md).
