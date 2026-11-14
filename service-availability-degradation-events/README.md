# Service Availability Degradation — Events

**Versão 2.1.0 · Global · ServiceNow**

Cálculo complementar de degradação em `service_availability`, acionado por eventos e integrado ao recálculo nativo. Reutiliza três campos customizados, preserva o motor OOTB e não depende de `u_degradation_calculated` nem de Scheduled Job próprio.

[Baixar o Update Set XML](service-availability-degradation-events-v2.1.0.xml) · [Instalação](docs/INSTALLATION.md) · [Arquitetura](docs/ARCHITECTURE.md) · [Componentes](docs/COMPONENTS.md) · [Operação](docs/OPERATIONS.md) · [Testes](docs/VALIDATION.md)

## Comportamento

- **Degradation encerrada:** compõe o tempo degradado, recortado ao intervalo da disponibilidade.
- **Planned encerrado:** desconta os trechos sobrepostos à degradação.
- **Outage:** não compõe o cálculo complementar. Uma transição de Degradation/Planned para Outage retira o efeito anterior.
- Uma mesma ocorrência encontrada pelo CI principal e pelos CIs afetados entra uma vez. Intervalos degradados sobrepostos são unidos.
- Cada janela é recalculada integralmente; resultados anteriores não são somados à nova duração.
- A property geral controla os gatilhos e o motor. A property de modo seleciona cálculo absoluto ou por compromisso.
- Alterar a property de modo **não dispara recálculo**. Para alinhar a base, confirmar o botão nativo **Recalculate results** ou executar o Fix Script manual.

## Dois modos

| `aoop_service_availability_degradation_usecommitment` | Cálculo |
|---|---|
| `false` | Tempo degradado líquido dividido pela duração integral da janela |
| `true` | Numerador e denominador medidos na agenda do compromisso, com timezone e exclusão de agendas de manutenção |

O modo é capturado uma vez por instância do motor. A disponibilidade precisa ter CI/Oferta, compromisso e intervalo válido. Sem agenda no compromisso, o modo por compromisso considera 24x7 e aplica as manutenções associadas. Base elegível zero produz percentual vazio.

## Pacote

O XML único contém **26 Customer Updates**, somente com os recursos utilizados por esta solução independente. Inclui três campos e seus seis rótulos, três properties e a extensão visual. Os componentes OOTB não fazem parte do pacote.

A instalação é independente: não requer outra solução de degradação e não transporta componentes de migração ou reversão.

| Guia | Conteúdo |
|---|---|
| [Arquitetura](docs/ARCHITECTURE.md) | Gatilhos, eventos, integração nativa, cálculo, deduplicação e concorrência |
| [Componentes](docs/COMPONENTS.md) | Inventário dos 26 Customer Updates da solução atual |
| [Instalação](docs/INSTALLATION.md) | XML, Preview/Commit, configuração e carga inicial |
| [Operação](docs/OPERATIONS.md) | Properties, reprocessamento, cores e diagnóstico |
| [Modelo de dados](docs/DATA-MODEL.md) | Três campos, zero versus vazio e faixas |
| [Validação](docs/VALIDATION.md) | Casos realmente executados e limites da homologação |

Os fontes em `src/` foram extraídos dos payloads do XML exportado. `components.json`, `fields.json`, `properties.json` e `SHA256SUMS` permitem conferir o pacote. O XML foi montado no formato padrão `unload` a partir dos registros gerados por `UpdateSetExport.exportUpdateSet`, preservando integralmente os payloads nativos.

Validado na DEV em 14/11/2026. Preview/Commit e homologação em outra instância continuam necessários.
