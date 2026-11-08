var LabTechnicalIncidentService = Class.create();
LabTechnicalIncidentService.prototype = Object.extendsObject(LabIncidentIntakeService, {
    authorize: function () { if (!gs.hasRole('itil')) { throw new Error('Este item é exclusivo para analistas de TI (itil).'); } },
    applicationQualifier: function () { return 'install_status!=7^operational_status!=6^life_cycle_stage_statusISEMPTY^ORlife_cycle_stage_status.name!=Retired'; },
    application: function (id) {
        id = String(id || '');
        if (!this._id(id)) { throw new Error('Selecione um Service Instance válido.'); }
        var g = new GlideRecordSecure('cmdb_ci_service_auto');
        g.addEncodedQuery(this.applicationQualifier()); g.addQuery('sys_id', id); g.query();
        if (!g.next() || !g.canRead()) { throw new Error('Service Instance inválido, aposentado ou sem acesso.'); }
        return {id:id,name:String(g.getDisplayValue()),description:g.isValidField('description') && g.getElement('description').canRead() ? String(g.getValue('description') || '') : (g.isValidField('short_description') && g.getElement('short_description').canRead() ? String(g.getValue('short_description') || '') : '')};
    },
    applications: function (producer, strict) {
        var main = this.application(producer.technical_application), multi = String(producer.technical_multiple) === 'yes';
        if (String(producer.technical_multiple) !== 'yes' && String(producer.technical_multiple) !== 'no') { throw new Error('Informe se existem múltiplas aplicações afetadas.'); }
        var apps = [main], seen = {}; seen[main.id] = true;
        if (multi) {
            var ids = String(producer.technical_additional || '').split(',');
            for (var i=0;i<ids.length;i++) { if (!ids[i] || seen[ids[i]]) { continue; } var a=this.application(ids[i]); apps.push(a); seen[a.id]=true; }
            if (strict && apps.length < 2) { throw new Error('Informe pelo menos mais um Service Instance distinto do principal.'); }
        }
        return {main:main,items:apps,multiple:multi};
    },

    relatedOptions: function (applicationId) {
        this.authorize();
        if (!applicationId) { return {ok:true,services:[],offerings:[]}; }
        var app=this.application(applicationId),ids=[],seen={},rel=new GlideRecord('cmdb_rel_ci');
        rel.addQuery('child',app.id);rel.addQuery('type.name','Depends on::Used by');rel.addQuery('parent.sys_class_name','service_offering');rel.query();
        while(rel.next()){var id=String(rel.getValue('parent'));if(!seen[id]){seen[id]=true;ids.push(id);}}
        if(!ids.length){return {ok:true,services:[],offerings:[]};}
        var validServices={},services=[],offerings=[],off=new GlideRecordSecure('service_offering');
        off.addQuery('sys_id','IN',ids.join(','));off.addQuery('operational_status','1');off.orderBy('name');off.query();
        while(off.next()){
            if(!off.canRead()||!off.getElement('name').canRead()){continue;}
            var sid=String(off.getValue('parent')||'');if(!this._id(sid)){continue;}
            if(!validServices.hasOwnProperty(sid)){
                var service=new GlideRecordSecure('cmdb_ci_service');service.addEncodedQuery(this.serviceQualifier());service.addQuery('sys_id',sid);service.query();
                validServices[sid]=service.next()&&service.canRead()&&service.getElement('name').canRead() ? {value:sid,label:String(service.getDisplayValue())}:false;
            }
            if(validServices[sid]){offerings.push({value:String(off.getUniqueValue()),label:String(off.getDisplayValue()),serviceId:sid});}
        }
        for(var key in validServices){if(validServices.hasOwnProperty(key)&&validServices[key]){services.push(validServices[key]);}}
        services.sort(function(a,b){return a.label<b.label?-1:(a.label>b.label?1:0);});
        return {ok:true,services:services,offerings:offerings};
    },
    listServices: function (applicationId) {
        var result=this.relatedOptions(applicationId);
        return {ok:true,options:result.services};
    },
    listOfferings: function (serviceId,applicationId) {
        var related=this.relatedOptions(applicationId),options=[];
        serviceId=String(serviceId||'');
        for(var i=0;i<related.offerings.length;i++){var o=related.offerings[i];if(o.serviceId===serviceId){options.push({value:o.value,label:o.label});}}
        return {ok:true,options:options};
    },
    getSelection: function (serviceId, offeringId) {
        if (this._multi) { return {serviceId:'',service:'Não informado (múltiplas aplicações)',offeringId:'',offering:''}; }
        serviceId=String(serviceId || ''); offeringId=String(offeringId || '');
        if (!serviceId) {
            if (offeringId) { throw new Error('Informe o serviço ao selecionar uma oferta.'); }
            return {serviceId:'',service:'Não informado',offeringId:'',offering:''};
        }
        if(!this._apps || !this._apps.main){throw new Error('Selecione a aplicação antes do serviço.');}
        var selection=LabIncidentIntakeService.prototype.getSelection.call(this,serviceId,offeringId,!offeringId);
        var related=this.relatedOptions(this._apps.main.id),validService=false,validOffering=!offeringId;
        for(var i=0;i<related.services.length;i++){if(related.services[i].value===serviceId){validService=true;break;}}
        for(var j=0;j<related.offerings.length;j++){var o=related.offerings[j];if(o.value===offeringId&&o.serviceId===serviceId){validOffering=true;break;}}
        if(!validService || !validOffering){throw new Error('O serviço ou a oferta não possui vínculo direto de oferta com o Service Instance selecionado. Atualize a seleção.');}
        return selection;
    },
    _outageGroups: function (selection) {
        var applicationMatches=[], seen={}, appNames=[];
        for (var a=0;a<this._apps.items.length;a++) {
            var app=this._apps.items[a]; appNames.push(app.name);
            var rows=this.findOutages({serviceId:app.id,service:app.name,offeringId:'',offering:''});
            for (var r=0;r<rows.length;r++) {
                if (seen[rows[r].id]) { continue; }
                seen[rows[r].id]=true; rows[r].origin='Service Instance selecionado: '+app.name; applicationMatches.push(rows[r]);
            }
        }
        var business=selection.serviceId ? this.findOutages(selection) : [], businessUnique=[];
        for (var b=0;b<business.length;b++) { if (!seen[business[b].id]) { seen[business[b].id]=true; businessUnique.push(business[b]); } }
        var defs=[
            {key:'application',title:'Service Instances selecionados',matches:applicationMatches,empty:'Nenhum outage ou degradação em curso nas aplicações selecionadas.'},
            {key:'service',title:'Serviços de Negócio e Ofertas',matches:businessUnique,empty:selection.serviceId ? 'Nenhuma ocorrência adicional no serviço ou oferta informados.' : 'Não consultado: serviço e oferta não informados.'}
        ],groups=[],internal=[],count=0;
        for (var i=0;i<defs.length;i++) {
            var d=defs[i],c=this._correlation(selection,d.matches); count+=d.matches.length;
            groups.push({key:d.key,title:d.title,count:d.matches.length,emptyMessage:d.empty,items:c.statusItems,publicLines:c.publicLines});
            internal=internal.concat(c.internalLines);
        }
        return {groups:groups,count:count,internalLines:internal,firstApplicationOutage:null};
    },
    getTechnicalStatus: function (producer) {
        this.authorize(); this._apps=this.applications(producer,false);this._multi=this._apps.multiple;
        var s=this.getSelection(producer.report_service,producer.report_offering),summary=this._outageGroups(s),groups=[];
        for (var i=0;i<summary.groups.length;i++) { var g=summary.groups[i]; groups.push({key:g.key,title:g.title,count:g.count,emptyMessage:g.emptyMessage,items:g.items}); }
        return {ok:true,count:summary.count,groups:groups,message:summary.count ? 'Ocorrências em curso para as aplicações e serviços informados:' : 'Nenhum outage ou degradação em curso identificado para a seleção.',checkedAt:new GlideDateTime().getDisplayValue()};
    },

    autoOutageState: function (applicationId) {
        this.authorize();var app=this.application(applicationId);
        var existing=this.findOutages({serviceId:app.id,service:app.name,offeringId:'',offering:''});
        return {ok:true,hasExisting:existing.length>0,count:existing.length,now:new GlideDateTime().getDisplayValue()};
    },
    outagePlan: function (producer) {
        var extent=String(producer.report_extent||'');
        if(extent!=='total'&&extent!=='partial'){return {requested:false,reason:'extent'};}
        var state=this.autoOutageState(producer.technical_application);
        if(state.hasExisting){return {requested:false,reason:'existing'};}
        if(!this._yes(producer.technical_outage_requested)){throw new Error('Atualize a verificação de outage da aplicação antes de enviar o formulário.');}
        var value=String(producer.technical_outage_begin||'').replace(/^\s+|\s+$/g,'');
        if(!value){throw new Error('Informe o início da indisponibilidade da aplicação.');}
        var begin=new GlideDateTime();begin.setValue(value);
        if(!begin.isValid()){throw new Error('Informe uma data e hora de início válidas.');}
        if(begin.getNumericValue()>new GlideDateTime().getNumericValue()+60000){throw new Error('O início da indisponibilidade não pode estar no futuro.');}
        return {requested:true,type:extent==='total'?'outage':'degradation',begin:begin.getValue(),displayBegin:begin.getDisplayValue()};
    },
    _outageNote: function (incidentId,text) {
        var record=new GlideRecord('incident');if(record.get(incidentId)){record.work_notes=text;record.update();}
    },
    _linkOutageTask: function (outageId,incidentId) {
        var link=new GlideRecord('task_outage');link.addQuery('outage',outageId);link.addQuery('task',incidentId);link.query();
        if(!link.hasNext()){link.initialize();link.setValue('outage',outageId);link.setValue('task',incidentId);if(!link.insert()){throw new Error('Não foi possível associar o outage ao incidente.');}}
    },
    createOutageAfterInsert: function (producer,current) {
        this.authorize();
        var incidentId=String(current.getUniqueValue()||''),persisted=new GlideRecord('incident');
        if(!this._id(incidentId)||!persisted.get(incidentId)){throw new Error('O incidente precisa existir antes da criação do outage.');}
        var app=this.application(producer.technical_application);
        if(String(persisted.getValue('cmdb_ci'))!==app.id){throw new Error('O SI principal diverge do IC do incidente criado.');}
        var replay=new GlideRecord('cmdb_ci_outage');replay.addQuery('cmdb_ci',app.id);replay.addQuery('task_number',incidentId);replay.addQuery('type','IN','outage,degradation');replay.query();
        if(replay.next()){this._linkOutageTask(replay.getUniqueValue(),incidentId);return {created:false,reason:'already_created',outage:String(replay.getUniqueValue()),number:String(replay.getValue('number'))};}
        var plan=this.outagePlan(producer);
        if(!plan.requested){
            if(plan.reason==='existing'){this._outageNote(incidentId,'Outage automático: nenhum novo registro criado, pois já existe outage/degradação em curso para o SI principal '+app.name+'.');}
            return {created:false,reason:plan.reason};
        }
        // A chave primária do controle é o próprio SI. A unicidade no banco
        // mantém uma única reserva por aplicação, inclusive entre transações.
        var guard=new GlideRecord('u_lab_si_outage_guard');guard.addQuery('sys_id',app.id);guard.query();
        if(guard.next()){
            var oldOutage=String(guard.getValue('u_outage')||''),oldIncident=String(guard.getValue('u_incident')||'');
            if(oldIncident===incidentId&&oldOutage){this._linkOutageTask(oldOutage,incidentId);return {created:false,reason:'already_created',outage:oldOutage};}
            if(!oldOutage){this._outageNote(incidentId,'Outage automático: outra solicitação está processando o SI principal. Nenhum outage duplicado foi criado.');return {created:false,reason:'concurrent'};}
            var remove=new GlideRecord('u_lab_si_outage_guard');remove.addQuery('sys_id',app.id);remove.addQuery('u_outage',oldOutage);remove.addQuery('u_incident',oldIncident);remove.deleteMultiple();
        }
        guard.initialize();guard.setNewGuidValue(app.id);guard.setValue('u_incident',incidentId);
        if(!guard.insert()){
            this._outageNote(incidentId,'Outage automático: criação reservada por outra solicitação do mesmo SI. Nenhum outage duplicado foi criado.');
            return {created:false,reason:'concurrent'};
        }
        var createdId='';
        try{
            var latest=this.autoOutageState(app.id);
            if(latest.hasExisting){return {created:false,reason:'existing'};}
            var outage=new GlideRecord('cmdb_ci_outage');outage.initialize();
            outage.setValue('cmdb_ci',app.id);outage.setValue('type',plan.type);outage.setValue('begin',plan.begin);outage.setValue('end','');
            outage.setValue('task_number',incidentId);outage.setValue('message',"[OUTAGE Automático] - Assistido CAT ITEM");outage.setValue('short_description',String(persisted.getValue('short_description')||'').substring(0,160));
            createdId=String(outage.insert()||'');if(!createdId){throw new Error('Falha na criação do outage: '+outage.getLastErrorMessage());}
            guard.get(app.id);guard.setValue('u_outage',createdId);if(!guard.update()){throw new Error('Falha ao registrar o controle de criação do outage.');}
            this._linkOutageTask(createdId,incidentId);
            this._outageNote(incidentId,'Outage criado automaticamente: '+outage.getValue('number')+' | SI principal: '+app.name+' | Tipo: '+(plan.type==='outage'?'OUTAGE':'Degradation')+' | Início: '+plan.displayBegin+' | Fim não informado.');
            gs.addInfoMessage('Outage '+outage.getValue('number')+' criado e associado ao incidente '+persisted.getValue('number')+'.');
            return {created:true,outage:createdId,number:String(outage.getValue('number')),type:plan.type,begin:plan.begin};
        }finally{
            if(!createdId){var cleanup=new GlideRecord('u_lab_si_outage_guard');cleanup.addQuery('sys_id',app.id);cleanup.addQuery('u_incident',incidentId);cleanup.addQuery('u_outage','');cleanup.deleteMultiple();}
        }
    },
    apply: function (producer,current) {
        this.authorize();this._apps=this.applications(producer,true);this._multi=this._apps.multiple;
        var channels={website:'Website',mobile:'Mobile',desktop:'Desktop App',totem:'Auto-Atendimento Totem'};
        var origins={monitoring:'Monitoração - Não integrada',business:'Usuário Interno - Negócio',routine:'Gestão da Rotina - Técnica',automated:'Fluxos Automatizados - Não Integrado'};
        var channel=this._choice(producer.technical_channel,channels,'Canal'),origin=this._choice(producer.technical_identification,origins,'Identificação');
        var autoPlan=this.outagePlan(producer);
        var result=LabIncidentIntakeService.prototype.apply.call(this,producer,current);
        current.setValue('cmdb_ci',this._apps.main.id);
        var title=this._apps.main.name+(this._multi ? ' (+'+(this._apps.items.length-1)+(this._apps.items.length===2?' aplicação)':' aplicações)') : '')+' - '+this.dictionaries().symptom[String(producer.report_symptom)]+' - '+channels[channel];
        current.setValue('short_description',title.replace(/[\r\n]+/g,' ').substring(0,160));
        var intro=['--- Aplicação/Sistema afetado ---','Service Instance principal: '+this._apps.main.name,'Descrição da aplicação: '+(this._apps.main.description || 'Não cadastrada'),'Múltiplos Service Instances afetados: '+(this._multi ? 'Sim' : 'Não')];
        if (this._multi) { intro.push('Demais Service Instances afetados:'); for(var i=1;i<this._apps.items.length;i++){intro.push('- '+this._apps.items[i].name);} }
        intro.push('','--- Contexto da identificação ---','Canal: '+channels[channel],'URL: '+(this._text(producer.technical_url,2048).replace(/[\r\n]+/g,' ') || 'Não informada'),'Identificação: '+origins[origin],'');
        var description=String(current.getValue('description')).replace('Oferta: Não sei identificar','Oferta: Não informado');
        description=description.replace('--- Reportar Incidente: informações do solicitante ---','--- Caracterização do incidente técnico ---').replace('Aplicações listadas possuem relação direta com a oferta selecionada. O impacto no serviço será avaliado pela equipe de atendimento.','Ocorrências consultadas para os CIs selecionados. A existência de outage não confirma causa comum.');
        if(autoPlan.requested){description+='\n\n--- Outage solicitado ---\nTipo: '+(autoPlan.type==='outage'?'OUTAGE':'Degradation')+'\nInício: '+autoPlan.displayBegin+'\nCriação após o incidente, condicionada à ausência de outra ocorrência em curso no SI principal.';}
        current.setValue('description',intro.join('\n')+'\n'+description);
        current.work_notes='Incidente técnico: CI principal selecionado explicitamente: '+this._apps.main.name+' ['+this._apps.main.id+']. Identificação: '+origins[origin]+'.\n'+'';
        return result;
    },
    addAffected: function (producer,current) {
        this.authorize();var apps=this.applications(producer,true);
        for (var i=1;i<apps.items.length;i++) {
            var rel=new GlideRecord('task_ci');rel.addQuery('task',current.getUniqueValue());rel.addQuery('ci_item',apps.items[i].id);rel.query();
            if (!rel.hasNext()) { rel.initialize();rel.setValue('task',current.getUniqueValue());rel.setValue('ci_item',apps.items[i].id);if(!rel.insert()){throw new Error('Falha ao associar CI afetado: '+apps.items[i].name);} }
        }
    },
    type:'LabTechnicalIncidentService'
});