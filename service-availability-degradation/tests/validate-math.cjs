'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
function walk(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const scripts = walk(path.join(root,'src')).filter(f=>f.endsWith('.js'));
for (const file of scripts) {
  const checked=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  assert.equal(checked.status,0,checked.stderr);
}
const context = {Class:{create:()=>function(){this.initialize();}}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'src/AOOP_ServiceAvailabilityDegradation.js'),'utf8'),context);
const engine = new context.AOOP_ServiceAvailabilityDegradation();
const H=3600000;
const r=engine.measure([
 {type:'degradation',begin:10*H,end:12*H},
 {type:'degradation',begin:11*H,end:13*H},
 {type:'planned',begin:11.5*H,end:12*H}
],0,24*H,null);
assert.equal(r.duration,2.5*H);assert.equal(r.count,2);
assert.equal(engine.measure([{type:'degradation',begin:0,end:H}],0,24*H,null).percent,100/24);
assert.equal(engine.measure([{type:'degradation',begin:0,end:3*H}],0,168*H,null).percent,300/168);
const covered=engine.measure([{type:'degradation',begin:0,end:H},{type:'planned',begin:-H,end:2*H}],0,24*H,null);
assert.equal(covered.duration,0);assert.equal(covered.count,0);assert.equal(covered.eligible,1);
assert.equal(engine.measure([],0,24*H,null).eligible,0);
assert.equal(engine.measure([],0,0,null).percent,null);
let seed=1337;
function random(n){seed=(1664525*seed+1013904223)>>>0;return seed%n;}
for(let test=0;test<100;test++){
 const rows=[];
 for(let i=0;i<30;i++){const begin=random(140)-20;rows.push({type:random(3)?'degradation':'planned',begin,end:begin+1+random(30)});}
 const result=engine.measure(rows,0,100,null);
 const slots=Array.from({length:100},(_,i)=>rows.some(r=>r.type==='degradation'&&r.begin<=i&&r.end>=i+1)&&!rows.some(r=>r.type==='planned'&&r.begin<=i&&r.end>=i+1));
 const expectedDuration=slots.filter(Boolean).length;
 const expectedCount=slots.reduce((sum,on,i)=>sum+(on&&(i===0||!slots[i-1])?1:0),0);
 assert.equal(result.duration,expectedDuration,'duration test '+test);
 assert.equal(result.count,expectedCount,'period count test '+test);
}
console.log(JSON.stringify({syntax_files:scripts.length,math_cases:106,randomized_cases:100,status:'passed'}));

