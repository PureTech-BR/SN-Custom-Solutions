# Instalação e transporte

## Pré-requisitos

- Acesso administrativo para importar, revisar e aplicar Update Sets.
- Aplicação Global e tabelas nativas `service_availability`, `service_commitment`, `service_offering_commitment`, `cmdb_ci_outage`, `cmdb_outage_ci_mtom` e agendas.
- Geração nativa de disponibilidade configurada e validada.
- Ofertas/CIs, compromissos, agendas, timezones e associações existentes no destino.
- APIs de servidor usadas pelo motor disponíveis na versão do destino, incluindo a composição de agendas de manutenção.

Não há plugin customizado, serviço externo, tabela própria ou dependência dos sys_ids de Ofertas/CIs da origem.

## Importação

1. Baixe [o XML](../service-availability-degradation-v1.0.0.xml) e confira [SHA256SUMS](../SHA256SUMS).
2. Importe em **System Update Sets → Retrieved Update Sets → Import Update Set from XML**.
3. Execute **Preview Update Set**. O pacote tem 29 Customer Updates, detalhados em [components.json](../components.json).
4. Revise conflitos com definições preexistentes dos quatro campos e componentes de mesmo nome. Não ignore conflitos automaticamente.
5. Execute **Commit Update Set** em janela controlada.
6. Verifique que os quatro campos e seus tipos estão disponíveis.
7. Confira properties, BRs, Event Registry, Script Actions e agendamento.

O pacote contém o habilitador `true` e o job ativo às 06h00 de São Paulo. Planeje o commit fora desse horário, ou pause o job imediatamente após a instalação enquanto faz a validação local. Em atualização de uma instalação existente, pause o job antes do commit e confira se o pacote o reativou.

## Validação inicial

1. Selecione uma Oferta com compromisso e disponibilidade existente.
2. Confirme uma degradação encerrada associada diretamente ou pelos CIs afetados.
3. Execute o job de forma controlada ou aguarde o horário diário.
4. Confira duração, percentual, contagem e ponteiro.
5. Execute novamente: o registro `true` deve ser ignorado.
6. Altere um evento de teste e aguarde a invalidação assíncrona.
7. Valide alteração da property de modo em ambos os sentidos.
8. Confira os logs e a manutenção dos indicadores nativos.

Os testes da origem estão em [VALIDATION.md](VALIDATION.md). Não foi executado preview/commit em outra instância; essa homologação deve acontecer no destino.

## Definições incluídas

O XML contém:
- 18 componentes de execução/configuração.
- 4 registros de dicionário.
- 7 rótulos de campos em inglês e português, conforme existentes na origem.

Não inclui personalizações de listas, layouts OOTB, registros de teste, CIs, Outages, Ofertas, compromissos ou resultados. Adicione os quatro campos às listas desejadas no destino.

O Fix Script administrativo tem parâmetros vazios e `DRY_RUN=true`; sem preenchê-los, sua execução apenas informa que nenhuma alteração foi feita.

## Atualizações e retirada

Use outro Update Set para mudanças futuras. Não reabra o pacote concluído para acumular alterações não relacionadas.

Para desativar o processamento, desative o job e coloque o habilitador em `false`. A invalidação por mudança de modo continua protegendo os resultados mesmo com o cálculo desabilitado. Para uma retirada completa, revise as dependências e faça backup dos campos customizados antes de removê-los.

O campo antigo `u_degradation_revision` não é criado nem referenciado pelos scripts desta versão. Se existir em um destino com versão preliminar, sua remoção é uma atividade de migração separada; o pacote inicial não contém uma exclusão desse campo.

