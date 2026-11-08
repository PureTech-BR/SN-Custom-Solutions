function onChange(control,oldValue,newValue,isLoading){if(isLoading)return;g_form.clearValue('technical_outage_begin');refreshAutoOutage();}
function showAutoOutage(visible){
 g_form.setMandatory('technical_outage_begin',false);
 var fields=['technical_outage_notice','technical_outage_type','technical_outage_begin','technical_outage_hint'];
 for(var i=0;i<fields.length;i++){g_form.setDisplay(fields[i],visible);}
 g_form.setMandatory('technical_outage_begin',visible);
}
function refreshAutoOutage(){
 showAutoOutage(false);g_form.setValue('technical_outage_requested','false');g_form.setValue('technical_outage_state','not_applicable');
 g_form.hideFieldMsg('report_extent',true);
 var app=g_form.getValue('technical_application'),extent=g_form.getValue('report_extent');
 if(!app||(extent!=='total'&&extent!=='partial')){return;}
 g_form.setValue('technical_outage_type',extent==='total'?'outage':'degradation');
 g_form.setValue('technical_outage_state','checking');
 var ga=new GlideAjax('LabTechnicalIncidentAjax');ga.addParam('sysparm_name','getAutoOutageState');ga.addParam('sysparm_application',app);
 ga.getXMLAnswer(function(answer){
  if(g_form.getValue('technical_application')!==app||g_form.getValue('report_extent')!==extent){return;}
  var r;try{r=JSON.parse(answer);}catch(e){}
  if(!r||!r.ok){g_form.setValue('technical_outage_state','error');g_form.showFieldMsg('report_extent','Não foi possível verificar os outages da aplicação. Recarregue o formulário antes de enviar.','error',false);return;}
  if(r.hasExisting){g_form.setValue('technical_outage_state','existing');g_form.showFieldMsg('report_extent','Já existe outage ou degradação em curso para o SI principal. Nenhum novo outage será criado.','info',false);return;}
  if(!g_form.getValue('technical_outage_begin')){g_form.setValue('technical_outage_begin',r.now);}
  g_form.setValue('technical_outage_state','eligible');g_form.setValue('technical_outage_requested','true');showAutoOutage(true);
 });
}