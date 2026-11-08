function onChange(control,oldValue,newValue,isLoading){if(isLoading)return;renderApplications();}
function renderApplications(){
 var multi=g_form.getValue('technical_multiple')==='yes';
 g_form.setMandatory('technical_additional',false);g_form.setDisplay('technical_additional',multi);g_form.setMandatory('technical_additional',multi);
 if(!multi&&g_form.getValue('technical_additional')){g_form.clearValue('technical_additional');}
 var id=g_form.getValue('technical_application');
 if(!id){g_form.setValue('technical_application_description','');return;}
 var ga=new GlideAjax('LabTechnicalIncidentAjax');ga.addParam('sysparm_name','getApplicationDetails');ga.addParam('sysparm_application',id);
 ga.getXMLAnswer(function(answer){
  if(g_form.getValue('technical_application')!==id){return;}
  var r;try{r=JSON.parse(answer);}catch(e){}
  g_form.setValue('technical_application_description',r&&r.ok?(r.application.description||'Descrição não cadastrada para esta aplicação.'):'');
  g_form.hideFieldMsg('technical_application',true);
  if(!r||!r.ok){g_form.showFieldMsg('technical_application',r&&r.message?r.message:'Não foi possível consultar a aplicação.','error',false);}
 });
}