function onLoad() {
    if (g_form.isNewRecord()) { return; }
    var fields = ['report_service','offering_unknown','report_offering','report_symptom',
        'report_extent','affected_function','slow_action','report_frequency','error_message',
        'report_scope','report_continuity','workaround_detail','classification_note',
        'started_unknown','report_started_at','intake_description'];
    function key(name) { return 'variables.' + name; }
    // Nao modifica outros produtores que nao possuem estas variaveis.
    if (!g_form.getValue(key('report_service'))) { return; }
    function lock() {
        for (var i = 0; i < fields.length; i++) {
            g_form.setMandatory(key(fields[i]), false);
            g_form.setReadOnly(key(fields[i]), true);
        }
    }
    // Bloqueia desde o carregamento, inclusive se a resolucao dos nomes falhar.
    lock();
    var ga = new GlideAjax('LabIncidentIntakeAjax');
    ga.addParam('sysparm_name', 'getRecordVariableLabels');
    ga.addParam('sysparm_incident', g_form.getUniqueValue());
    ga.getXMLAnswer(function (answer) {
        var result;
        try { result = JSON.parse(answer); } catch (e) { return; }
        if (!result || !result.ok || !result.matched) { return; }
        var names = ['report_service','report_offering'];
        for (var i = 0; i < names.length; i++) {
            var name = names[i], item = result.labels[name];
            if (!item || g_form.getValue(key(name)) !== item.value) { continue; }
            // Altera a apresentacao da opcao; preserva a resposta sys_id salva.
            g_form.setReadOnly(key(name), false);
            g_form.clearOptions(key(name));
            g_form.addOption(key(name), item.value, item.label);
            g_form.setValue(key(name), item.value);
        }
        function show(name, condition) {
            // Preserva visiveis respostas historicas preenchidas.
            g_form.setDisplay(key(name), condition || !!g_form.getValue(key(name)));
        }
        function value(name) { return g_form.getValue(key(name)); }
        var symptom = value('report_symptom'), extent = value('report_extent');
        var continuity = value('report_continuity');
        show('affected_function', extent === 'partial');
        show('slow_action', symptom === 'slow');
        show('report_frequency', symptom === 'slow' || symptom === 'error');
        show('error_message', symptom === 'error');
        show('workaround_detail', continuity === 'workaround');
        show('classification_note', extent === 'total' && value('report_scope') === 'all' && continuity === 'normal');
        show('report_started_at', !/^(true|1|yes)$/i.test(value('started_unknown')));
        var technical = ['outage_status_data','outage_notice_service','outage_notice_offering'];
        for (var j = 0; j < technical.length; j++) {
            g_form.setDisplay(key(technical[j]), false);
        }
        lock();
    });
}
