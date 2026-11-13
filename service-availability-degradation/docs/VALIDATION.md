# Validação

## Testes realizados na origem

Validação funcional em PDI com sessão administrativa:

| Caso | Resultado observado |
|---|---|
| Degradações sobrepostas e planejado intermediário | 2h30 e dois períodos, sem duplicidade |
| Planejado cobrindo toda a degradação | Zero válido |
| Recorte nos limites do intervalo e união de planejados | Duração líquida correta |
| Vínculo direto e por CI afetado para o mesmo Outage | Considerado uma vez |
| False sem degradação | Não calculado |
| Segunda rodada com true | Sem recálculo |
| Alteração de Outage | Evento limpa e invalida intervalos afetados |
| Mudança para outro dia | Intervalos antigo e novo tratados |
| Exclusão de Outage e remoção do último vínculo | Limpeza sem novo cálculo quando não há degradação |
| Alteração de planejado | Invalidação e novo desconto |
| Agenda UTC 09–17 | 4h de 8h = 50% no cenário testado |
| Agenda sem timezone fixo | Aplicação do timezone do compromisso |
| Manutenção 10–11 | Exclusão da duração elegível e da base da agenda |
| Criação por AvailabilityRecord nativo | Ponteiro false nas novas disponibilidades |
| Gravação com sys_mod_count anterior | Recusada |
| Retirada de u_degradation_revision | Cálculo/invalidação continuam funcionando sem o campo |
| Troca de modo false → true → false | Limpeza assíncrona, reinício do cursor e recálculo |
| Salvamento da property sem troca de modo | Sem evento de invalidação |

A referência persistente dos eventos foi testada após a exclusão da origem. O nome final do evento de configuração respeita o limite de 40 caracteres. Estes são testes observados; não há suíte ATF de integração incluída.

## Benchmark de 100 Outages

Foram criadas 100 degradações em 10 Ofertas com compromisso, distribuídas em 10 períodos por Oferta, incluindo vínculo direto, vínculo por CI afetado e associação pelos dois caminhos.

Na medição inicial em modo integral:
- Base: 7.463 disponibilidades.
- Limpeza dos resultados customizados: 384 ms.
- 382 disponibilidades elegíveis calculadas, incluindo degradações existentes e sintéticas.
- As 100 degradações sintéticas alcançaram 310 disponibilidades: 100 diárias, 100 semanais, 90 mensais, 10 anuais e 10 de últimos 12 meses.
- Nenhuma dessas 310 permaneceu pendente.
- Erros de cálculo: zero.

| Lote | Calculadas | Tempo |
|---|---:|---:|
| 1 | 100 | 2.340 ms |
| 2 | 100 | 1.871 ms |
| 3 | 100 | 1.983 ms |
| 4 | 82 | 1.635 ms |
| Total da fase de cálculo | 382 | 7.834 ms |

A rodada seguinte levou 501 ms e teve zero candidatos/cálculos. A execução pelo scheduler também foi observada, com zero pendências em aproximadamente 505 ms.

O tempo completo do roteiro, incluindo verificações adicionais, foi 19.751 ms. Não confundir esse tempo com a fase de cálculo. Os lotes foram encadeados manualmente para medição, sem espera diária.

## Teste da mudança de modo

A invalidação por configuração foi validada nas duas direções. Um lote de 100 em modo compromisso concluiu sem erros em 3.631 ms. Depois, o modo original false foi restaurado e 382 resultados foram recalculados em quatro lotes, em 8.627 ms. A rodada posterior teve zero candidatos, em 535 ms.

Nesse teste, a base continha 7.429 registros. A comparação de contagem e assinatura dos campos nativos antes/depois não apontou alterações nesses campos.

## Verificações locais incluídas

- XML bem formado e estrutura de Update Set.
- Quantidade e unicidade dos 29 Customer Updates.
- Correspondência com o inventário.
- Tipos dos quatro campos.
- Ausência do campo de revisão nos payloads executáveis e de esquema.
- Ausência de tabelas de dados de negócio no pacote.
- Correspondência dos scripts extraídos com os payloads.
- Limites de 500 lotes/600.000 ms e horário do job.
- Sintaxe dos fontes JavaScript.
- Matemática de união, subtração, recorte e casos aleatórios com oráculo por intervalos discretos.
- Checksums dos arquivos.

Execute a partir da raiz desta pasta:

```bash
python3 tests/validate-package.py
node tests/validate-math.cjs
sha256sum -c SHA256SUMS
```

## Limites da evidência

Não foi realizado preview/commit do pacote em uma instância de destino independente. A validação local não executa GlideRecord, GlideSchedule, eventos ou scheduler. O benchmark não homologa 25.000 Outages, outros volumes, versões ou ambientes. Não foi avaliado o plano de execução SQL nem realizada validação de papéis operacionais.

