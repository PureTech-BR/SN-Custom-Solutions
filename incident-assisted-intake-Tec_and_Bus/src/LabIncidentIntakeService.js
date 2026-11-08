var LabIncidentIntakeService = Class.create();
LabIncidentIntakeService.prototype = {
    initialize: function () {},

    serviceQualifier: function () {
        return 'sys_class_nameINcmdb_ci_service,cmdb_ci_service_business,cmdb_ci_service_technical^operational_status=1';
    },

    listServices: function () {
        var services = new GlideRecord('cmdb_ci_service');
        services.addEncodedQuery(this.serviceQualifier());
        services.orderBy('name');
        services.query();
        var rows = [];
        while (services.next()) { rows.push({value:services.getUniqueValue(),label:services.getDisplayValue()}); }
        return {ok:true,options:rows};
    },

    listOfferings: function (serviceId) {
        var selection = this.getSelection(serviceId, '', true);
        var offerings = new GlideRecord('service_offering');
        offerings.addQuery('parent', selection.serviceId);
        offerings.addQuery('operational_status', '1');
        offerings.orderBy('name');
        offerings.query();
        var rows = [];
        while (offerings.next()) { rows.push({value:offerings.getUniqueValue(),label:offerings.getDisplayValue()}); }
        return {ok:true,options:rows};
    },

    _id: function (value) { return /^[a-f0-9]{32}$/.test(String(value || '')); },
    _text: function (value, max) { return String(value || '').replace(/\u0000/g, '').substring(0, max || 4000); },
    _yes: function (value) { return /^(true|1|yes)$/i.test(String(value || '')); },
    _choice: function (value, choices, label) {
        value = String(value || '');
        if (!choices.hasOwnProperty(value)) { throw new Error('Selecione uma opção válida para: ' + label + '.'); }
        return value;
    },

    getSelection: function (serviceId, offeringId, unknown) {
        serviceId = String(serviceId || '');
        offeringId = String(offeringId || '');
        if (!this._id(serviceId)) { throw new Error('Selecione o serviço.'); }
        // Catalogo autenticado: publica somente nome e ID de servicos operacionais.
        // Nao concede leitura geral da CMDB ao solicitante.
        var service = new GlideRecord('cmdb_ci_service');
        service.addEncodedQuery(this.serviceQualifier());
        service.addQuery('sys_id', serviceId);
        service.query();
        if (!service.next()) { throw new Error('Serviço inválido ou sem permissão de acesso.'); }
        var result = {serviceId: serviceId, service: service.getDisplayValue(), offeringId: '', offering: ''};
        if (unknown) { return result; }
        if (!this._id(offeringId)) { throw new Error('Selecione uma oferta ou marque que não sabe identificar.'); }
        var offering = new GlideRecord('service_offering');
        if (!offering.get(offeringId) || offering.getValue('parent') !== serviceId || offering.getValue('operational_status') !== '1') {
            throw new Error('A oferta selecionada não pertence ao serviço informado ou não está acessível.');
        }
        result.offeringId = offeringId;
        result.offering = offering.getDisplayValue();
        return result;
    },

    findOutages: function (selection) {
        var targets = [selection.serviceId];
        if (selection.offeringId) { targets.push(selection.offeringId); }
        var ids = {}, affected = new GlideRecord('cmdb_outage_ci_mtom');
        affected.addQuery('ci_item', 'IN', targets.join(','));
        affected.query();
        while (affected.next()) { ids[affected.getValue('outage')] = true; }
        var outages = new GlideRecord('cmdb_ci_outage');
        var match = outages.addQuery('cmdb_ci', 'IN', targets.join(','));
        var affectedIds = [];
        for (var key in ids) { if (ids.hasOwnProperty(key)) { affectedIds.push(key); } }
        if (affectedIds.length) { match.addOrCondition('sys_id', 'IN', affectedIds.join(',')); }
        outages.addQuery('type', 'IN', 'outage,degradation');
        var now = new GlideDateTime();
        outages.addQuery('begin', '<=', now.getValue());
        outages.addQuery('end', '>=', now.getValue()).addOrCondition('end', '');
        outages.orderBy('begin');
        outages.query();
        var result = [];
        while (outages.next()) {
            var ciId = outages.getValue('cmdb_ci');
            var entry = {
                id: outages.getUniqueValue(), number: outages.getValue('number'),
                ci: ciId === selection.serviceId ? selection.service : (ciId === selection.offeringId ? selection.offering : this._text(outages.cmdb_ci.getDisplayValue(), 255)),
                type: outages.getValue('type'), begin: outages.begin.getDisplayValue(),
                origin: ciId === selection.offeringId ? 'Oferta diretamente' :
                    (ciId === selection.serviceId ? 'Serviço pai' : 'CI afetado relacionado'),
                primaryTask: outages.isValidField('task_number') ? outages.getValue('task_number') : ''
            };
            result.push(entry);
        }
        return result;
    },

    findApplicationOutages: function (selection) {
        if (!selection.offeringId) { return []; }
        // Um salto, na direcao semantica usada na CMDB: oferta depende da aplicacao.
        var relations = new GlideRecord('cmdb_rel_ci');
        relations.addQuery('parent', selection.offeringId);
        relations.addQuery('type.name', 'Depends on::Used by');
        relations.query();
        var candidates = {};
        while (relations.next()) { candidates[relations.getValue('child')] = true; }
        var candidateIds = [];
        for (var id in candidates) { if (candidates.hasOwnProperty(id) && this._id(id)) { candidateIds.push(id); } }
        if (!candidateIds.length) { return []; }
        // Consulta a hierarquia Application Service, incluindo descobertos e por tags.
        // Projeta apenas nomes de aplicacoes diretamente ligadas a oferta validada.
        var applications = new GlideRecord('cmdb_ci_service_auto');
        applications.addQuery('sys_id', 'IN', candidateIds.join(','));
        applications.query();
        var appNames = {}, appIds = [];
        while (applications.next()) {
            var appId = applications.getUniqueValue();
            appIds.push(appId);
            appNames[appId] = this._text(applications.getDisplayValue(), 255);
        }
        if (!appIds.length) { return []; }
        var outages = new GlideRecord('cmdb_ci_outage');
        outages.addQuery('cmdb_ci', 'IN', appIds.join(','));
        outages.addQuery('type', 'IN', 'outage,degradation');
        var now = new GlideDateTime();
        outages.addQuery('begin', '<=', now.getValue());
        outages.addQuery('end', '>=', now.getValue()).addOrCondition('end', '');
        outages.orderBy('begin');
        outages.orderBy('number');
        outages.orderBy('sys_id');
        outages.query();
        var result = [];
        while (outages.next()) {
            var ciId = outages.getValue('cmdb_ci');
            result.push({id:outages.getUniqueValue(),number:outages.getValue('number'),ci:appNames[ciId],
                type:outages.getValue('type'),begin:outages.begin.getDisplayValue(),layer:'application',
                origin:'Aplicação diretamente relacionada à oferta',offering:selection.offering,
                offeringId:selection.offeringId,applicationId:ciId,
                primaryTask:outages.isValidField('task_number') ? outages.getValue('task_number') : ''});
        }
        return result;
    },

    _outageGroups: function (selection) {
        var businessMatches = this.findOutages(selection), applications = this.findApplicationOutages(selection);
        // A regra original continua consultando affected CIs. Quando o mesmo OUT
        // pertence a uma aplicacao direta, apresenta apenas na camada especifica.
        var applicationOutageIds = {}, business = [];
        for (var a = 0; a < applications.length; a++) { applicationOutageIds[applications[a].id] = true; }
        for (var b = 0; b < businessMatches.length; b++) {
            if (!applicationOutageIds[businessMatches[b].id]) { business.push(businessMatches[b]); }
        }
        var definitions = [
            {key:'service',title:'Serviços de Negócio e Ofertas',matches:business,
                empty:applications.length ? 'Nenhuma ocorrência adicional de serviço ou oferta. Outages de aplicações estão no bloco abaixo.' :
                    'Nenhum outage ou degradação em curso no serviço ou na oferta.'},
            {key:'application',title:'Aplicações relacionadas à oferta',matches:applications,
                empty:selection.offeringId ? 'Nenhum outage ou degradação em curso nas aplicações diretamente relacionadas à oferta.' :
                    'Não consultado: oferta de serviço não informada.'}
        ];
        var groups = [], ids = {}, unique = 0, internalLines = [];
        for (var i = 0; i < definitions.length; i++) {
            var d = definitions[i], correlation = this._correlation(selection, d.matches);
            groups.push({key:d.key,title:d.title,count:d.matches.length,emptyMessage:d.empty,
                items:correlation.statusItems,publicLines:correlation.publicLines});
            for (var j = 0; j < d.matches.length; j++) {
                if (!ids[d.matches[j].id]) { ids[d.matches[j].id] = true; unique++; }
            }
            for (var k = 0; k < correlation.internalLines.length; k++) {
                internalLines.push('[' + d.title + '] ' + correlation.internalLines[k]);
            }
        }
        return {groups:groups,count:unique,internalLines:internalLines,
            firstApplicationOutage:applications.length ? applications[0] : null};
    },

    getStatus: function (serviceId, offeringId, unknown) {
        var selection = this.getSelection(serviceId, offeringId, unknown), summary = this._outageGroups(selection);
        var groups = [], items = [];
        for (var i = 0; i < summary.groups.length; i++) {
            var group = summary.groups[i];
            // Nunca envia notas internas ou detalhes de incidentes restritos ao widget.
            groups.push({key:group.key,title:group.title,count:group.count,items:group.items,emptyMessage:group.emptyMessage});
            items = items.concat(group.items);
        }
        return {ok:true,count:summary.count,groups:groups,items:items,
            message:summary.count ? 'Ocorrências em curso para a seleção informada. Consulte separadamente as camadas abaixo:' :
                'Nenhum outage ou degradação em curso foi identificado para a seleção neste momento.',
            checkedAt:new GlideDateTime().getDisplayValue()};
    },

    dictionaries: function () {
        return {
            symptom: {no_access:'Não consigo acessar',slow:'Lentidão',error:'Erro ao executar uma ação','function':'Funcionalidade indisponível',other:'Outro'},
            extent: {total:'Total',partial:'Parcial',unknown:'Não sei informar'},
            scope: {self:'Apenas eu',some:'Algumas pessoas',team:'Toda a minha equipe',all:'Várias equipes / todos os usuários',unknown:'Não sei informar'},
            continuity: {blocked:'Não consigo continuar e não existe alternativa',workaround:'Consigo continuar com uma alternativa ou dificuldade significativa',normal:'Consigo continuar, sem bloqueio da atividade',unknown:'Não sei avaliar'},
            frequency: {always:'Sempre',intermittent:'Intermitente',unknown:'Não sei informar'}
        };
    },

    classify: function (extent, scope, continuity) {
        return {impact: scope === 'self' ? '3' : (extent === 'total' && scope === 'all' ? '1' : '2'),
            urgency: continuity === 'blocked' ? '1' : (continuity === 'normal' ? '3' : '2')};
    },

    _correlation: function (selection, matches) {
        var publicLines = [], internalLines = [], statusItems = [], seen = {};
        for (var i = 0; i < matches.length; i++) {
            var o = matches[i], taskIds = {}, found = false;
            if (o.primaryTask) { taskIds[o.primaryTask] = true; }
            // A associação técnica é consultada no servidor; títulos internos não são enviados ao navegador.
            var rel = new GlideRecord('task_outage');
            rel.setWorkflow(false);
            rel.addQuery('outage', o.id);
            rel.query();
            while (rel.next()) { taskIds[rel.getValue('task')] = true; }
            for (var taskId in taskIds) {
                if (!taskIds.hasOwnProperty(taskId)) { continue; }
                var inc = new GlideRecord('incident');
                // A regra de consulta ESS restringe incidentes do solicitante.
                // Leitura tecnica limitada ao ID associado; detalhes ficam apenas em work notes.
                // A copia publica abaixo continua sujeita a GlideRecordSecure e suas regras.
                inc.setWorkflow(false);
                if (!inc.get(taskId)) { continue; }
                var pair = o.id + ':' + taskId;
                if (seen[pair]) { continue; }
                seen[pair] = true; found = true;
                var readable = new GlideRecordSecure('incident');
                var publicTitle = 'INC associado com acesso restrito';
                var publicNumber = 'INC com acesso restrito';
                if (readable.get(taskId) && readable.getElement('number').canRead()) {
                    publicTitle = readable.getValue('number');
                    publicNumber = readable.getValue('number');
                    if (readable.getElement('short_description').canRead()) {
                        publicTitle += ' - ' + this._text(readable.getValue('short_description'), 160).replace(/[\r\n]+/g, ' ');
                    }
                }
                statusItems.push(this._statusItem(o, publicNumber));
                publicLines = publicLines.concat(this._publicOutageLines(o, publicTitle));
                internalLines.push('INC=' + inc.getValue('number') + '; incident_sys_id=' + taskId +
                    '; descrição=' + this._text(inc.getValue('short_description'), 160).replace(/[\r\n]+/g, ' ') +
                    '; OUTAGE=' + o.number + '; outage_sys_id=' + o.id + '; origem=' + o.origin +
                    (o.layer === 'application' ? '; application_sys_id=' + o.applicationId + '; offering_sys_id=' + o.offeringId : '') + '.');
            }
            if (!found) {
                statusItems.push(this._statusItem(o, 'INC não associado'));
                publicLines = publicLines.concat(this._publicOutageLines(o, 'INC associado não identificado'));
                internalLines.push('OUTAGE=' + o.number + '; outage_sys_id=' + o.id + '; INC associado não identificado' +
                    (o.layer === 'application' ? '; application_sys_id=' + o.applicationId + '; offering_sys_id=' + o.offeringId : '') + '.');
            }
        }
        return {publicLines:publicLines, internalLines:internalLines,statusItems:statusItems};
    },

    _statusItem: function (outage, incident) {
        return {incident:incident,outage:outage.number,ci:outage.ci || 'IC não identificado',
            origin:outage.origin,begin:outage.begin,type:outage.type,
            typeLabel:outage.type === 'degradation' ? 'Degradação' : 'Indisponibilidade',
            offering:outage.layer === 'application' ? outage.offering : ''};
    },

    _publicOutageLines: function (outage, incident) {
        var lines = ['- ' + outage.number + ' | ' +
            (outage.type === 'degradation' ? 'Degradação' : 'Indisponibilidade') + ' | ' + outage.ci,
            '  Origem: ' + outage.origin + ' | Início: ' + outage.begin,
            '  Incidente associado: ' + incident];
        if (outage.layer === 'application') {
            lines.push('  Oferta relacionada: ' + outage.offering + ' (relação direta Depends on::Used by).');
        }
        return lines;
    },

    apply: function (producer, current) {
        var dict = this.dictionaries();
        var selection = this.getSelection(producer.report_service, producer.report_offering, this._yes(producer.offering_unknown));
        var symptom = this._choice(producer.report_symptom, dict.symptom, 'O que está acontecendo');
        var extent = this._choice(producer.report_extent, dict.extent, 'Extensão da indisponibilidade');
        var scope = this._choice(producer.report_scope, dict.scope, 'Quem está sendo afetado');
        var continuity = this._choice(producer.report_continuity, dict.continuity, 'Continuidade da atividade');
        var description = this._text(producer.intake_description).replace(/^\s+|\s+$/g, '');
        if (!description) { throw new Error('Descreva o problema.'); }
        var detail = this._text(producer.affected_function);
        var slow = this._text(producer.slow_action);
        if (extent === 'partial' && !detail.replace(/\s/g, '')) { throw new Error('Informe a funcionalidade afetada pela indisponibilidade parcial.'); }
        if (symptom === 'slow' && !slow.replace(/\s/g, '')) { throw new Error('Informe em qual ação ocorre a lentidão.'); }
        var frequency = '';
        if (symptom === 'slow' || symptom === 'error') { frequency = this._choice(producer.report_frequency, dict.frequency, 'Frequência do problema'); }
        var startedUnknown = this._yes(producer.started_unknown);
        var started = this._text(producer.report_started_at, 100);
        if (!startedUnknown && !started) { throw new Error('Informe quando o problema começou ou marque que não sabe informar.'); }
        var clarification = this._text(producer.classification_note);
        if (extent === 'total' && scope === 'all' && continuity === 'normal' && !clarification.replace(/\s/g, '')) {
            throw new Error('Esclareça como consegue continuar a atividade com o serviço totalmente indisponível.');
        }
        var classification = this.classify(extent, scope, continuity);
        var summary = this._outageGroups(selection);
        var checked = new GlideDateTime().getDisplayValue() + ' (' + gs.getSession().getTimeZoneName() + ')';
        var lines = [description, '', '--- Reportar Incidente: informações do solicitante ---',
            'Serviço: ' + selection.service, 'Oferta: ' + (selection.offering || 'Não sei identificar'),
            'Sintoma: ' + dict.symptom[symptom], 'Extensão: ' + dict.extent[extent],
            'Abrangência: ' + dict.scope[scope], 'Continuidade: ' + dict.continuity[continuity],
            'Início informado: ' + (startedUnknown ? 'Não sei informar' : started)];
        if (extent === 'partial') { lines.push('Funcionalidade afetada: ' + detail); }
        if (symptom === 'slow') { lines.push('Ação com lentidão: ' + slow); }
        if (frequency) { lines.push('Frequência: ' + dict.frequency[frequency]); }
        if (symptom === 'error' && this._text(producer.error_message)) { lines.push('Mensagem de erro: ' + this._text(producer.error_message)); }
        if (continuity === 'workaround' && this._text(producer.workaround_detail)) { lines.push('Alternativa: ' + this._text(producer.workaround_detail)); }
        if (clarification && extent === 'total' && scope === 'all' && continuity === 'normal') { lines.push('Esclarecimento: ' + clarification); }
        lines.push('', 'Classificação inicial pelas respostas: Impacto=' + classification.impact + '; Urgência=' + classification.urgency +
            '. Prioridade calculada pela matriz da plataforma.');
        if (scope === 'unknown' || continuity === 'unknown' || extent === 'unknown') { lines.push('Triagem: solicitante não soube informar uma ou mais dimensões da classificação.'); }
        lines.push('', '--- Auto Impact: consulta no envio ---', 'Verificado em: ' + checked);
        for (var groupIndex = 0; groupIndex < summary.groups.length; groupIndex++) {
            var group = summary.groups[groupIndex];
            lines.push('', '[' + (groupIndex + 1) + '] ' + group.title);
            lines = lines.concat(group.publicLines.length ? group.publicLines : [group.emptyMessage]);
        }
        lines.push('', 'Aplicações listadas possuem relação direta com a oferta selecionada. O impacto no serviço será avaliado pela equipe de atendimento.');
        current.setValue('caller_id', gs.getUserID());
        current.setValue('contact_type', 'self-service');
        current.setValue('business_service', selection.serviceId);
        current.setValue('service_offering', selection.offeringId);
        if (summary.firstApplicationOutage) {
            current.setValue('cmdb_ci', summary.firstApplicationOutage.applicationId);
        }
        current.setValue('impact', classification.impact);
        current.setValue('urgency', classification.urgency);
        current.setValue('short_description', (selection.service + ' - ' + dict.symptom[symptom]).replace(/[\r\n]+/g, ' ').substring(0, 160));
        current.setValue('description', lines.join('\n'));
        current.setValue('parent_incident', '');
        current.setValue('parent', '');
        current.work_notes = 'Reportar Incidente — rastreabilidade técnica da consulta em ' + checked +
            '\nservice_sys_id=' + selection.serviceId + '; offering_sys_id=' + selection.offeringId + '\n' +
            (summary.internalLines.join('\n') || 'Nenhuma ocorrência em curso identificada.') +
            (summary.firstApplicationOutage ? '\nCI associado automaticamente: ' + summary.firstApplicationOutage.ci +
                '; cmdb_ci=' + summary.firstApplicationOutage.applicationId + '; primeiro outage de aplicacao=' +
                summary.firstApplicationOutage.number + ' (ordem: inicio, numero, sys_id).' : '');
        return {impact:classification.impact, urgency:classification.urgency, outages:summary.count};
    },
    type: 'LabIncidentIntakeService'
};
