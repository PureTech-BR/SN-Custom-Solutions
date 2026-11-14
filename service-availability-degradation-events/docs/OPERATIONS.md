# Operação

## Configurações

| Property | Valor exportado | Uso |
|---|---|---|
| `aoop_service_availability_calculate_degradation` | true | Chave geral dos gatilhos e motor |
| `aoop_service_availability_degradation_usecommitment` | false | false=absoluto; true=agenda do compromisso |
| `aoop_service_availability_degradation_color_ranges` | JSON 25/50/75/100 | Faixas e cores dos indicadores |

### Trocar o modo

1. Definir `degradation_usecommitment`.
2. Confirmar **Recalculate results** na lista nativa de Service Availability.
3. Aguardar o evento `spm.availability.calculate` e conferir os logs da sincronização customizada.
4. Atualizar a lista/formulário para ver os resultados.

A troca da property não dispara cálculo. O valor é capturado uma vez por execução. Cada novo evento posterior já usa a configuração vigente.

### Desligar e religar

Com a chave geral false, as BRs não executam seus scripts, e o motor bloqueia eventos já enfileirados. Os resultados existentes são preservados. Ao religar, executar o recálculo nativo ou o Fix Script para alinhar as mudanças ocorridas durante a pausa. O desenho não mantém uma fila própria dessas mudanças desabilitadas.

## Reprocessamento manual

O Fix Script **AOOP - Degradation V2 - Initial sync** chama `syncAll(COMMITMENT_ID,TARGET_CI)`. Não usar como agendamento. Um escopo vazio percorre todas as disponibilidades com compromisso; a consulta não depende do booleano antigo e também zera resultados sem degradações restantes.

A chamada direta `calculate(sys_id,true)` do motor é um preview sem gravação. Para uma rotina administrativa, instanciar um motor novo após mudar o modo; instâncias já criadas preservam o modo capturado.

## Logs e diagnóstico

- **System Policy > Events > Event Log**: localizar `aoop.degradation.recalculate` ou `spm.availability.calculate` no intervalo da operação.
- **System Logs**: filtrar o prefixo `[AOOP Degradation V2]` e uma janela curta de tempo.
- O resumo contém contexto, modo, selecionados, calculados, sem alteração, ignorados e erros.
- `processed` no evento não garante êxito do cálculo. A Script Action chama o motor, que registra falhas por disponibilidade.
- Dados fora de escopo ou removidos podem ser ignorados; não significam, sozinhos, erro.
- Não há retentativa agendada automática. Corrigir a causa e reprocessar o escopo manualmente.

Se uma mudança não tiver efeito: conferir a chave geral, o evento publicado, CI/Oferta e compromisso da disponibilidade, intervalo válido, Degradation encerrada e vínculos diretos. No modo por compromisso, conferir agenda/timezone e manutenção. Em base zero, percentual vazio é esperado.

## Mudanças administrativas

Alterações na agenda/timezone do compromisso ou nos vínculos de manutenção podem exigir sincronização manual, pois os gatilhos V2 não observam todas essas tabelas. A BR de disponibilidade cobre mudanças de suas próprias entradas, inclusive janelas móveis; o fluxo do botão nativo cobre a reconstrução geral pelo evento conhecido.

## Cores

O Script Include de cores lê a property e valida quatro limites crescentes entre 0 e 100, terminando em 100. Cores permitidas: green, yellow, orange, red. Configuração inválida usa os padrões.

```json
[
  {"max":25,"color":"green"},
  {"max":50,"color":"yellow"},
  {"max":75,"color":"orange"},
  {"max":100,"color":"red"}
]
```

As faixas são contínuas: 25,01 já pertence à segunda. Recarregar formulário/lista após a mudança. Não é preciso recalcular dados nem sincronizar estilos por BR. O formulário recebe um ícone no rótulo, e a lista uma bolinha; não se pinta a linha inteira.
