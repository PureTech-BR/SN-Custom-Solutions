// AOOP targeted administrative reprocessing. No full-table scan.
// Fill the CI/offering and UTC interval. First run with DRY_RUN=true.
// After a commitment/schedule/mode change, invalidate the relevant CI and interval.
(function(){
    var TARGET_CI = '';
    var BEGIN_UTC = '';
    var END_UTC = '';
    var DRY_RUN = true;
    if (!/^[0-9a-f]{32}$/.test(TARGET_CI) || !BEGIN_UTC || !END_UTC) {
        gs.print('[AOOP Degradation] Fill TARGET_CI, BEGIN_UTC and END_UTC. No changes made.');
        return;
    }
    if (new GlideDateTime(END_UTC).compareTo(new GlideDateTime(BEGIN_UTC))<=0)
        throw 'END_UTC must be after BEGIN_UTC';
    var engine=new AOOP_ServiceAvailabilityDegradation();
    if(!engine.enabled()) throw 'Degradation calculation is disabled';
    var a=engine._affected(TARGET_CI,BEGIN_UTC,END_UTC);
    a.query(); var count=0; while(a.next()) count++;
    gs.print('[AOOP Degradation] Targeted availability count='+count+' dry_run='+DRY_RUN);
    if(!DRY_RUN) {
        engine.invalidateScope(TARGET_CI,BEGIN_UTC,END_UTC);
        gs.print('[AOOP Degradation] Cleared and pending. Scheduled job will calculate only rows with eligible degradation.');
    }
})();

