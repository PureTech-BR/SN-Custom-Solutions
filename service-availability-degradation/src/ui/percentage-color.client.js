function onLoad() {
 var calculated=g_form.getValue('u_degradation_calculated');
 if(calculated!=='true'&&calculated!=='1')return;
 var raw=g_form.getValue('u_absolute_degradation');
 if(raw===null||raw===undefined||String(raw).replace(/\s/g,'')==='')return;
 var n=Number(String(raw).replace(/\s/g,'').replace(',','.'));
 if(!isFinite(n)||n<0||n>100)return;
 var ajax=new GlideAjax('AOOP_DegradationColorConfig');
 ajax.addParam('sysparm_name','getRanges');
 ajax.getXMLAnswer(function(answer){
  var ranges;
  try{ranges=JSON.parse(answer);}catch(e){return;}
  if(!ranges||ranges.length!==4)return;
  for(var i=0;i<ranges.length;i++)if(n<=ranges[i].max){
   var range=(i===0?'0':'acima de '+ranges[i-1].max)+' até '+ranges[i].max+'%';
   g_form.addDecoration('u_absolute_degradation','icon-info','Degradação calculada: '+raw+'% | Faixa: '+range+' | '+ranges[i].color,'color-'+ranges[i].color);
   return;
  }
 });
}
