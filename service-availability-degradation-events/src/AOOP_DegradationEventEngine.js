var AOOP_DegradationEventEngine = Class.create();
AOOP_DegradationEventEngine.prototype = {
    initialize: function() {
        this.P = 'aoop_service_availability_';
        this.EVENT = 'aoop.degradation.recalculate';
        this.cache = {};
        // Freeze the calculation mode for this engine execution. Property edits do not queue work.
        this.useCommitment = gs.getProperty(this.P+'degradation_usecommitment','false') === 'true';
    },
    enabled: function() { return gs.getProperty(this.P+'calculate_degradation','false') === 'true'; },
    _date: function(value) { return new GlideDateTime(String(value)); },    _ms: function(value) { return Number(this._date(value).getNumericValue()); },    _value: function(ms) { var d = new GlideDateTime(); d.setNumericValue(ms); return String(d.getValue()); },    _duration: function(ms) { var d = new GlideDuration(); d.setNumericValue(ms); return String(d.getValue()); },    _ids: function(a) {
        var result = [], seen = {};
        for (var i=0; i<a.length; i++) if (a[i] && !seen[String(a[i])]) {
            seen[String(a[i])] = true; result.push(String(a[i]));
        }
        return result;
    },    _cis: function(outage) {
        var ids = [outage.getValue('cmdb_ci')];
        var m = new GlideRecord('cmdb_outage_ci_mtom');
        m.addQuery('outage', outage.getUniqueValue()); m.query();
        while (m.next()) ids.push(m.getValue('ci_item'));
        return this._ids(ids);
    },    _affected: function(ci, begin, end) {
        var a = new GlideRecord('service_availability');
        a.addQuery('service_offering', ci).addOrCondition('cmdb_ci', ci);
        a.addQuery('start', '<', end); a.addQuery('end', '>', begin);
        return a;
    },    _outages: function(cis, begin, end) {
        var found = {}, rows = [], self = this;
        function collect(gr) {
            gr.addQuery('type', 'IN', 'degradation,planned');
            gr.addNotNullQuery('begin'); gr.addNotNullQuery('end');
            if(begin && end) { gr.addQuery('begin','<',end); gr.addQuery('end','>',begin); }
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
    },    _union: function(spans) {
        spans.sort(function(a,b){ return a.begin-b.begin || a.end-b.end; });
        var result = [];
        for (var i=0; i<spans.length; i++) {
            var s = spans[i], last = result.length ? result[result.length-1] : null;
            if (last && s.begin <= last.end) last.end = Math.max(last.end,s.end);
            else result.push({begin:s.begin,end:s.end});
        }
        return result;
    },    intervals: function(rows, begin, end) {
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
    _queue: function(kind, data) {
        if(!this.enabled()) return;
        var anchor=new GlideRecord('sys_properties');
        if(!anchor.get('name',this.P+'calculate_degradation')) throw 'Enable property missing';
        gs.eventQueue(this.EVENT,anchor,kind,JSON.stringify(data));
    },
    outageRelevant: function(c,p) {
        var t=c.getValue('type'),old=p?p.getValue('type'):'';
        return (t==='degradation'||t==='planned'||old==='degradation'||old==='planned') &&
            (c.operation()!=='update'||c.begin.changes()||c.end.changes()||c.type.changes()||c.cmdb_ci.changes());
    },
    linkRelevant: function(c) { return c.operation()!=='update'||c.ci_item.changes()||c.outage.changes(); },
    availabilityRelevant: function(c) {
        return c.operation()==='insert'||c.start.changes()||c.end.changes()||c.service_offering.changes()||
            c.cmdb_ci.changes()||c.service_commitment.changes()||c.time_zone.changes();
    },
    captureOutage: function(current,previous) {
        if(!this.enabled() || current.isActionAborted()) return;
        var states=[current], grouped={};
        if(previous && current.operation()==='update') states.push(previous);
        for(var i=0;i<states.length;i++) {
            var o=states[i],t=o.getValue('type'),b=o.getValue('begin'),e=o.getValue('end');
            if((t!=='degradation' && t!=='planned') || !b || !e || this._ms(e)<=this._ms(b)) continue;
            var cis=this._cis(o);
            for(var j=0;j<cis.length;j++) {
                var ci=cis[j]; if(!grouped[ci]) grouped[ci]=[];
                grouped[ci].push({begin:b,end:e});
            }
        }
        for(var id in grouped) if(grouped.hasOwnProperty(id))
            this._queue('scope',{ci:id,windows:grouped[id],operation:current.operation(),source:String(current.getUniqueValue())});
    },
    captureLink: function(current,previous) {
        if(!this.enabled() || current.isActionAborted()) return;
        var states=[current],grouped={};
        if(previous && current.operation()==='update') states.push(previous);
        for(var i=0;i<states.length;i++) {
            var link=states[i],o=new GlideRecord('cmdb_ci_outage');
            if(!o.get(link.getValue('outage'))) continue;
            var t=o.getValue('type'),b=o.getValue('begin'),e=o.getValue('end'),ci=link.getValue('ci_item');
            if(!ci || (t!=='degradation' && t!=='planned') || !b || !e || this._ms(e)<=this._ms(b)) continue;
            if(!grouped[ci]) grouped[ci]=[];
            grouped[ci].push({begin:b,end:e});
        }
        for(var id in grouped) if(grouped.hasOwnProperty(id)) this._queue('scope',{ci:id,windows:grouped[id],operation:current.operation()});
    },
    captureAvailability: function(current) {
        if(!this.enabled() || current.isActionAborted()) return;
        // This BR runs before insert/update. Clear only our results in this transaction.
        current.setValue('u_total_degradation','');
        current.setValue('u_absolute_degradation','');
        current.setValue('u_absolute_degradation_count','');
        this._queue('availability',{id:String(current.getUniqueValue())});
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
    calculate: function(id,preview) {
        if(!this.enabled()) return {status:'disabled'};
        for(var attempt=0;attempt<3;attempt++) {
            var a=new GlideRecord('service_availability');
            if(!a.get(String(id))) return {status:'missing'};
            var cis=this._ids([a.getValue('service_offering'),a.getValue('cmdb_ci')]);
            if(!cis.length || !a.getValue('service_commitment') || !a.getValue('start') || !a.getValue('end')) return {status:'ineligible'};
            var begin=this._ms(a.getValue('start')),end=this._ms(a.getValue('end'));
            if(!isFinite(begin)||!isFinite(end)||end<=begin) return {status:'ineligible'};
            var schedule=this.useCommitment ? this._schedule(a,cis) : null;
            var r=this.measure(this._outages(cis,a.getValue('start'),a.getValue('end')),begin,end,schedule);
            var duration=this._duration(r.duration),percent=r.percent===null?'':r.percent.toFixed(2),count=String(r.count);
            r.id=String(id); r.mode=this.useCommitment?'commitment':'absolute';
            if(preview) {r.status='preview';return r;}
            if(((percent==='' && a.u_absolute_degradation.nil()) || (percent!=='' && !a.u_absolute_degradation.nil() &&
                Number(a.getValue('u_absolute_degradation'))===Number(percent))) &&
                a.getValue('u_total_degradation')===duration && a.getValue('u_absolute_degradation_count')===count) {
                r.status='unchanged'; return r;
            }
            var mod=Number(a.getValue('sys_mod_count'));
            var w=new GlideRecord('service_availability');
            w.addQuery('sys_id',String(id)); w.addQuery('sys_mod_count',mod);
            w.setValue('u_total_degradation',duration);
            w.setValue('u_absolute_degradation',percent);
            w.setValue('u_absolute_degradation_count',count);
            // Explicit atomic version increment because setWorkflow(false) bypasses BRs.
            w.setValue('sys_mod_count',mod+1);w.setValue('sys_updated_on',gs.nowDateTime());w.setValue('sys_updated_by',gs.getUserName());
            w.setWorkflow(false);w.autoSysFields(false);w.updateMultiple();
            var v=new GlideRecord('service_availability');
            if(v.get(String(id)) && Number(v.getValue('sys_mod_count'))===mod+1 &&
                v.getValue('u_total_degradation')===duration && ((percent==='' && v.u_absolute_degradation.nil()) ||
                (percent!=='' && !v.u_absolute_degradation.nil() && Number(v.getValue('u_absolute_degradation'))===Number(percent))) &&
                v.getValue('u_absolute_degradation_count')===count) {r.status='calculated';return r;}
            this.cache={};
        }
        throw 'Concurrent changes prevented write for '+id;
    },
    _process: function(ids,context) {
        var unique=this._ids(ids),r={context:context,mode:this.useCommitment?'commitment':'absolute',selected:unique.length,calculated:0,unchanged:0,skipped:0,errors:0};
        for(var i=0;i<unique.length;i++) {
            if(!this.enabled()){r.disabled=true;break;}
            try {var v=this.calculate(unique[i],false);if(v.status==='calculated')r.calculated++;else if(v.status==='unchanged')r.unchanged++;else r.skipped++;}
            catch(e){r.errors++;gs.error('[AOOP Degradation V2] '+unique[i]+': '+e);}
        }
        gs.info('[AOOP Degradation V2] '+JSON.stringify(r));return r;
    },
    handleEvent: function(kind,payload) {
        if(!this.enabled()) return {status:'disabled'};
        var p=JSON.parse(String(payload)),ids=[];
        if(kind==='availability') ids=[p.id];
        else if(kind==='scope') {
            if(!/^[0-9a-f]{32}$/.test(p.ci) || !p.windows || p.windows.length>4) throw 'Invalid scope event';
            for(var i=0;i<p.windows.length;i++) {
                var q=p.windows[i];if(!q.begin||!q.end||this._ms(q.end)<=this._ms(q.begin))continue;
                var a=this._affected(p.ci,q.begin,q.end);a.query();while(a.next()) ids.push(a.getUniqueValue());
            }
        } else throw 'Unknown event kind '+kind;
        return this._process(ids,'event:'+kind);
    },
    syncAll: function(commitmentId,ciId) {
        if(!this.enabled())return {status:'disabled'};
        var a=new GlideRecord('service_availability');
        a.addNotNullQuery('service_commitment');
        if(commitmentId)a.addQuery('service_commitment',String(commitmentId));
        if(ciId)a.addQuery('service_offering',String(ciId)).addOrCondition('cmdb_ci',String(ciId));
        a.orderBy('sys_id');a.query();var ids=[];while(a.next())ids.push(a.getUniqueValue());
        return this._process(ids,'sync');
    },
    afterNativeRecalculation: function(source) {
        if(!this.enabled())return {status:'disabled'};
        return this.syncAll(source && source.getTableName()==='service_commitment'?source.getUniqueValue():null,null);
    },
    type:'AOOP_DegradationEventEngine'
};

