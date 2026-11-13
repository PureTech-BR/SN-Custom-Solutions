# Service Availability Degradation

Cálculo complementar de degradação para `service_availability`, sem alterar o motor OOTB de disponibilidade. A solução mede tempo líquido degradado, percentual e períodos, usando o intervalo integral ou a agenda do Service Commitment.

| Item | Valor |
|---|---|
| Versão | 1.0.0 — 13/11/2026 |
| Aplicação | Global |
| Update Set | AOOP - Service Availability Degradation v1.0.0 |
| Estado na origem | Complete |
| Identificador local | `ad7c0069c3681758e079b13ed40131e2` |
| Pacote | [service-availability-degradation-v1.0.0.xml](service-availability-degradation-v1.0.0.xml) |
| Customer Updates | 29: 18 componentes, 4 campos e 7 rótulos |
| Agendamento | Diário, 06h00, America/Sao_Paulo |
| Lotes | 100 disponibilidades por lote; até 500 lotes ou orçamento de 10 minutos por execução |
| Modo incluído | Intervalo integral: `usecommitment=false` |

O XML não transporta CIs, Ofertas, compromissos, Outages, disponibilidades, usuários, credenciais ou os 100 Outages sintéticos usados no teste. Os sys_ids das definições técnicas são preservados. Não é criada tabela própria.

## Documentação

- [Instalação e atualização](docs/INSTALLATION.md)
- [Arquitetura, fórmula e cursor](docs/ARCHITECTURE.md)
- [Inventário completo dos componentes](docs/COMPONENTS.md)
- [Operação, properties, logs e reprocessamento](docs/OPERATIONS.md)
- [Validações e desempenho medido](docs/VALIDATION.md)
- [Histórico de versões](CHANGELOG.md)

## Instalação resumida

1. Baixe o XML desta pasta.
2. No destino, acesse **System Update Sets → Retrieved Update Sets → Import Update Set from XML**.
3. Importe, execute **Preview Update Set** e revise conflitos/dependências.
4. Execute **Commit Update Set** em janela controlada.
5. Confira os quatro campos, as properties, os eventos e o job. O pacote contém o habilitador `true` e o job ativo.
6. Valide uma Oferta com compromisso e uma degradação encerrada antes da primeira carga ampla.

Leia [INSTALLATION.md](docs/INSTALLATION.md) para os detalhes. Preview/commit em uma instância de destino independente ainda precisam ser realizados.

## Comportamento principal

A seleção parte de Outages encerrados do tipo `degradation`. Para cada CI/Oferta afetado, procura disponibilidades sobrepostas e pendentes. Um registro `false` sem degradação não é calculado.

Cada disponibilidade é calculada considerando **todos** os eventos de degradação e planejados pertinentes ao intervalo. O resultado é a união das degradações menos a união dos planejados, recortada ao intervalo. Quando habilitado o compromisso, o motor mede apenas o tempo elegível da agenda, com timezone e manutenção.

Exemplos:

| Cenário | Resultado |
|---|---|
| 1 hora em 24 horas | 4,17% |
| 3 horas em 168 horas | 1,79% |
| Degradações 10h–12h e 11h–13h; planejado 11h30–12h | 2h30 e dois períodos efetivos |

O percentual representa **degradação**, não disponibilidade. Os indicadores nativos não são sobrescritos nem somados ao resultado customizado.

## Campos

| Campo | Tipo | Finalidade |
|---|---|---|
| `u_total_degradation` | Duration | Duração líquida |
| `u_absolute_degradation` | Decimal | Percentual degradado |
| `u_absolute_degradation_count` | Integer | Períodos efetivos com duração positiva |
| `u_degradation_calculated` | Boolean, default false | Resultado calculado e válido |

Os três primeiros já haviam sido criados na origem e estão incluídos no pacote. `u_degradation_revision` foi removido do código e do esquema; não é necessário nesta versão. A gravação usa `sys_mod_count`, que é nativo.

## Mudanças e invalidação

BRs próprias capturam mudanças nos Outages e nos CIs afetados. Eventos e Script Actions localizam os intervalos atingidos, limpam os três resultados e marcam `false`. A BR de entradas da disponibilidade faz essa limpeza diretamente no registro, em `before`.

Trocar `aoop_service_availability_degradation_usecommitment` entre `true` e `false` invalida assincronamente os resultados calculados e reinicia o cursor. Salvar o mesmo valor não invalida. O cálculo fica para o job ou para uma execução manual controlada.

## Fontes e verificação local

O XML é o artefato de instalação. Os arquivos em [src/](src/) são cópias dos scripts capturados, para revisão; condições e gatilhos das BRs constam em [components.json](components.json). Não instale apenas os arquivos JavaScript.

```bash
python3 tests/validate-package.py
node tests/validate-math.cjs
sha256sum -c SHA256SUMS
```

As verificações locais não substituem os testes de GlideRecord, GlideSchedule, eventos e scheduler no destino.

## Limitações relevantes

- Não há cálculo de degradações abertas nem criação de registros de disponibilidade.
- O cursor é por `sys_id` de Outage, não por data; novas pendências anteriores ao cursor aguardam o retorno ao início.
- O fim de um ciclo limpa o cursor, mas não inicia uma segunda conferência completa na mesma execução.
- Não foi avaliado o plano de execução SQL. Não há garantia de ausência de full scans físicos.
- A mudança de agenda, timezone ou manutenção não possui BR própria nesta versão: requer reprocessamento direcionado.
- A proteção por contador depende de sua atualização; `autoSysFields(false)` pode impedir o incremento.
- Tempos e limites são orçamentos verificados entre unidades de trabalho, não cancelamentos instantâneos.

Origem do pacote: [Update Set](https://dev437951.service-now.com/sys_update_set.do?sys_id=ad7c0069c3681758e079b13ed40131e2).

