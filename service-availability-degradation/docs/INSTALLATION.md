# Instalação e transporte

## Pré-requisitos

- Acesso administrativo para importar, revisar e aplicar Update Sets.
- Aplicação Global e tabelas nativas `service_availability`, `service_commitment`, `service_offering_commitment`, `cmdb_ci_outage`, `cmdb_outage_ci_mtom` e agendas.
- Geração nativa de disponibilidade configurada e validada.
- Ofertas/CIs, compromissos, agendas, timezones e associações existentes no destino.
- APIs de servidor usadas pelo motor disponíveis na versão do destino, incluindo a composição de agendas de manutenção.

Não há plugin customizado, serviço externo, tabela própria ou dependência dos sys_ids de Ofertas/CIs da origem.

## Importação

1. Baixe [o XML](../service-availability-degradation-v1.1.0.xml) e confira [SHA256SUMS](../SHA256SUMS).
2. Importe em **System Update Sets → Retrieved Update Sets → Import Update Set from XML**.
3. Execute **Preview Update Set**. O pacote tem 36 Customer Updates, detalhados em [components.json](../components.json).
4. Revise conflitos com definições preexistentes dos quatro campos e componentes de mesmo nome. Não ignore conflitos automaticamente.
5. Execute **Commit Update Set** em janela controlada.
6. Verifique que os quatro campos e seus tipos estão disponíveis.
7. Confira properties, seis BRs de cálculo, Event Registry, Script Actions e agendamento.
8. Confira o Client Script, o Script Include de cores e os quatro Field Styles, incluídos no mesmo XML. Adicione Total degradation % às listas desejadas e valide os indicadores conforme [COLOR-INDICATORS.md](COLOR-INDICATORS.md).

O pacote contém o habilitador `true` e o job ativo às 06h00 de São Paulo. Planeje o commit fora desse horário, ou pause o job imediatamente após a instalação enquanto faz a validação local. Em atualização de uma instalação existente, pause o job antes do commit e confira se o pacote o reativou.

## Validação inicial

1. Selecione uma Oferta com compromisso e disponibilidade existente.
2. Confirme um registro do tipo **Degradation** (`degradation`) com início e fim preenchidos, associado diretamente ou pelos CIs afetados. Apenas Planned ou Outage não torna a disponibilidade elegível.
3. Execute o job de forma controlada ou aguarde o horário diário.
4. Confira duração, percentual, contagem e ponteiro.
5. Execute novamente: o registro `true` deve ser ignorado.
6. Altere uma Degradation de teste e aguarde a invalidação assíncrona. Valide também um Planned sobreposto: ele deve alterar o desconto, sem tornar elegível uma disponibilidade sem Degradation.
7. Valide alteração da property de modo em ambos os sentidos.
8. Confira os logs e a manutenção dos indicadores nativos.

Confira a [matriz de tipos](ARCHITECTURE.md#escopo-por-tipo-de-evento) e o [roteiro de aceitação por tipo](VALIDATION.md#aceitação-por-tipo-de-evento). Os testes da origem estão em [VALIDATION.md](VALIDATION.md). Não foi executado preview/commit em outra instância; essa homologação deve acontecer no destino.

## Definições incluídas

O XML contém:
- 25 componentes de execução/configuração, incluindo a extensão visual.
- 4 registros de dicionário.
- 7 rótulos de campos em inglês e português, conforme existentes na origem.

Não inclui personalizações de listas, layouts OOTB, registros de teste, CIs, Outages, Ofertas, compromissos ou resultados. Adicione os quatro campos às listas desejadas no destino.

O Fix Script administrativo tem parâmetros vazios e `DRY_RUN=true`; sem preenchê-los, sua execução apenas informa que nenhuma alteração foi feita.

## Atualizações e retirada

Esta versão consolida cálculo e indicadores no mesmo Update Set de origem (`ad7c0069c3681758e079b13ed40131e2`). Importe somente o XML v1.1.0 para uma instalação completa; não é necessário aplicar o v1.0.0 antes.

Se uma versão anterior desse mesmo Update Set já foi importada ou aplicada no destino, revise o estado existente e o comportamento de reimportação da plataforma com o administrador antes de importar novamente. Preview/commit desta atualização ainda não foram homologados em outra instância.

Para desativar o processamento, desative o job e coloque o habilitador em `false`. A invalidação por mudança de modo continua protegendo os resultados mesmo com o cálculo desabilitado. Para uma retirada completa, revise as dependências e faça backup dos campos customizados antes de removê-los.

