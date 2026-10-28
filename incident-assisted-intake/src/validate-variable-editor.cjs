const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const incidentId='a'.repeat(32),serviceId='b'.repeat(32),offeringId='c'.repeat(32);
function server({allowed=true,guest=false,ciReadable=true,matched=true}={}){
 const queries=[];
 const ctx={Class:{create:()=>function(){}},AbstractAjaxProcessor:function(){},gs:{getUserName:()=>guest?'guest':'analyst'}};
 class GR {
  constructor(table){this.table=table;this.q=[];this.index=-1;queries.push(this);}
  addQuery(...a){this.q.push(a);}
  query(){this.rows=this.table==='item_option_new'?[{sys_id:'q1',name:'report_service'},{sys_id:'q2',name:'report_offering'}]:matched?[{question:'q1',value:serviceId},{question:'q2',value:offeringId}]:[];}
  next(){return ++this.index<this.rows.length;}
  getUniqueValue(){return this.rows[this.index].sys_id;}
  getValue(n){return this.rows[this.index][n];}
 }
 class Secure {
  constructor(t){this.table=t;}
  get(id){this.id=id;return this.table==='incident'?allowed:true;}
  canRead(){return this.table==='incident'?allowed:ciReadable;}
  getElement(){return {canRead:()=>ciReadable};}
  getDisplayValue(){return this.table==='cmdb_ci_service'?'Serviço inativo legível':'Oferta legível';}
 }
 ctx.GlideRecord=GR;ctx.GlideRecordSecure=Secure;vm.createContext(ctx);
 vm.runInContext('Object.extendsObject=function(base,p){return p;};',ctx);
 vm.runInContext(fs.readFileSync(__dirname+'/LabIncidentIntakeAjax.js','utf8'),ctx);
 const ajax=new ctx.LabIncidentIntakeAjax();ajax.getParameter=()=>incidentId;
 return {result:JSON.parse(ajax.getRecordVariableLabels()),queries};
}
let r=server();assert.equal(r.result.labels.report_service.value,serviceId);assert.equal(r.result.labels.report_service.label,'Serviço inativo legível');
assert(r.queries.find(q=>q.table==='item_option_new').q.some(q=>q[0]==='cat_item'&&q[1]==='0745a07dc3c09310e079b13ed4013110'));
assert(r.queries.find(q=>q.table==='question_answer').q.some(q=>q[0]==='table_sys_id'&&q[1]===incidentId));
assert.equal(server({allowed:false}).queries.length,0);assert.equal(server({guest:true}).result.ok,false);
assert.equal(server({ciReadable:false}).result.labels.report_service.label,'Registro removido ou sem acesso');
assert.equal(server({matched:false}).result.matched,false);
function client({exists=true,isNew=false,answer}={}){
 const values=exists?{'variables.report_service':serviceId,'variables.report_offering':offeringId,'variables.report_symptom':'error','variables.report_extent':'total','variables.report_scope':'some','variables.report_continuity':'blocked','variables.started_unknown':'true'}:{};
 const readonly={},display={},options={},params={},changed=[];
 const ctx={g_form:{isNewRecord:()=>isNew,hasField:()=>exists,getValue:k=>values[k]||'',getUniqueValue:()=>incidentId,setMandatory(){},setReadOnly:(k,v)=>readonly[k]=v,setDisplay:(k,v)=>display[k]=v,clearOptions:k=>options[k]=[],addOption:(k,v,l)=>options[k].push({value:v,label:l}),setValue:(k,v)=>{values[k]=v;changed.push(k);}},GlideAjax:function(){this.addParam=(k,v)=>params[k]=v;this.getXMLAnswer=cb=>cb(answer===undefined?JSON.stringify(r.result):answer);}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/incident-variables.client.js','utf8'),ctx);ctx.onLoad();
 return {readonly,display,options,values,params,changed};
}
let c=client();assert.equal(c.options['variables.report_service'][0].label,'Serviço inativo legível');assert.equal(c.values['variables.report_service'],serviceId);
assert.equal(Object.keys(c.readonly).length,16);assert(Object.values(c.readonly).every(Boolean));
assert.equal(c.display['variables.slow_action'],false);assert.equal(c.display['variables.report_frequency'],true);assert.equal(c.display['variables.outage_status_data'],false);
assert.equal(c.params.sysparm_incident,incidentId);assert.equal(Object.keys(client({exists:false}).params).length,0);assert.equal(Object.keys(client({isNew:true}).params).length,0);
assert.equal(Object.keys(client({answer:'invalid-json'}).readonly).length,16);
assert(c.changed.every(k=>k==='variables.report_service'||k==='variables.report_offering'));
console.log('PASS: record ACL, guest, producer scope, inaccessible CI fallback, historic labels, preserved IDs, read-only, conditional fields and unaffected new/unrelated forms.');
