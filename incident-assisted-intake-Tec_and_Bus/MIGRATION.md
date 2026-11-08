# Evolução do primeiro pacote

Origem consultada: `incident-assisted-intake` v1.1.0, 56 componentes, no mesmo repositório. A nova pasta é uma distribuição conjunta v1.0.0; não modifica os arquivos da distribuição anterior.

| Componente original | Tratamento nesta v1 |
|---|---|
| Producer `0745a07dc3c09310e079b13ed4013110` | Preservado na instância; duplicado no novo producer de negócio `6a6b9c7bc3185f94e079b13ed4013183`; original não transportado |
| LabIncidentIntakeService | Mesmo sys_id e lógica preservada; incluído como dependência comum |
| LabIncidentIntakeAjax | Original preservado; novo LabBusinessIncidentAjax usa as perguntas no set de serviço de negócio |
| Variáveis locais do primeiro item | Originais preservadas; o clone usa perguntas em sets, com escolhas correspondentes |
| Scripts locais do primeiro item | Originais preservados; 4 scripts de serviço/oferta clonados para o set de negócio; 6 scripts comuns reutilizados nos dois itens |
| Widget de aviso de Outage | Mesmo componente original incluído para negócio; widget técnico próprio também incluído |
| Editor de variáveis do incidente | Original preservado; clone aponta para o novo Ajax e usa o mesmo comportamento somente leitura |
| Catálogo, categoria e tópico | Vínculos próprios para cada novo producer; registros de taxonomia externos não transportados |
| Regras de classificação e correlação | Reutilizadas pelo núcleo; extensão técnica por herança |

Dos 56 nomes canônicos do XML anterior, dois são incluídos diretamente (núcleo e widget); os demais têm equivalentes próprios ou compartilhados na nova distribuição. Isso evita transportar novamente o producer legado e suas perguntas locais. `components.json` lista o conjunto efetivo de 157 atualizações, que inclui também todo o fluxo técnico e a estrutura do controle de concorrência.

## Refatoração do item técnico

As variáveis técnicas existentes mantêm seus sys_ids para preservar referências a respostas históricas. O antigo set de caracterização foi dividido em:

- Caracterização do incidente: sintoma e extensão, compartilhados.
- Outage automático do SI principal: campos exclusivos da automação, na sequência visual da extensão.
- Detalhamento e continuidade do incidente: 11 campos comuns, compartilhados.

Os demais sets técnicos permanecem específicos. A separação evita expor o bloco de criação automática na visão de negócio. Alterações futuras nas perguntas comuns afetam ambos os itens; mantenha os dois sets comuns e os scripts associados como uma unidade funcional.

## Instâncias com o pacote anterior

Não desative nem exclua o primeiro item automaticamente. Este pacote adiciona o item de negócio e atualiza o técnico com os mesmos IDs da origem. Se houver adaptações locais no núcleo, widget ou componente técnico, avalie os conflitos no Preview antes de aceitar. Dados e respostas históricas não são migrados para o novo producer.

Para retirar o item antigo do catálogo, planeje uma decisão separada sobre publicação, links e histórico. Nenhuma regra do pacote muda o acesso do legado.

## Transporte e reversão

Use o XML completo desta pasta; não aplique arquivos de `src` manualmente como substituto do Update Set. Os arquivos servem para revisão e manutenção. O transporte contém payloads de dicionário e ACL da tabela de controle, mas nenhuma linha de reserva por SI.

Antes de Back Out em destino, avalie respostas já geradas, consumidores dos componentes compartilhados e o uso da tabela de controle. Outages e incidentes criados em execução são dados de negócio e não são removidos pelo Back Out do Update Set.
