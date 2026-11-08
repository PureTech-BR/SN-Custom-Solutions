import pathlib,json,xml.etree.ElementTree as E,hashlib,collections
root=pathlib.Path(__file__).resolve().parents[1]
p=json.loads((root/'package.json').read_text());m=json.loads((root/'components.json').read_text());v=json.loads((root/'variables.json').read_text())
x=E.parse(next(root.glob('*.xml'))).getroot();updates=x.findall('sys_update_xml');remote=x.find('sys_remote_update_set');rid=remote.findtext('sys_id')
assert len(updates)==m['count']==p['componentCount']==157
assert len({u.findtext('name') for u in updates})==157
assert remote.findtext('remote_sys_id')==p['updateSet']['sys_id'] and remote.findtext('state')=='loaded'
byname={u.findtext('name'):u for u in updates};records=[]
for c in m['components']:
 u=byname[c['update_name']];payload=u.findtext('payload');assert hashlib.sha256(payload.encode()).hexdigest()==c['payload_sha256']
 assert u.findtext('remote_update_set')==rid and not u.findtext('update_set')
 r=E.fromstring(payload)[0];assert r.tag==c['table'];records.append((r.tag,{z.tag:z.text or '' for z in r}))
 assert r.tag not in ('incident','cmdb_ci_service_auto','cmdb_ci_service','service_offering','cmdb_ci_outage','task_ci','task_outage','u_lab_si_outage_guard')
assert collections.Counter(t for t,d in records)==m['counts_by_table']
prods=[d for t,d in records if t=='sc_cat_item_producer'];assert {d['sys_id'] for d in prods}=={p['producers']['technical'],p['producers']['business']}
assert all(p['producers']['legacyUnmodified']!=d.get('sys_id') for t,d in records)
sets={d['sys_id']:d for d in v['sets']};assert len(sets)==7
assert len(v['variables'])==37
local=[d for d in v['variables'] if not d['variable_set']]
assert len(local)==2 and {d['name'] for d in local}=={'outage_status_data','outage_notice_service'} and all(d['cat_item']==p['producers']['technical'] for d in local)
assert all(d['variable_set'] in sets for d in v['variables'] if d['variable_set'])
assert len(v['choices'])==32 and all(d['question'] in {q['sys_id'] for q in v['variables']} for d in v['choices'])
bindings=v['bindings'];assert len(bindings)==9
shared=[sid for sid in sets if len({b['sc_cat_item'] for b in bindings if b['variable_set']==sid})==2];assert len(shared)==2
assert sum(d['variable_set'] in shared for d in v['variables'])==13
hint=next(d for d in v['variables'] if d['name']=='technical_outage_hint');assert hint['type']=='32' and 'Altere para o horário' in hint['rich_text']
print('PASS: 157 native payloads and hashes, two producers, seven sets/two shared, 13 shared variables, bindings, choices, hint and no business/runtime data.')

criteria=[d for t,d in records if t=='user_criteria'];links=[d for t,d in records if t=='sc_cat_item_user_criteria_mtom']
assert len(criteria)==len(links)==1 and criteria[0]['active']=='true' and criteria[0]['role']=='282bf1fac6112285017366cb5f867469'
assert links[0]['sc_cat_item']==p['producers']['technical'] and links[0]['user_criteria']==criteria[0]['sys_id']
print('PASS: technical Available for uses native ITIL criterion; business remains unrestricted by this binding.')
