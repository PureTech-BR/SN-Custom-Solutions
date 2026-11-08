function onLoad(){renderCharacteristics();}
function renderCharacteristics(){
 function yes(n){return /^(true|1|yes)$/i.test(g_form.getValue(n));}
 function field(n,v,m){g_form.setMandatory(n,false);g_form.setDisplay(n,v);g_form.setMandatory(n,v&&m);}
 field('affected_function',g_form.getValue('report_extent')==='partial',true);
 field('slow_action',g_form.getValue('report_symptom')==='slow',true);
 field('report_frequency',/^(slow|error)$/.test(g_form.getValue('report_symptom')),true);
 field('error_message',g_form.getValue('report_symptom')==='error',false);
 field('workaround_detail',g_form.getValue('report_continuity')==='workaround',false);
 field('report_started_at',!yes('started_unknown'),true);
 field('classification_note',g_form.getValue('report_extent')==='total'&&g_form.getValue('report_scope')==='all'&&g_form.getValue('report_continuity')==='normal',true);
}