# Limpeza de disponibilidades sem vínculo com ofertas

Fix Script em aplicação **Global** para remover registros de `service_availability` cujo Service Commitment ainda existe, mas não possui nenhum relacionamento em `service_offering_commitment`.

## Conteúdo

- `service-availability-orphan-cleanup-v1.0.0.xml`: Update Set exportado do ServiceNow, contendo um Fix Script.
- Nome do Update Set: `Fix Script - Remove Availability - Service Commitment`.
- Fix Script: `LAB - Cleanup orphan Service Availabilit` (nome persistido na instância).
- Sys ID do Fix Script: `1b153fd5c348df18e079b13ed401310f`.

## Regra

O script agrupa as disponibilidades por compromisso e consulta seus relacionamentos com ofertas. Se o compromisso existe e não tem nenhum relacionamento, remove suas disponibilidades, preservando o cadastro do compromisso. Compromissos com qualquer relacionamento são preservados. Referências a compromissos inexistentes são ignoradas e registradas para revisão manual.

A limpeza abrange todos os períodos registrados, sem filtro de datas. Não remove apenas pares offering/commitment sem vínculo quando o mesmo compromisso ainda está relacionado a outra oferta. A execução é manual; a solução não cria uma rotina recorrente nem altera o comportamento de exclusão da plataforma.

## Instalação e execução

1. Importe o XML em **System Update Sets > Retrieved Update Sets > Import Update Set from XML**.
2. Execute **Preview Update Set**, revise os resultados e faça **Commit Update Set**.
3. Em **System Definition > Fix Scripts**, abra o script identificado acima.
4. Para simular, altere `DRY_RUN` para `true` antes de executar. Para excluir, use `false` — valor presente no XML.
5. Mantenha **Record for rollback** marcado e execute **Run Fix Script**.
6. Consulte os logs pela origem `CleanupOrphanServiceAvailability` e confira os totais e eventuais falhas.

O script revalida a existência de relacionamento antes de cada exclusão e interrompe a limpeza daquele compromisso se identificar um novo vínculo.

## Log

```text
Service Commitment: Nome - sys_id; Offering Relationship: Não Identificado; Service Availability: X Removidos; Falhas: 0
```

Em simulação, registra zero removidos e a quantidade de candidatos. Também registra um resumo final.

## Validação na PDI

Na consulta anterior à criação, o compromisso `99,92 - DISP - 5x8` (`2fc3e845c3a38750e079b13ed401319c`) tinha 437 disponibilidades e nenhum relacionamento com ofertas. Outros dois compromissos tinham 468 disponibilidades cada e relacionamentos existentes, devendo ser preservados.

Essa validação foi somente de leitura. A publicação deste pacote não executa o script nem confirma exclusões na instância.
