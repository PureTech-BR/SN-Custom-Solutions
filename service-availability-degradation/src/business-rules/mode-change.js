(function executeRule(current,previous){
    var previousMode=previous.getValue('value')==='true';
    var requestedMode=current.getValue('value')==='true';
    if(previousMode===requestedMode) return;
    gs.eventQueue('aoop.degradation.mode_changed',current,
        String(previousMode),String(requestedMode));
})(current,previous);

