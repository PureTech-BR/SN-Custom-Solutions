const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const context={Class:{create:()=>function(){}},global:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname+'/LabIncidentIntakeService.js','utf8'),context);
const service=new context.LabIncidentIntakeService();
let count=0;
for(const extent of ['total','partial','unknown']) for(const scope of ['self','some','team','all','unknown'])
for(const continuity of ['blocked','workaround','normal','unknown']) {
  const r=service.classify(extent,scope,continuity);
  assert.equal(r.impact,scope==='self'?'3':extent==='total'&&scope==='all'?'1':'2');
  assert.equal(r.urgency,continuity==='blocked'?'1':continuity==='normal'?'3':'2'); count++;
}
const dictionaries=service.dictionaries();
assert.throws(()=>service._choice('malicious',dictionaries.scope,'Abrangência'));
assert.equal(service._id('x^ORsys_idISNOTEMPTY'),false);
assert.equal(service._yes('false'),false);
assert.equal(service._yes('true'),true);
let queries=[];
context.GlideRecordSecure=class {
 constructor(table){this.table=table;this.q=[];queries.push(this);}
 addQuery(...args){this.q.push(args);return{addOrCondition:(...more)=>this.q.push(['OR',...more])};}
 orderBy(){}
 query(){}
 next(){return false;}
};
context.GlideRecord=context.GlideRecordSecure;
context.GlideDateTime=class {getValue(){return '2026-10-20 12:00:00';}};
service.findOutages({serviceId:'S',offeringId:'O'});
assert(queries.find(q=>q.table==='cmdb_outage_ci_mtom').q.some(q=>q[0]==='ci_item'&&q[2]==='S,O'));
const oq=queries.find(q=>q.table==='cmdb_ci_outage').q;
assert(oq.some(q=>q[0]==='cmdb_ci'&&q[2]==='S,O'));
assert(oq.some(q=>q[0]==='begin'&&q[1]==='<='));
assert(oq.some(q=>q[0]==='end'&&q[1]==='>='));
assert(oq.some(q=>q[0]==='OR'&&q[1]==='end'&&q[2]===''));
assert(oq.some(q=>q[0]==='type'&&q[2]==='outage,degradation'));
queries=[];
service.findOutages({serviceId:'S',offeringId:''});
assert(queries.find(q=>q.table==='cmdb_ci_outage').q.some(q=>q[0]==='cmdb_ci'&&q[2]==='S'));
for(const file of ['LabIncidentIntakeService.js','LabIncidentIntakeAjax.js','producer.js','client-common.js']) {
 new vm.Script(fs.readFileSync(__dirname+'/'+file,'utf8'),{filename:file});
}
console.log(`PASS: ${count} classification cases, invalid choices and IDs, direct/parent/affected queries, time window, syntax.`);
