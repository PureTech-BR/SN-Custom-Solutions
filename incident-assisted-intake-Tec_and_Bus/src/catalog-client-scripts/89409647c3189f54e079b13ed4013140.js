function onLoad(){renderTechnicalOutages();}
function renderTechnicalOutages(){
 var multi=g_form.getValue('technical_multiple')==='yes';
 g_form.setDisplay('lab_technical_services',!multi);
 g_form.setDisplay('report_service',!multi);g_form.setDisplay('report_offering',!multi);
 if(multi){if(g_form.getValue('report_service')){g_form.clearValue('report_service');}if(g_form.getValue('report_offering')){g_form.clearValue('report_offering');}}
 g_form.setDisplay('outage_notice_service',false);g_form.setValue('outage_status_data','');
 g_form.hideFieldMsg('technical_multiple',true);
 var app=g_form.getValue('technical_application');if(!app){return;}
 var others=g_form.getValue('technical_additional'),service=g_form.getValue('report_service'),offering=g_form.getValue('report_offering');
 var ga=new GlideAjax('LabTechnicalIncidentAjax');ga.addParam('sysparm_name','getStatus');ga.addParam('sysparm_application',app);
 ga.addParam('sysparm_multiple',multi?'yes':'no');ga.addParam('sysparm_additional',others);ga.addParam('sysparm_service',service);ga.addParam('sysparm_offering',offering);
 ga.getXMLAnswer(function(answer){
  if(g_form.getValue('technical_application')!==app||g_form.getValue('technical_additional')!==others||g_form.getValue('report_service')!==service||g_form.getValue('report_offering')!==offering||(g_form.getValue('technical_multiple')==='yes')!==multi){return;}
  var r;try{r=JSON.parse(answer);}catch(e){}
  if(!r||!r.ok){g_form.showFieldMsg('technical_multiple','Consulta de ocorrências indisponível. Será refeita no envio.','info',false);return;}
  if(r.count){g_form.setValue('outage_status_data',JSON.stringify(r));g_form.setDisplay('outage_notice_service',true);}
  else{g_form.showFieldMsg('technical_multiple',r.message,'info',false);}
 });
}