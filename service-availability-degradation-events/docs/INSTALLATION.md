# Instalação

## Pré-requisitos

- Instância com Service Availability, compromissos e motor de disponibilidade V2 habilitado (`com.snc.availability.v2=true`).
- Permissão administrativa para importar, executar Preview/Commit e revisar dependências.
- Compromissos de disponibilidade configurados para os CIs/Ofertas; o motor complementar não cria esses relacionamentos de negócio.

## Importar o pacote único

1. Baixar `service-availability-degradation-events-v2.1.0.xml` da raiz deste diretório.
2. Abrir **System Update Sets > Retrieved Update Sets > Import Update Set from XML**.
3. Importar o XML e conferir o nome **AOOP - Service Availability Degradation v2.1.0 - Events**.
4. Executar **Preview Update Set** e revisar conflitos, dependências e referências de acordo com a instância de destino.
5. Conferir 44 Customer Updates: solução atual e desativações da V1. Nenhum payload altera o motor nativo.
6. Executar **Commit Update Set** somente após resolver os apontamentos.

O pacote pode ser usado para migração da V1. Em uma instalação sem V1, também transporta registros legados inativos; esses registros não devem ser ativados. O campo legado `u_degradation_calculated` e as properties de lote/cursor não são dependências da V2 nem estão sendo instalados.

O XML preserva metadados de origem, inclusive referências de componentes legados inativos. Revisar esses apontamentos durante o Preview, sem ativar o job antigo.

## Conferência após o Commit

| Item | Esperado |
|---|---|
| Três BRs V2 | Ativas, before, ordem 900 |
| Motor e configuração de cores V2 | Ativos |
| Script Actions V2 | Ativas: evento customizado ordem 100 e evento nativo ordem 200 |
| Job e gatilhos V1 | Inativos; quatro estilos antigos com condição `javascript:false` |
| Campos | Somente os três atributos de resultado da V2 |
| Property geral | Definir explicitamente o valor desejado; exportada como true |
| Property de modo | Definir antes da carga inicial; exportada como false |
| Property de cores | Quatro faixas válidas; padrões 25/50/75/100 |

As configurações transportadas podem substituir valores locais; conferir as três properties no Preview e após o Commit.

## Carga inicial

Abrir **AOOP - Degradation V2 - Initial sync**. Seu script contém `TARGET_CI` e `COMMITMENT_ID`; ambos vazios significam todas as disponibilidades existentes com compromisso. Preencher um escopo quando necessário e executar manualmente com a property geral habilitada.

Não executa criação de disponibilidade nativa e não instala um agendamento. Para reconstruir também os resultados nativos, usar **Recalculate results**; a ação 200 sincroniza os campos customizados após o fluxo nativo.

## Smoke test na instância de destino

Usar CI/Oferta e compromisso de homologação. Criar Degradation encerrada, conferir resultado após o evento, alterar o intervalo e excluir o registro; a contribuição deve ser recalculada/zerada. Testar os dois modos, a property geral desligada e as cores. Os testes em DEV não substituem essa homologação.

Não há scripts administrativos de instalação em massa neste diretório: o mecanismo de instalação recomendado é o Update Set XML. Os arquivos em `src/` são fontes para revisão.
