#!/usr/bin/env python3
"""Validate the transported snapshot without contacting ServiceNow."""
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "components.json").read_text())
fields = json.loads((ROOT / "fields.json").read_text())
xml_path = ROOT / "service-availability-degradation-v1.0.0.xml"
tree = ET.parse(xml_path).getroot()
assert tree.tag == "unload"
remote = tree.findall("sys_remote_update_set")
updates = tree.findall("sys_update_xml")
assert len(remote) == 1
assert len(updates) == 29
assert remote[0].findtext("remote_sys_id") == manifest["update_set"]["update_set_id"]
assert remote[0].findtext("state") == "loaded"
expected = {c["update_name"]: c for c in manifest["components"]}
assert len(expected) == 29
assert {u.findtext("name") for u in updates} == set(expected)
assert all(u.attrib.get("action") == "INSERT_OR_UPDATE" for u in updates)
allowed = {"sys_script_include", "sys_script", "sysevent_register",
           "sysevent_script_action", "sysauto_script", "sys_script_fix",
           "sys_properties", "sys_dictionary", "sys_documentation"}
payloads = {}
def normalized(s):
    return (s or "").replace("\r\n", "\n").strip()
for update in updates:
    name = update.findtext("name")
    component = expected[name]
    assert update.findtext("remote_update_set") == remote[0].findtext("sys_id"), name
    payload = ET.fromstring(update.findtext("payload"))
    assert payload.tag == "record_update", name
    # Dictionary and documentation updates use the native attribute-less wrapper.
    if component["table"] in {"sys_dictionary", "sys_documentation"}:
        assert payload.attrib.get("table") in (None, component["table"]), name
    else:
        assert payload.attrib.get("table") == component["table"], name
    assert component["table"] in allowed, name
    assert all(child.tag in allowed | {"sys_translated_text"} for child in payload), name
    record = payload.find(component["table"])
    assert record is not None, name
    if record.find(component["table"]) is not None:
        record = record.find(component["table"])
    payloads[name] = record
    if component.get("source_path"):
        source = ROOT / component["source_path"]
        assert normalized(source.read_text()) == normalized(record.findtext("script")), name
        assert "u_degradation_revision" not in source.read_text(), name
    if component["table"] == "sys_script":
        for meta, tag in (("collection","collection"),("when","when"),("condition","condition")):
            assert normalized(record.findtext(tag)) == normalized(component[meta]), name
        assert len(record.findtext("condition") or "") <= 254, name
    if component["table"] in ("sys_dictionary", "sys_documentation"):
        assert record.findtext("name") == "service_availability", name
        assert record.findtext("element") in {f["name"] for f in fields}, name
assert {f["name"]:f["type"] for f in fields} == {
    "u_total_degradation":"glide_duration", "u_absolute_degradation":"decimal",
    "u_absolute_degradation_count":"integer", "u_degradation_calculated":"boolean"}
assert len([c for c in expected.values() if c["table"]=="sys_dictionary"]) == 4
assert len([c for c in expected.values() if c["table"]=="sys_documentation"]) == 7
for field in fields:
    node = payloads["sys_dictionary_service_availability_"+field["name"]]
    assert node.findtext("internal_type") == field["type"]
job = next(payloads[n] for n,c in expected.items() if c["table"]=="sysauto_script")
script = job.findtext("script")
assert "batches<500" in script and "started<600000" in script
assert job.findtext("run_type") == "daily"
assert job.findtext("time_zone") == "America/Sao_Paulo"
assert (job.findtext("entered_time") or "").endswith("06:00:00")
event_names = {payloads[n].findtext("event_name") for n,c in expected.items()
               if c["table"]=="sysevent_register"}
assert event_names == {"aoop.availability.degradation.invalidate","aoop.degradation.mode_changed"}
assert all(len(e) <= 40 for e in event_names)
for n,c in expected.items():
    if c["table"]=="sysevent_script_action":
        assert payloads[n].findtext("event_name") in event_names
props = {payloads[n].findtext("name"):payloads[n].findtext("value")
         for n,c in expected.items() if c["table"]=="sys_properties"}
assert props["aoop_service_availability_degradation_batch_size"] == "100"
assert props["aoop_service_availability_degradation_max_runtime_seconds"] == "30"
assert not props["aoop_service_availability_degradation_cursor"]
assert props["aoop_service_availability_degradation_usecommitment"] == "false"
engine = (ROOT/"src/AOOP_ServiceAvailabilityDegradation.js").read_text()
assert "w.addQuery('sys_mod_count',mod)" in engine
assert "invalidateCalculatedForModeChange" in engine
assert "gs.setProperty(this.P+'degradation_cursor','')" in engine
for f in ROOT.rglob("*.md"):
    import re
    for target in re.findall(r"\]\(([^)]+)\)", f.read_text()):
        if "://" not in target and not target.startswith("#"):
            path = (f.parent/target.split("#")[0]).resolve()
            assert path.exists(), (str(f), target)
print(json.dumps({"xml":"valid","customer_updates":len(updates),
                  "fields":len(fields),"labels":7,"sources_match":True,
                  "native_components_excluded":True,"links":"valid"},ensure_ascii=False))

