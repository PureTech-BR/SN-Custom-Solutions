# Validação

Validação executada na DEV em **14/11/2026**. Os cenários funcionais usaram ofertas, compromissos, disponibilidades, Outages e agendas temporários, removidos ao final. As gravações e o consumo de eventos ocorreram em transações separadas.

| Caso | Resultado confirmado |
|---|---|
| Nova disponibilidade sem degradação encerrada | Zero nos resultados, com base positiva |
| Fechar Degradation 01h–03h | 120 minutos; 8,33% na diária e 1,19% na semanal |
| Sobreposição 01h–03h + 02h–04h, menos Planned 02h–02h30 | 150 minutos e dois trechos, sem dupla contagem |
| Adicionar CI afetado | Cálculo aplicado ao CI adicional |
| Excluir vínculo do CI | Retirada da contribuição no CI removido |
| Excluir Planned | Degradação passou a 180 minutos, um trecho |
| Mover degradação para o dia seguinte | Efeito anterior retirado; diário/semanal atualizados |
| Trocar Degradation para Outage | Contribuição anterior retirada |
| Excluir a última Degradation | Resultados zerados |
| Repetir cálculo idêntico | `unchanged`, sem regravar |
| Chave geral false | Sem publicação customizada na mudança testada; motor retornou disabled |
| Evento nativo em compromisso dedicado | Evento processed e sincronização pela ação 200 |
| Conflito de sys_mod_count injetado | Nova leitura e tentativa de gravação concluídas |
| Cores nos limites e percentual vazio | Nove casos, sem dependência do booleano |

## Agenda e mudança de modo

Agenda 09h–17h em America/Sao_Paulo, equivalente a 12h–20h UTC em 02/11/2026. Disponibilidade de 24h UTC; Degradation 11h–14h UTC e Planned 12h30–13h UTC.

| Configuração | Resultado |
|---|---|
| Absoluto | 150 minutos, 10,42% |
| Alterar property para true | Nenhum evento de recálculo publicado; resultado e sys_mod_count permaneceram iguais |
| Novo motor em true | 90 minutos sobre 480 minutos, 18,75% |
| Motor instanciado antes da alteração | Preservou seu modo anterior |
| Recálculo nativo em true | Ação 200 persistiu 90 minutos e 18,75% |
| Manutenção 13h30–14h UTC | 60 minutos sobre 450 minutos, 13,33% |
| Agenda sem horário elegível | Duração/contagem zero e percentual vazio |
| Compromisso sem agenda | 24x7 menos manutenção; resultado conferido em preview |
| Restaurar false | Sem cálculo automático; novo evento nativo restaurou 150 minutos e 10,42% |

A configuração original de modo false foi restaurada. A BR antiga de mudança de modo permaneceu inativa.

## Base existente

A carga inicial V2 avaliou **7.446 disponibilidades**: 7.101 calculadas, 345 já corretas, zero ignoradas e zero erros, em **84.168 ms**. Essa execução ocorreu no modo absoluto; não é benchmark generalizável.

## Verificação local do pacote

```bash
node tests/validate-math.cjs
node tests/validate-commitment-math.cjs
python3 tests/validate-package.py
sha256sum -c SHA256SUMS
```

A matemática inclui 106 casos, dos quais 100 aleatórios comparados com uma referência independente. A suíte de compromisso verifica modo capturado, agenda, manutenção e base zero. O validador do pacote confere XML, 44 updates únicos, payloads, campos/properties, estados e correspondência dos fontes.

## Limites da homologação

Não foram executados teste de carga com múltiplos event workers, exclusão abortada tardiamente ou Preview/Commit em outra instância. A concorrência foi exercitada por injeção controlada de conflito no objeto do motor. O recálculo nativo foi acionado pelo mesmo evento do botão, com um compromisso dedicado para restringir o escopo; o botão global não foi usado para reconstruir toda a base durante esses testes.

Nenhum componente OOTB foi modificado. A rotina nativa de exportação produziu o Retrieved Update Set de 44 registros; seus payloads foram preservados no XML publicado.
