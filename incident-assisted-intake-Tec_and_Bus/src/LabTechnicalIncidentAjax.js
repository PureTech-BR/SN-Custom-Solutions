var LabTechnicalIncidentAjax=Class.create();
LabTechnicalIncidentAjax.prototype=Object.extendsObject(AbstractAjaxProcessor,{
    getRecordVariableLabels: function () {
        if (!gs.hasRole('itil')) { return JSON.stringify({ok:false}); }
        var incidentId = String(this.getParameter('sysparm_incident') || '');
        if (!/^[a-f0-9]{32}$/.test(incidentId)) { return JSON.stringify({ok:false}); }
        var incident = new GlideRecordSecure('incident');
        if (!incident.get(incidentId) || !incident.canRead()) { return JSON.stringify({ok:false}); }
        // Resolve somente valores salvos deste producer em um incidente legivel.
        // Nao aceita sys_ids de CIs arbitrarios fornecidos pelo navegador.
        var questions = new GlideRecord('item_option_new');
        questions.addQuery('variable_set', 'fa309e07c3189f54e079b13ed40131e5');
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
    _service:function(){var s=new global.LabTechnicalIncidentService();s.authorize();return s;},
    _run:function(fn){try{return JSON.stringify(fn.call(this,this._service()));}catch(e){return JSON.stringify({ok:false,message:String(e.message || e)});}},
    getServices:function(){return this._run(function(s){return s.listServices(this.getParameter('sysparm_application'));});},
    getOfferings:function(){return this._run(function(s){return s.listOfferings(this.getParameter('sysparm_service'),this.getParameter('sysparm_application'));});},
    getApplicationDetails:function(){return this._run(function(s){return {ok:true,application:s.application(this.getParameter('sysparm_application'))};});},
    getAutoOutageState:function(){return this._run(function(s){return s.autoOutageState(this.getParameter('sysparm_application'));});},
    getStatus:function(){return this._run(function(s){return s.getTechnicalStatus({technical_application:this.getParameter('sysparm_application'),technical_multiple:this.getParameter('sysparm_multiple'),technical_additional:this.getParameter('sysparm_additional'),report_service:this.getParameter('sysparm_service'),report_offering:this.getParameter('sysparm_offering')});});},
    isPublic:function(){return false;},
    type:'LabTechnicalIncidentAjax'
});