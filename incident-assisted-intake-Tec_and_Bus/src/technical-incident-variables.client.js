function onLoad(){
 if(g_form.isNewRecord()||!g_form.getValue('variables.technical_application'))return;
 var fields=['technical_application','technical_application_description','technical_multiple','technical_additional','technical_channel','technical_url','technical_identification','report_service','report_offering','report_symptom','report_extent','technical_outage_type','technical_outage_begin','affected_function','slow_action','report_frequency','error_message','report_scope','report_continuity','workaround_detail','classification_note','started_unknown','report_started_at','intake_description'];
 function key(n){return 'variables.'+n;}function value(n){return g_form.getValue(key(n));}
 function lock(){for(var i=0;i<fields.length;i++){g_form.setMandatory(key(fields[i]),false);g_form.setReadOnly(key(fields[i]),true);}}
 function show(n,v){g_form.setDisplay(key(n),v||!!value(n));}
 lock();show('technical_additional',value('technical_multiple')==='yes');
 show('affected_function',value('report_extent')==='partial');show('slow_action',value('report_symptom')==='slow');show('report_frequency',/^(slow|error)$/.test(value('report_symptom')));show('error_message',value('report_symptom')==='error');show('workaround_detail',value('report_continuity')==='workaround');show('classification_note',!!value('classification_note'));show('report_started_at',!/^(true|1|yes)$/i.test(value('started_unknown')));
 var requested=/^(true|1|yes)$/i.test(value('technical_outage_requested'));show('technical_outage_type',requested);show('technical_outage_begin',requested);g_form.setDisplay(key('technical_outage_notice'),false);g_form.setDisplay(key('technical_outage_hint'),false);g_form.setDisplay(key('technical_outage_requested'),false);g_form.setDisplay(key('technical_outage_state'),false);g_form.setDisplay(key('outage_status_data'),false);g_form.setDisplay(key('outage_notice_service'),false);
 var ga=new GlideAjax('LabTechnicalIncidentAjax');ga.addParam('sysparm_name','getRecordVariableLabels');ga.addParam('sysparm_incident',g_form.getUniqueValue());
 ga.getXMLAnswer(function(answer){var r;try{r=JSON.parse(answer);}catch(e){return;}if(!r||!r.ok||!r.matched)return;
 var names=['report_service','report_offering'];for(var i=0;i<names.length;i++){var n=names[i],v=r.labels[n];if(!v||value(n)!==v.value)continue;g_form.setReadOnly(key(n),false);g_form.clearOptions(key(n));g_form.addOption(key(n),v.value,v.label);g_form.setValue(key(n),v.value);}lock();
 });
}