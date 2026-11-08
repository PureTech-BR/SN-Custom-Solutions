function onChange(control,oldValue,newValue,isLoading){if(isLoading)return;g_form.clearValue('report_offering');loadRelatedServices('report_offering','getOfferings',newValue);}
function loadRelatedServices(name,method,serviceId){
 var app=g_form.getValue('technical_application'),multi=g_form.getValue('technical_multiple')==='yes';
 g_form.hideFieldMsg(name,true);g_form.clearOptions(name);g_form.addOption(name,'','-- Não informado --');g_form.setReadOnly(name,true);
 if(!app||multi||(name==='report_offering'&&!serviceId)){
  if(!app&&name==='report_service'){g_form.showFieldMsg(name,'Selecione a aplicação para consultar os serviços relacionados.','info',false);}
  return;
 }
 var ga=new GlideAjax('LabTechnicalIncidentAjax');ga.addParam('sysparm_name',method);ga.addParam('sysparm_application',app);
 if(serviceId){ga.addParam('sysparm_service',serviceId);}
 ga.getXMLAnswer(function(answer){
  if(g_form.getValue('technical_application')!==app||g_form.getValue('technical_multiple')==='yes'||(name==='report_offering'&&g_form.getValue('report_service')!==serviceId)){return;}
  var r;try{r=JSON.parse(answer);}catch(e){}
  if(!r||!r.ok){g_form.showFieldMsg(name,'Não foi possível consultar os vínculos. Recarregue o formulário para tentar novamente.','error',false);return;}
  g_form.clearOptions(name);g_form.addOption(name,'','-- Não informado --');
  for(var i=0;i<r.options.length;i++){g_form.addOption(name,r.options[i].value,r.options[i].label);}
  g_form.setReadOnly(name,!r.options.length);
  if(!r.options.length){g_form.showFieldMsg(name,name==='report_service'?'Nenhum serviço operacional com oferta diretamente relacionada à aplicação selecionada. O preenchimento continua opcional.':'Nenhuma oferta operacional deste serviço está diretamente relacionada à aplicação selecionada.','info',false);}
 });
}
function resetRelatedServices(){
 g_form.clearValue('report_offering');g_form.clearValue('report_service');
 loadRelatedServices('report_offering','getOfferings','');loadRelatedServices('report_service','getServices','');
}