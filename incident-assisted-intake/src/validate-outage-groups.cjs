const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const id=n=>n.toString(16).padStart(32,'0'), now='2026-10-27 15:00:00';
const offer=id(1),app=id(2),other=id(3),infra=id(4),reverse=id(5),indirect=id(6),secondApp=id(7);
const db={cmdb_rel_ci:[
 {parent:offer,child:app,'type.name':'Depends on::Used by'},
 {parent:offer,child:app,'type.name':'Depends on::Used by'},
 {parent:offer,child:infra,'type.name':'Depends on::Used by'},
 {parent:reverse,child:offer,'type.name':'Depends on::Used by'},
 {parent:offer,child:other,'type.name':'Contains::Contained by'},
 {parent:app,child:indirect,'type.name':'Depends on::Used by'},
 {parent:offer,child:secondApp,'type.name':'Depends on::Used by'}],
 cmdb_ci_service_auto:[{sys_id:app,name:'OpenLDAP'},{sys_id:secondApp,name:'Outra aplicação'},{sys_id:other},{sys_id:reverse},{sys_id:indirect}],
 cmdb_ci_outage:[],task_outage:[],incident:[]};
function outage(n,ci,type='outage',begin='2026-10-27 12:00:00',end=''){
 return{sys_id:id(n),number:'OUT'+n,cmdb_ci:ci,type,begin,end};
}
db.cmdb_ci_outage=[outage(15,secondApp,'outage','2026-10-27 13:00:00'),outage(11,app,'degradation'),outage(10,app),outage(12,app,'outage',now,'2026-10-27 14:00:00'),outage(13,app,'outage','2026-10-28 12:00:00'),outage(14,app,'planned'),... [other,infra,reverse,indirect].map((ci,i)=>outage(20+i,ci))];
class Record{
 constructor(table){this.table=table;this.conditions=[];}
 addQuery(field,op,value){if(arguments.length===2){value=op;op='=';} const group=[[field,op,value]];this.conditions.push(group);return{addOrCondition:(f,o,v)=>{if(v===undefined){v=o;o='=';}group.push([f,o,v]);}};}
 query(){this.rows=(db[this.table]||[]).filter(r=>this.conditions.every(g=>g.some(([f,o,v])=>o==='IN'?String(v).split(',').includes(r[f]):o==='<='?r[f]<=v:o==='>='?r[f]>=v:(r[f]||'')===v)));this.rows.sort((a,b)=>{for(const f of this.order||[]){if(a[f]<b[f])return -1;if(a[f]>b[f])return 1;}return 0;});this.index=0;}
 next(){this.row=this.rows[this.index++];if(!this.row)return false;this.begin={getDisplayValue:()=>this.row.begin};return true;}
 get(i){this.row=(db[this.table]||[]).find(r=>r.sys_id===i);return !!this.row;}
 getUniqueValue(){return this.row.sys_id;} getValue(f){return this.row[f]||'';}
 getDisplayValue(){return this.row.name||'';} isValidField(){return true;} orderBy(f){(this.order||=[]).push(f);} setWorkflow(){}
}
const c={Class:{create:()=>function(){}},GlideRecord:Record,GlideRecordSecure:class extends Record{get(){return false;}},GlideDateTime:class{getValue(){return now;}getDisplayValue(){return now;}},gs:{getSession:()=>({getTimeZoneName:()=> 'UTC'}),getUserID:()=>id(99)}};
vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/LabIncidentIntakeService.js','utf8'),c);
const s=new c.LabIncidentIntakeService(),selection={serviceId:id(9),service:'Serviço de Acessos',offeringId:offer,offering:'Consultas de Identidade'};
assert.deepEqual(Array.from(s.findApplicationOutages(selection),o=>o.number),['OUT10','OUT11','OUT15']);
assert.equal(s.findApplicationOutages({...selection,offeringId:''}).length,0);
// Preserve distinct service outages, but move an overlapping app outage to its specific layer.
s.findOutages=()=>[{...s.findApplicationOutages(selection)[0],layer:undefined,origin:'CI afetado relacionado'},
 {id:id(40),number:'OUT40',ci:selection.service,origin:'Serviço pai',type:'outage',begin:now}];
s.getSelection=()=>selection;
let summary=s._outageGroups(selection);assert.equal(summary.count,4);assert.equal(summary.groups.length,2);
assert.equal(summary.groups[0].count,1);assert.equal(summary.groups[1].count,3);
assert.equal(summary.groups[0].items[0].outage,'OUT40');
assert(!summary.groups[0].publicLines.join('\n').includes('OUT10'));
assert(summary.groups[1].publicLines.join('\n').includes('Oferta relacionada: Consultas de Identidade'));
// Restricted associated incident details must remain in technical work notes only.
db.incident=[{sys_id:id(30),number:'INC_PRIVATE',short_description:'SECRET'}];db.cmdb_ci_outage[0].task_number=id(30);
const status=s.getStatus('','','');const serialized=JSON.stringify(status);
assert(!serialized.includes('SECRET'));assert(!serialized.includes('INC_PRIVATE'));assert(!serialized.includes(id(30)));assert(!serialized.includes('internalLines'));
assert(serialized.includes('INC com acesso restrito'));
const values={},current={setValue:(k,v)=>values[k]=v};
s.apply({report_symptom:'no_access',report_extent:'total',report_scope:'all',report_continuity:'blocked',intake_description:'Não consigo autenticar',started_unknown:'true',outage_status_data:'forged payload'},current);
assert(values.description.includes('[1] Serviços de Negócio e Ofertas'));assert(values.description.includes('[2] Aplicações relacionadas à oferta'));
assert.equal(values.description.split('- OUT10 |').length-1,1);
assert(!values.description.includes('Um mesmo OUT'));assert(!values.description.includes('pode constar em ambos'));
assert(!values.description.includes('SECRET'));assert(!values.description.includes('forged payload'));assert(current.work_notes.includes('SECRET'));
assert.equal(values.impact,'1');assert.equal(values.urgency,'1');assert.equal(values.parent_incident,'');
assert.equal(values.cmdb_ci,app);assert(values.description.includes('OUT15'));assert(current.work_notes.includes('primeiro outage de aplicacao=OUT10'));
assert(!serialized.includes('firstApplicationOutage'));assert(!serialized.includes('applicationId'));
s.findOutages=()=>[];s.getSelection=()=>({...selection,offeringId:''});
delete values.cmdb_ci;
s.apply({report_symptom:'no_access',report_extent:'total',report_scope:'self',report_continuity:'blocked',intake_description:'Falha',started_unknown:'true'},current);
assert(values.description.includes('Não consultado: oferta de serviço não informada.'));
assert.equal(values.cmdb_ci,undefined);
// With a selected offering but only business outages, no application CI is assigned.
s.getSelection=()=>selection;s.findApplicationOutages=()=>[];
s.findOutages=()=>[{id:id(40),number:'OUT40',ci:selection.service,origin:'Serviço pai',type:'outage',begin:now}];
s.apply({report_symptom:'no_access',report_extent:'total',report_scope:'self',report_continuity:'blocked',intake_description:'Falha',started_unknown:'true'},current);
assert.equal(values.cmdb_ci,undefined);
console.log('PASS: direct relation/direction/type, subclasses, duplicate relations, unrelated/infrastructure/indirect exclusion, active time/type, two blocks, deduplicated total, restricted incident privacy, fresh submit query, unchanged classification and no offering.');
