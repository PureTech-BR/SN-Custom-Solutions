var AOOP_ServiceAvailabilityDegradation = Class.create();
AOOP_ServiceAvailabilityDegradation.prototype = {
    initialize: function() {
        this.P = 'aoop_service_availability_';
        this.logPrefix = '[AOOP Degradation] ';
    },
    enabled: function() {
        return gs.getProperty(this.P + 'calculate_degradation', 'false') === 'true';
    },
    _date: function(value) { return new GlideDateTime(String(value)); },
    _ms: function(value) { return Number(this._date(value).getNumericValue()); },
    _value: function(ms) { var d = new GlideDateTime(); d.setNumericValue(ms); return d.getValue(); },
    _duration: function(ms) { var d = new GlideDuration(); d.setNumericValue(ms); return d.getValue(); },
    _limit: function(name, fallback, max) {
        var n = parseInt(gs.getProperty(this.P + name, String(fallback)), 10);
        return isNaN(n) || n < 1 ? fallback : Math.min(n, max);
    },
    _ids: function(a) {
        var result = [], seen = {};
        for (var i=0; i<a.length; i++) if (a[i] && !seen[String(a[i])]) {
            seen[String(a[i])] = true; result.push(String(a[i]));
        }
        return result;
    },
    clearFields: function(gr) {
        gr.setValue('u_degradation_calculated', false);
        gr.setValue('u_total_degradation', '');
        gr.setValue('u_absolute_degradation', '');
        gr.setValue('u_absolute_degradation_count', '');
    },
    _cis: function(outage) {
        var ids = [outage.getValue('cmdb_ci')];
        var m = new GlideRecord('cmdb_outage_ci_mtom');
        m.addQuery('outage', outage.getUniqueValue()); m.query();
        while (m.next()) ids.push(m.getValue('ci_item'));
        return this._ids(ids);
    },
    _queue: function(record, ci, begin, end) {
        if (!ci || !begin || !end || this._ms(end) <= this._ms(begin)) return;
        // Anchor events to a persistent configuration record: deleted source rows cannot be loaded by the event processor.
        if (!this.eventAnchor) {
            this.eventAnchor = new GlideRecord('sys_properties');
            if (!this.eventAnchor.get('name', this.P + 'calculate_degradation')) throw 'Missing degradation enable property';
        }
        gs.eventQueue('aoop.availability.degradation.invalidate', this.eventAnchor, String(ci),
            JSON.stringify({begin:String(begin),end:String(end)}));
    },
    captureOutage: function(current, previous) {
        if (!this.enabled()) return;
        var states = [current];
        if (previous) states.push(previous);
        for (var i=0; i<states.length; i++) {
            var o = states[i], t = o.getValue('type');
            if (t !== 'degradation' && t !== 'planned') continue;
            var cis = this._cis(o);
            for (var j=0; j<cis.length; j++)
                this._queue(current, cis[j], o.getValue('begin'), o.getValue('end'));
        }
    },
    captureLink: function(current, previous) {
        if (!this.enabled()) return;
        var states = [current];
        if (previous) states.push(previous);
        for (var i=0; i<states.length; i++) {
            var link = states[i], o = new GlideRecord('cmdb_ci_outage');
            if (!o.get(link.getValue('outage'))) continue;
            if (o.getValue('type') !== 'degradation' && o.getValue('type') !== 'planned') continue;
            this._queue(current, link.getValue('ci_item'), o.getValue('begin'), o.getValue('end'));
        }
    },
    _affected: function(ci, begin, end) {
        var a = new GlideRecord('service_availability');
        a.addQuery('service_offering', ci).addOrCondition('cmdb_ci', ci);
        a.addQuery('start', '<', end); a.addQuery('end', '>', begin);
        return a;
    },
    invalidateScope: function(ci, begin, end) {
        if (!this.enabled() || !ci || !begin || !end) return;
        var a = this._affected(ci, begin, end);
        // Clear supplemental results and mark the affected rows pending.
        this.clearFields(a);
        a.setWorkflow(false);
        a.updateMultiple();
    },
    handleEvent: function(ci, payload) {
        if (!this.enabled()) return;
        var p = JSON.parse(String(payload));
        this.invalidateScope(String(ci), p.begin, p.end);
    },
    _outages: function(cis, begin, end) {
        var found = {}, rows = [], self = this;
        function collect(gr) {
            gr.addQuery('type', 'IN', 'degradation,planned');
            gr.addNotNullQuery('begin'); gr.addNotNullQuery('end');
            gr.addQuery('begin', '<', end); gr.addQuery('end', '>', begin);
            gr.query();
            while (gr.next()) {
                var id = gr.getUniqueValue();
                if (found[id]) continue;
                found[id] = true;
                rows.push({id:id, begin:self._ms(gr.getValue('begin')),
                    end:self._ms(gr.getValue('end')), type:gr.getValue('type')});
            }
        }
        var direct = new GlideRecord('cmdb_ci_outage');
        direct.addQuery('cmdb_ci', 'IN', cis.join(',')); collect(direct);
        var related = new GlideRecord('cmdb_ci_outage');
        related.addJoinQuery('cmdb_outage_ci_mtom', 'sys_id', 'outage')
            .addCondition('ci_item', 'IN', cis.join(','));
        collect(related);
        return rows;
    },
    _union: function(spans) {
        spans.sort(function(a,b){ return a.begin-b.begin || a.end-b.end; });
        var result = [];
        for (var i=0; i<spans.length; i++) {
            var s = spans[i], last = result.length ? result[result.length-1] : null;
            if (last && s.begin <= last.end) last.end = Math.max(last.end,s.end);
            else result.push({begin:s.begin,end:s.end});
        }
        return result;
    },
    intervals: function(rows, begin, end) {
        var degradation=[], planned=[], eligible=0;
        for (var i=0; i<rows.length; i++) {
            var r=rows[i], b=Math.max(begin,r.begin), e=Math.min(end,r.end);
            if (e <= b) continue;
            if (r.type === 'degradation') { degradation.push({begin:b,end:e}); eligible++; }
            else if (r.type === 'planned') planned.push({begin:b,end:e});
        }
        degradation=this._union(degradation); planned=this._union(planned);
        var result=[];
        for (var j=0; j<degradation.length; j++) {
            var cur=degradation[j].begin, stop=degradation[j].end;
            for (var k=0; k<planned.length && cur<stop; k++) {
                var p=planned[k];
                if (p.end<=cur) continue;
                if (p.begin>=stop) break;
                if (p.begin>cur) result.push({begin:cur,end:Math.min(stop,p.begin)});
                cur=Math.max(cur,p.end);
            }
            if (cur<stop) result.push({begin:cur,end:stop});
        }
        return {eligible:eligible,spans:result};
    },
    _loadSchedule: function(id, tz) {
        var s=new GlideSchedule(String(id));
        if (tz) s.setTimeZone(tz);
        if (!s.isValid()) throw 'Invalid commitment/maintenance schedule: '+id;
        return s;
    },
    _fullDay: function(tz) {
        var s=new GlideSchedule(), span=new GlideRecord('cmn_schedule_span');
        span.initialize();
        span.setValue('start_date_time','20100101T000000');
        span.setValue('end_date_time','20100102T000000');
        span.setValue('repeat_type','daily'); s.addTimeSpan(span);
        if (tz) s.setTimeZone(tz);
        return s;
    },
    _schedule: function(a,cis) {
        var c=new GlideRecord('service_commitment');
        if (!c.get(a.getValue('service_commitment'))) throw 'Missing service commitment';
        var tz=c.getValue('timezone') || a.getValue('time_zone') || 'UTC';
        var sid=c.getValue('schedule'), schedule=sid ? this._loadSchedule(sid,tz) : null;
        var m=new GlideRecord('service_offering_commitment');
        m.addQuery('service_offering','IN',cis.join(',')).addOrCondition('cmdb_ci','IN',cis.join(','));
        m.addQuery('service_commitment.type','maintenance_window');
        m.addNotNullQuery('service_commitment.schedule'); m.query();
        while (m.next()) {
            if (!schedule) schedule=this._fullDay(tz);
            schedule.addOtherSchedule0(this._loadSchedule(String(m.service_commitment.schedule),
                String(m.service_commitment.timezone) || tz), false);
        }
        return schedule;
    },
    _scheduledDuration: function(schedule,begin,end) {
        if (!schedule) return end-begin;
        return Number(schedule.duration(this._date(this._value(begin)),
            this._date(this._value(end))).getNumericValue());
    },
    measure: function(rows,begin,end,schedule) {
        var data=this.intervals(rows,begin,end), total=0,count=0;
        for (var i=0;i<data.spans.length;i++) {
            var n=this._scheduledDuration(schedule,data.spans[i].begin,data.spans[i].end);
            if (n>0) { total+=n; count++; }
        }
        var base=this._scheduledDuration(schedule,begin,end);
        return {eligible:data.eligible,duration:total,count:count,base:base,
            percent:base>0 ? 100*total/base : null};
    },
    calculate: function(id, preview) {
        if (!this.enabled()) return {status:'disabled'};
        var a=new GlideRecord('service_availability');
        if (!a.get(String(id))) return {status:'missing'};
        if (!preview && a.getValue('u_degradation_calculated') === '1') return {status:'already_calculated'};
        var mod=a.getValue('sys_mod_count');
        var cis=this._ids([a.getValue('service_offering'),a.getValue('cmdb_ci')]);
        if (!cis.length || !a.getValue('start') || !a.getValue('end')) return {status:'ineligible'};
        var begin=this._ms(a.getValue('start')), end=this._ms(a.getValue('end'));
        if (end<=begin) return {status:'ineligible'};
        var useSchedule=gs.getProperty(this.P+'degradation_usecommitment','false') === 'true';
        var rows=this._outages(cis,a.getValue('start'),a.getValue('end'));
        var schedule=useSchedule ? this._schedule(a,cis) : null;
        var result=this.measure(rows,begin,end,schedule);
        if (!result.eligible) return {status:'no_degradation'};
        result.id=String(id); result.mode=useSchedule ? 'commitment' : 'absolute';
        if (preview) { result.status='preview'; return result; }
        // Atomic conditional update guarded by the native update counter.
        var w=new GlideRecord('service_availability');
        w.addQuery('sys_id',String(id));
        w.addQuery('sys_mod_count',mod);
        w.addQuery('u_degradation_calculated',false);
        w.setValue('u_total_degradation',this._duration(result.duration));
        w.setValue('u_absolute_degradation',result.percent === null ? '' : result.percent.toFixed(8));
        w.setValue('u_absolute_degradation_count',result.count);
        w.setValue('u_degradation_calculated',true);
        w.setWorkflow(false); w.updateMultiple();
        var verify=new GlideRecord('service_availability');
        result.status=verify.get(String(id)) && verify.getValue('u_degradation_calculated') === '1'
            ? 'calculated' : 'changed_during_calculation';
        return result;
    },
    run: function(onlyCi) {
        if (!this.enabled()) return {status:'disabled'};
        var started=new Date().getTime(), max=this._limit('degradation_batch_size',50,1000);
        var seconds=this._limit('degradation_max_runtime_seconds',30,300);
        var count=0, errors=0, seen={}, candidates=0;
        var cursor=onlyCi ? '' : gs.getProperty(this.P+'degradation_cursor','');
        var last='', exhausted=true;
        var o=new GlideRecord('cmdb_ci_outage');
        o.addQuery('type','degradation'); o.addNotNullQuery('begin');o.addNotNullQuery('end');
        if (cursor) o.addQuery('sys_id','>=',cursor);
        o.orderBy('sys_id'); o.query();
        outer: while(o.next()) {
            last=o.getUniqueValue();
            if (this._ms(o.getValue('end'))<=this._ms(o.getValue('begin'))) continue;
            var cis=this._cis(o);
            if (onlyCi) { var selected=[]; for(var c=0;c<cis.length;c++) if(cis[c]===String(onlyCi)) selected.push(cis[c]); cis=selected; }
            for(var i=0;i<cis.length;i++) {
                var a=this._affected(cis[i],o.getValue('begin'),o.getValue('end'));
                a.addQuery('u_degradation_calculated',false); a.orderBy('sys_id');
                a.setLimit(max+1); a.query();
                while(a.next()) {
                    var id=a.getUniqueValue();
                    if(seen[id]) continue;
                    if(count+errors>=max || new Date().getTime()-started>=seconds*1000) {
                        exhausted=false; break outer;
                    }
                    seen[id]=true; candidates++;
                    try {
                        var r=this.calculate(id,false);
                        if(r.status==='calculated') count++;
                    } catch(e) { errors++;gs.error(this.logPrefix+id+': '+e); }
                }
                if(new Date().getTime()-started>=seconds*1000) {exhausted=false;break outer;}
            }
        }
        // Resume on the same outage if a batch was interrupted; completed rows are excluded.
        if (!onlyCi) gs.setProperty(this.P+'degradation_cursor',exhausted ? '' : last);
        var summary={status:'completed',calculated:count,errors:errors,candidates:candidates,
            elapsed_ms:new Date().getTime()-started,resume:exhausted ? '' : last};
        gs.info(this.logPrefix+JSON.stringify(summary));return summary;
    },
    // Mode changes invalidate completed results even when calculation is disabled.
    // Pending rows are already eligible for the next scheduled run.
    invalidateCalculatedForModeChange: function(previousMode, requestedMode) {
        var started=new Date().getTime();
        var count=new GlideAggregate('service_availability');
        count.addQuery('u_degradation_calculated',true);
        count.addAggregate('COUNT');count.query();
        var affected=count.next() ? Number(count.getAggregate('COUNT')) : 0;
        if(affected>0) {
            var a=new GlideRecord('service_availability');
            a.addQuery('u_degradation_calculated',true);
            this.clearFields(a);
            a.setWorkflow(false);
            a.updateMultiple();
        }
        // Restart candidate selection so rows before a previous batch cursor are included.
        gs.setProperty(this.P+'degradation_cursor','');
        var summary={
            previous_mode:String(previousMode),
            requested_mode:String(requestedMode),
            effective_mode:gs.getProperty(this.P+'degradation_usecommitment','false'),
            invalidated:affected,
            elapsed_ms:new Date().getTime()-started
        };
        gs.info('[AOOP Degradation Configuration] '+JSON.stringify(summary));
        return summary;
    },
    type:'AOOP_ServiceAvailabilityDegradation'
};
