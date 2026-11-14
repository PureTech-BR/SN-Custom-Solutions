# Reversão

A pasta anterior `service-availability-degradation` foi preservada no repositório. O XML V2 inclui desativações, não exclusões dos componentes V1. A reversão abaixo se aplica quando a V1 já estava instalada e suas configurações anteriores estão disponíveis.

1. Suspender o cálculo pela property geral e aguardar/conferir solicitações em processamento.
2. Desativar as três BRs V2, duas Script Actions V2, Client Script V2 e dois Script Includes V2. Desabilitar os quatro predicados de Field Style V2.
3. Restaurar os estados da V1 usando sua configuração validada: seis BRs funcionais, duas Script Actions, motor/configuração de cores, Client Script e job. As duas BRs experimentais de cores continuam inativas.
4. Restaurar as quatro condições/estilos da V1, suas properties operacionais e o modo pretendido. Conferir o campo legado `u_degradation_calculated`.
5. Religar a chave geral e executar o reprocessamento adequado da V1.

A restauração de configuração não desfaz automaticamente os resultados calculados pela V2. Não reativar V1 e V2 ao mesmo tempo. O Back Out nativo deve passar por Preview e análise dos efeitos sobre campos compartilhados; não é tratado como reversão automática já homologada.

Para uma instalação nova, sem V1 anterior, desligar a chave geral e desativar os componentes V2 suspende o recurso; não ativar o legado inativo transportado pelo pacote.
