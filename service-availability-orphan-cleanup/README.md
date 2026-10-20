# Limpeza de disponibilidades sem vínculo com ofertas

Fix Script em aplicação **Global**, versão **1.1.0**, para remover registros de `service_availability` cujo par **Service Commitment + Service Offering** não possui mais relacionamento em `service_offering_commitment`.

## Conteúdo

- `service-availability-orphan-cleanup-v1.1.0.xml`: Update Set exportado do ServiceNow, contendo um Fix Script.
- Nome do Update Set: `LAB - Availability cleanup exact pair v1.1`.
- Sys ID do Update Set de origem: `e0db5435c3409310e079b13ed4013181` (concluído).
- Fix Script: `LAB - Cleanup orphan Service Availabilit` (nome persistido na instância).
- Sys ID do Fix Script: `1b153fd5c348df18e079b13ed401310f`.

## Regra

O script agrupa as disponibilidades por compromisso e oferta e consulta o relacionamento desse par exato. Se o compromisso existe e o par não está relacionado, remove somente as disponibilidades desse par, preservando os cadastros. Um vínculo do compromisso com outra oferta não impede a limpeza. Pares ainda relacionados são preservados. Referências a compromissos inexistentes são ignoradas e registradas para revisão manual. Disponibilidades sem compromisso ou sem oferta preenchidos não entram na limpeza.

A limpeza abrange todos os períodos registrados, sem filtro de datas. A execução é manual; a solução não cria uma rotina recorrente nem altera o comportamento de exclusão da plataforma.

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
Service Commitment: Nome - sys_id; Service Offering: Nome - sys_id; Offering Relationship: Não Identificado; Service Availability: X Removidos; Falhas: 0
```

Em simulação, registra zero removidos e a quantidade de candidatos. Também registra um resumo final.

## Validação na PDI

Na validação da correção, o compromisso `99,90 - DISP - 24x7` continuava relacionado à oferta **E-Commerce 2.0**, mas havia sido desvinculado da **Área Logada - Parceiro**. Foram identificadas 437 disponibilidades elegíveis para limpeza da oferta desvinculada, preservando 469 da E-Commerce 2.0 e 469 do Site Principal - EU.

Após executar a correção, o usuário confirmou o funcionamento na PDI. Também foram realizados testes locais com dados simulados cobrindo exclusão pelo par exato, preservação dos pares relacionados, simulação, revinculação durante a execução e preservação dos cadastros. O XML foi conferido com o script salvo na instância. A publicação deste pacote não executa novamente o script.

A versão 1.1.0 substitui a 1.0.0, que verificava apenas o compromisso e preservava indevidamente disponibilidades de ofertas desvinculadas. Apenas o pacote atual é mantido nesta pasta; versões anteriores permanecem no histórico do Git.
