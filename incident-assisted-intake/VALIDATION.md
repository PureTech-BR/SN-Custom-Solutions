# Validação — v1.1.0

## Evidências

- 60 combinações de classificação e validações de entradas/consultas originais testadas localmente.
- Testes de relação direta, direção/tipo, subclasses, relações repetidas, exclusão de indiretos/infraestrutura, janela temporal e tipos de outage.
- Regressão da duplicidade entre blocos, mantendo outages distintos, consulta fresca no envio e privacidade do INC associado.
- Múltiplas aplicações: todos os outages no resumo, CI do primeiro por início/número/sys_id. Sem oferta ou apenas outage de serviço, esta lógica não atribui CI.
- Variable Editor: ACLs, guest, escopo do producer, rótulos históricos, fallback por acesso, valores preservados e campos somente leitura.
- PDI: envios reais com dois blocos, conferência visual no Employee Center, correção do OpenLDAP repetido e criação com CI automático. A base também foi testada com solicitante sem papéis administrativos e validações por API.
- Consolidação: recaptura das configurações atuais dos 56 componentes, verificação dos payloads e ausência de nomes duplicados no XML.

Os testes locais simulam GlideRecord. Não foi realizado commit desta publicação em uma segunda instância limpa; Preview/Commit e homologação no destino continuam necessários.

## Testes locais

Com Node.js instalado, a partir desta pasta:

```sh
node src/validate.cjs
node src/validate-variable-editor.cjs
node src/validate-outage-groups.cjs
```

Não acessam a instância nem criam registros. Instale a solução pelo XML.

## Checklist no destino

- [ ] Importar somente XML v1.1.0; Preview, conflitos/dependências e Commit na Global.
- [ ] Confirmar 56 componentes únicos e adaptar vínculos de catálogo/categoria/tópico.
- [ ] Abrir com solicitante real, sem perfil administrativo.
- [ ] Serviço mostra apenas suas ofertas operacionais; trocar serviço limpa oferta anterior.
- [ ] Oferta desconhecida permite prosseguir com serviço válido.
- [ ] Parcial sem funcionalidade, lentidão sem ação/frequência e início obrigatório ausente impedem criação.
- [ ] Total + todos + continuidade normal exige esclarecimento.
- [ ] Envio inválido por API, inclusive oferta de outro serviço, é rejeitado.
- [ ] Outage no serviço pai aparece no bloco 1; outage na oferta mostra origem Oferta diretamente.
- [ ] Outage na aplicação diretamente ligada aparece no bloco 2 para a oferta correspondente.
- [ ] A mesma aplicação com oferta como CI afetado não duplica seu OUT no bloco 1.
- [ ] Outage distinto de serviço e aplicação aparecem em seus respectivos blocos.
- [ ] Dois outages de aplicações diferentes: ambos no Auto Impact e CI do primeiro por início/número/sys_id.
- [ ] Encerrados, início futuro e tipo planned ficam fora da consulta.
- [ ] Aplicação indireta, relação invertida e infraestrutura ficam fora da busca complementar de aplicações.
- [ ] Sem outages, mensagem informativa e abertura permitida.
- [ ] Encerrar outage entre seleção e envio: descrição deve refletir a nova consulta do servidor.
- [ ] Conferir caller, serviço/oferta, CI, contato self-service, título, descrição e respostas salvas.
- [ ] Conferir impacto/urgência por respostas e prioridade pela matriz local.
- [ ] Nenhum vínculo automático pai/filho; rastreabilidade técnica em work notes.
- [ ] Sem acesso ao INC associado: aviso/descrição não expõem seu número/título.
- [ ] Variable Editor na view da equipe: respostas somente leitura e nomes conforme ACLs.
- [ ] Encerrar outage depois da criação não reescreve a descrição histórica.
- [ ] Remover ou encerrar somente os registros criados para homologação.
