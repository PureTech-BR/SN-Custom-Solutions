function renderIntake(checkOutages) {
    function yes(name) { return /^(true|1|yes)$/i.test(g_form.getValue(name)); }
    function field(name, visible, mandatory) {
        g_form.setMandatory(name, false);
        g_form.setDisplay(name, visible);
        g_form.setMandatory(name, visible && mandatory);
    }
    var serviceId = g_form.getValue('report_service');
    var offeringId = g_form.getValue('report_offering');
    var unknown = yes('offering_unknown');
    g_form.setMandatory('report_offering', false);
    g_form.setReadOnly('report_offering', !serviceId || unknown);
    g_form.setMandatory('report_offering', !!serviceId && !unknown);
    field('affected_function', g_form.getValue('report_extent') === 'partial', true);
    field('slow_action', g_form.getValue('report_symptom') === 'slow', true);
    field('report_frequency', /^(slow|error)$/.test(g_form.getValue('report_symptom')), true);
    field('error_message', g_form.getValue('report_symptom') === 'error', false);
    field('workaround_detail', g_form.getValue('report_continuity') === 'workaround', false);
    field('report_started_at', !yes('started_unknown'), true);
    field('classification_note', g_form.getValue('report_extent') === 'total' &&
        g_form.getValue('report_scope') === 'all' && g_form.getValue('report_continuity') === 'normal', true);
    if (!g_form.getValue('outage_status_data')) {
        g_form.setDisplay('outage_notice_service', false);
        g_form.setDisplay('outage_notice_offering', false);
    }
    if (!checkOutages) { return; }
    g_form.setValue('outage_status_data', '');
    g_form.setDisplay('outage_notice_service', false);
    g_form.setDisplay('outage_notice_offering', false);
    g_form.hideFieldMsg('report_service', true);
    g_form.hideFieldMsg('report_offering', true);
    if (!serviceId) { return; }
    // Sem oferta selecionada ainda, consulta somente o servico pai.
    var queryUnknown = unknown || !offeringId;
    var target = offeringId && !unknown ? 'report_offering' : 'report_service';
    g_form.showFieldMsg(target, 'Consultando ocorrências em curso...', 'info', false);
    var ga = new GlideAjax('LabIncidentIntakeAjax');
    ga.addParam('sysparm_name', 'getStatus');
    ga.addParam('sysparm_service', serviceId);
    ga.addParam('sysparm_offering', offeringId);
    ga.addParam('sysparm_unknown', queryUnknown ? 'true' : 'false');
    ga.getXMLAnswer(function (answer) {
        if (g_form.getValue('report_service') !== serviceId || g_form.getValue('report_offering') !== offeringId || yes('offering_unknown') !== unknown) { return; }
        g_form.hideFieldMsg(target, true);
        var result;
        try { result = JSON.parse(answer); } catch (e) { result = null; }
        if (!result || !result.ok) {
            g_form.showFieldMsg(target, 'Não foi possível consultar as ocorrências agora. A consulta será refeita no envio. ' +
                (result && result.message ? result.message : ''), 'info', false);
            return;
        }
        if (result.count) {
            g_form.setValue('outage_status_data', JSON.stringify(result));
            g_form.setDisplay(target === 'report_offering' ? 'outage_notice_offering' : 'outage_notice_service', true);
        } else {
            g_form.showFieldMsg(target, result.message, 'info', false);
        }
    });
}

function loadIntakeOptions(name, method, serviceId) {
    var previous = g_form.getValue(name);
    g_form.clearOptions(name);
    g_form.addOption(name, '', 'Carregando...');
    var ga = new GlideAjax('LabIncidentIntakeAjax');
    ga.addParam('sysparm_name', method);
    if (serviceId) { ga.addParam('sysparm_service', serviceId); }
    ga.getXMLAnswer(function (answer) {
        if (name === 'report_offering' && g_form.getValue('report_service') !== serviceId) { return; }
        var result;
        try { result = JSON.parse(answer); } catch (e) { result = null; }
        g_form.clearOptions(name);
        g_form.addOption(name, '', '-- Selecione --');
        if (!result || !result.ok) {
            g_form.showFieldMsg(name, 'Não foi possível carregar as opções. Recarregue o formulário para tentar novamente.', 'error', false);
            return;
        }
        var validPrevious = false;
        for (var i = 0; i < result.options.length; i++) {
            g_form.addOption(name, result.options[i].value, result.options[i].label);
            if (result.options[i].value === previous) { validPrevious = true; }
        }
        if (validPrevious) { g_form.setValue(name, previous); }
        if (name === 'report_service' && g_form.getValue('report_service')) {
            loadIntakeOptions('report_offering', 'getOfferings', g_form.getValue('report_service'));
        }
        if (name === 'report_offering' && !result.options.length) {
            g_form.showFieldMsg(name, 'Não há ofertas operacionais cadastradas para este serviço. Marque Não sei identificar a oferta para continuar.', 'info', false);
        }
        renderIntake(true);
    });
}
