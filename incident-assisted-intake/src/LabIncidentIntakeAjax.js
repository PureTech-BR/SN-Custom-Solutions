var LabIncidentIntakeAjax = Class.create();
LabIncidentIntakeAjax.prototype = Object.extendsObject(AbstractAjaxProcessor, {
    getRecordVariableLabels: function () {
        if (gs.getUserName() === 'guest') { return JSON.stringify({ok:false}); }
        var incidentId = String(this.getParameter('sysparm_incident') || '');
        if (!/^[a-f0-9]{32}$/.test(incidentId)) { return JSON.stringify({ok:false}); }
        var incident = new GlideRecordSecure('incident');
        if (!incident.get(incidentId) || !incident.canRead()) { return JSON.stringify({ok:false}); }
        // Resolve somente valores salvos deste producer em um incidente legivel.
        // Nao aceita sys_ids de CIs arbitrarios fornecidos pelo navegador.
        var questions = new GlideRecord('item_option_new');
        questions.addQuery('cat_item', '0745a07dc3c09310e079b13ed4013110');
        questions.addQuery('name', 'IN', 'report_service,report_offering');
        questions.query();
        var names = {}, ids = [];
        while (questions.next()) {
            var questionId = questions.getUniqueValue();
            ids.push(questionId);
            names[questionId] = questions.getValue('name');
        }
        if (!ids.length) { return JSON.stringify({ok:true,matched:false}); }
        var answers = new GlideRecord('question_answer');
        answers.addQuery('table_name', 'incident');
        answers.addQuery('table_sys_id', incidentId);
        answers.addQuery('question', 'IN', ids.join(','));
        answers.query();
        var result = {ok:true,matched:false,labels:{}};
        while (answers.next()) {
            result.matched = true;
            var name = names[answers.getValue('question')];
            var value = String(answers.getValue('value') || '');
            if (!name || !value) { continue; }
            var table = name === 'report_service' ? 'cmdb_ci_service' : 'service_offering';
            // Inclui registros inativos quando legiveis, sem ampliar ACLs da CMDB.
            var record = new GlideRecordSecure(table);
            var label = 'Registro removido ou sem acesso';
            if (/^[a-f0-9]{32}$/.test(value) && record.get(value) && record.canRead() && record.getElement('name').canRead()) {
                label = String(record.getDisplayValue() || label);
            }
            result.labels[name] = {value:value,label:label};
        }
        return JSON.stringify(result);
    },
    getServices: function () {
        if (gs.getUserName() === 'guest') { return JSON.stringify({ok:false,message:'Faça login.'}); }
        return JSON.stringify(new global.LabIncidentIntakeService().listServices());
    },
    getOfferings: function () {
        if (gs.getUserName() === 'guest') { return JSON.stringify({ok:false,message:'Faça login.'}); }
        try { return JSON.stringify(new global.LabIncidentIntakeService().listOfferings(this.getParameter('sysparm_service'))); }
        catch (e) { return JSON.stringify({ok:false,message:String(e.message || e)}); }
    },
    getStatus: function () {
        if (gs.getUserName() === 'guest') { return JSON.stringify({ok:false,message:'Faça login para consultar o status.'}); }
        try {
            var service = new global.LabIncidentIntakeService();
            return JSON.stringify(service.getStatus(this.getParameter('sysparm_service'),
                this.getParameter('sysparm_offering'), service._yes(this.getParameter('sysparm_unknown'))));
        } catch (e) {
            gs.error('Intake status: ' + e + '; stack=' + e.stack + '; line=' + e.lineNumber, 'LabIncidentIntake');
            return JSON.stringify({ok:false,message:'Consulta temporariamente indisponível.'});
        }
    },
    isPublic: function () { return false; },
    type: 'LabIncidentIntakeAjax'
});
