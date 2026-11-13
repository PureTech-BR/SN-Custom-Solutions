(function executeRule(current,previous){if(!(current.operation() == 'insert' || current.ci_item.changes() || current.outage.changes())) return; new AOOP_ServiceAvailabilityDegradation().captureLink(current,previous);})(current,previous);

