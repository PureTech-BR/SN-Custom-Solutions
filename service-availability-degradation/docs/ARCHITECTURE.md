# Arquitetura e regras de cálculo

## Escopo por tipo de evento

Nesta documentação, “registro de Outage” designa um registro da tabela `cmdb_ci_outage`. **Outage**, na tabela abaixo, é especificamente o tipo `outage` (indisponibilidade).

**Somente registros do tipo Degradation (`degradation`), encerrados e associados à Oferta/CI, tornam uma disponibilidade elegível para cálculo.** O job usa início e fim da degradação para selecionar disponibilidades sobrepostas com ponteiro `false`.

| Tipo em `cmdb_ci_outage.type` | Seleciona disponibilidades para cálculo? | Participação no cálculo complementar |
|---|---|---|
| **Degradation** — `degradation` | **Sim**, com início e fim preenchidos e sobreposição de duração positiva | Compõe o tempo degradado; períodos sobrepostos são unificados |
| **Planned** — `planned` | **Não** | Quando encerrado, desconta apenas o tempo sobreposto às degradações selecionadas |
| **Outage** — `outage` | **Não** | Não entra no cálculo, não é somado e não é descontado da degradação |

Uma disponibilidade com apenas Planned ou Outage não é calculada por esta solução. **Mudanças em Planned podem invalidar resultados existentes**, pois alteram o desconto, mas o recálculo continua exigindo uma Degradation elegível. A property de uso do compromisso altera a janela de medição, não os tipos de evento considerados.

## Responsabilidades

`AOOP_ServiceAvailabilityDegradation` concentra seleção, captura de mudanças, união/subtração dos intervalos, agenda, invalidação e persistência. Os scripts OOTB não são alterados; a solução escreve apenas os quatro campos customizados e o cursor de operação.

```mermaid
flowchart TD
    A["Mudança de Degradation, Planned ou CI afetado"] --> B["BR captura CI e intervalo"]
    B --> C["Evento de invalidação"]
    C --> D["Script Action e motor"]
    D --> E["Limpa resultados e marca false"]
    F["Mudança do modo de cálculo"] --> G["Evento de configuração"]
    G --> H["Limpa calculados e reinicia cursor"]
    E --> I["Job diário seleciona pendentes"]
    H --> I
    I --> J["Calcula em lotes e marca true"]
```

A BR `Availability inputs` é uma exceção ao envio de evento: em `before insert/update`, limpa o próprio registro quando mudam início, fim, Oferta/CI, compromisso ou timezone. Alterações apenas nos resultados nativos não provocam essa limpeza.

## Associação e elegibilidade

O relacionamento OOTB **Outages During Interval** é referência para os caminhos de associação, não uma tabela intermediária persistida:

- Vínculo direto: `cmdb_ci_outage.cmdb_ci`.
- Vínculo de CIs afetados: `cmdb_outage_ci_mtom.outage/ci_item`.
- Ambos podem corresponder a `service_availability.service_offering` ou `cmdb_ci`.

Na seleção de candidatos, o filtro é `type=degradation`. Ao calcular cada candidato, a busca de eventos usa somente `type IN degradation,planned`; `type=outage` fica excluído. A consulta complementar exige início/fim preenchidos e sobreposição de duração positiva: `outage.begin < availability.end` e `outage.end > availability.start`. O mesmo Outage encontrado pelos dois caminhos entra uma única vez.

A data de criação do Outage não define a apuração. São usados início/fim do evento. Um evento pode alcançar dia, semana, mês, ano, últimos 7 dias, últimos 30 dias e últimos 12 meses, desde que esses registros já existam e intersectem o evento. O motor nativo continua gerando os períodos.

## Fórmula

Para intervalo `I=[início,fim)`, seja `D` a união das degradações encerradas recortadas a `I`, e `P` a união dos planejados encerrados recortados a `I`. O intervalo líquido é `D − P`.

- `usecommitment=false`: duração = tempo de `D − P`; base = duração integral de `I`.
- `usecommitment=true`: duração = tempo elegível de `D − P` na agenda; base = tempo elegível de `I` nessa mesma agenda.
- Percentual = `100 × duração / base`. Base zero produz percentual vazio.
- Planejados são retirados do numerador; não reduzem automaticamente a base.
- Outages do tipo `outage` não entram neste cálculo complementar e não são subtraídos da degradação.
- Sobreposições e eventos contíguos de degradação são unificados antes da subtração.
- A contagem considera os fragmentos restantes de `D − P` com duração positiva. No modo de compromisso, um fragmento conta uma vez se tiver tempo elegível; lacunas da agenda não o subdividem em várias ocorrências.

A percentagem é formatada pelo código com até oito casas, mas a precisão armazenada/exibida depende da definição Decimal da instância. O nome técnico `u_absolute_degradation` é mantido também no modo por compromisso.

## Agenda e timezone

O motor carrega o compromisso do registro, usa seu timezone ou o timezone da disponibilidade como fallback, e considera os compromissos de manutenção associados à Oferta/CI. Sem agenda de disponibilidade, considera tempo integral, com as exclusões de manutenção aplicáveis.

Usa `GlideSchedule.duration()` e, para manutenção, `addOtherSchedule0(..., false)`, como o código nativo consultado na origem. Essa última chamada é dependente da versão da plataforma e deve ser validada no destino.

## Invalidação

A invalidação limpa duração, percentual e contagem e marca o ponteiro `false`. Não calcula.

- Mudanças em **Degradation** alteram o tempo degradado e invalidam os intervalos afetados.
- Mudanças em **Planned** alteram o desconto e também invalidam os intervalos afetados.
- Eventos que permanecem exclusivamente no tipo **Outage** não participam dessa invalidação por evento.
- Na troca de tipo, os estados anterior e atual são avaliados: mudar de Degradation para Outage, por exemplo, limpa o efeito anterior da degradação.

A captura guarda intervalos e CIs anteriores/atuais para atingir tanto o que passou a ser afetado quanto o que deixou de ser afetado. Exclusões são capturadas em `before`. Os eventos de Outage usam a property habilitadora como referência persistente, evitando dependência de registros já excluídos.

Se a última degradação desaparecer, os valores anteriores são limpos. Sem outra degradação encerrada, o registro permanece `false`, fora do cálculo. Zeros são resultados válidos de uma degradação inteiramente excluída por planejados ou agenda. Um Duration vazio pode aparecer como “0 Seconds” na interface; o ponteiro distingue validade.

## Lotes e cursor

Não existem pacotes persistidos. A cada `run()`:

1. Consulta degradações encerradas, ordenadas por `sys_id`.
2. Quando há cursor, inclui `sys_id >= cursor`.
3. Para cada CI afetado, consulta disponibilidades sobrepostas e `false`.
4. Deduplica candidatos dentro do lote.
5. Calcula até o limite de tentativas ou orçamento de tempo.
6. Persiste o `sys_id` do Outage atual como cursor se precisar continuar.

O Outage do cursor é revisitado. As disponibilidades já concluídas ficam de fora pelo filtro `false`. Ao concluir o percurso, o cursor fica vazio.

O job encadeia lotes até concluir o percurso, ocorrer erro ou atingir 500 lotes/orçamento de 600.000 ms. Cada `run()` tem limite próprio de 100 tentativas e 30.000 ms, configurável por properties. Os tempos são verificados entre processamentos; uma consulta ou cálculo individual pode ultrapassá-los.

Em interrupção antes de salvar o cursor, a retomada pode repetir seleção; os `true` continuam excluídos. Falhas mantêm o registro pendente e são registradas em log. Uma falha anterior ao cursor pode aguardar o próximo ciclo completo. Não há fila de falhas independente.

## Concorrência

A atualização final filtra por `sys_id`, ponteiro `false` e `sys_mod_count` lido inicialmente. Uma atualização que incremente esse contador impede a gravação antiga. O contador não cobre operações que suprimam seus campos de sistema.

## Custo de seleção

Mesmo sem pendências, um novo ciclo volta a percorrer as degradações encerradas e consultar disponibilidades correspondentes. O código não itera sobre todas as disponibilidades apenas por estarem `false`, mas isso não garante um plano SQL sem full scan. Intervalos anuais podem carregar muitos eventos do mesmo CI em um único cálculo. O teste de 100 Outages não representa uma homologação para 25.000 eventos.


## Apresentação dos percentuais

A camada visual integra o mesmo Update Set e não participa do cálculo ou da invalidação. O Client Script consulta `AOOP_DegradationColorConfig` via GlideAjax; os quatro Field Styles consultam a mesma configuração no servidor durante a renderização da lista. Uma única propriedade controla faixas e cores, sem BR de sincronização, eventos ou varredura dos resultados. Somente registros calculados com percentual preenchido entre 0 e 100 recebem indicador. O formulário mostra ícone ao lado do rótulo e a lista mostra bolinha ao lado do percentual, sem pintar a linha ou campo. Consulte [COLOR-INDICATORS.md](COLOR-INDICATORS.md).
