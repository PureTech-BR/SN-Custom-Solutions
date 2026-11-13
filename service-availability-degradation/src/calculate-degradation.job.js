(function(){
    var started=new Date().getTime(), engine=new AOOP_ServiceAvailabilityDegradation();
    if(!engine.enabled()) return;
    var batches=0,calculated=0,errors=0,result;
    do {
        result=engine.run();
        batches++;calculated+=result.calculated||0;errors+=result.errors||0;
        if(errors || result.status==='disabled') break;
    } while(result.resume && batches<500 && new Date().getTime()-started<600000);
    gs.info('[AOOP Degradation Daily] '+JSON.stringify({
        batches:batches,calculated:calculated,errors:errors,
        elapsed_ms:new Date().getTime()-started,pending_cursor:result.resume||'',
        completed:!result.resume && !errors
    }));
})();

