from pathlib import Path
from collections import Counter
import json, re, xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'components.json').read_text())
xml=ET.parse(root/'service-availability-degradation-events-v2.1.0.xml').getroot()
remote=xml.findall('sys_remote_update_set');assert len(remote)==1
rid=remote[0].findtext('sys_id');assert rid==manifest['update_set']['remote_id']
records=xml.findall('sys_update_xml');assert len(records)==44
names=[x.findtext('name') for x in records];assert len(set(names))==44
byname={}
for rec in records:
 assert rec.findtext('remote_update_set')==rid
 payload=ET.fromstring(rec.findtext('payload'));assert payload.tag=='record_update'
 assert len(payload)>=1
 for auxiliary in list(payload)[1:]:
  assert auxiliary.tag=='sys_translated_text' and auxiliary.get('action')=='delete_multiple'
  assert auxiliary.get('query')=='documentkey='+list(payload)[0].findtext('sys_id')
 node=list(payload)[0];byname[rec.findtext('name')]=node
 assert node.get('action')=='INSERT_OR_UPDATE' or (node.tag=='sys_documentation' and node.get('table')=='service_availability')
 assert rec.findtext('update_set') in [None,'']
for component in manifest['components']:
 node=byname[component['update_name']]
 assert node.tag==component['table']
 assert node.findtext('sys_id')==component['id']
 if 'source_path' in component:
  assert (root/component['source_path']).read_text().rstrip('\r\n')==(node.findtext('script') or '').rstrip('\r\n')
counts=Counter(n.tag for n in byname.values())
assert counts['sys_dictionary']==3 and counts['sys_documentation']==6 and counts['sys_properties']==3
assert {n.findtext('element') for n in byname.values() if n.tag=='sys_dictionary'}=={'u_total_degradation','u_absolute_degradation','u_absolute_degradation_count'}
assert counts['sys_script']==11 and sum(n.findtext('active')=='true' for n in byname.values() if n.tag=='sys_script')==3
assert counts['sysevent_script_action']==4 and sum(n.findtext('active')=='true' for n in byname.values() if n.tag=='sysevent_script_action')==2
assert counts['sys_ui_style']==8
assert sum(n.findtext('value')=='javascript:false' for n in byname.values() if n.tag=='sys_ui_style')==4
assert all(n.findtext('active')=='false' for n in byname.values() if n.tag=='sysauto_script')
assert 'sys_script_80608f120a0a0b8c0107903fd79fa12f' not in byname
assert 'sysevent_script_action_b70abba94fc1421028d79e4628c714d2' not in byname
for p in (root/'src').rglob('*.js'):
 assert 'u_degradation_calculated' not in p.read_text()
for path in root.rglob('*.md'):
 text=path.read_text()
 for label,target in re.findall(r'\[([^\]]+)\]\(([^)]+)\)',text):
  if target.startswith(('https://','http://','#')) or target.startswith('../service-availability-degradation'):continue
  dest=(path.parent/target.split('#')[0]).resolve();assert dest.exists(),f'Broken link {path}: {target}'
print(json.dumps({'updates':44,'unique':True,'fields':3,'properties':3,'active_brs':3,'source_match':True,'legacy_job_inactive':True,'ootb_payloads':0,'local_links':'passed'}))
