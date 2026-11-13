(function executeRule(current,previous){if(!(current.operation() == 'insert' || current.start.changes() || current.end.changes() || current.service_offering.changes() || current.cmdb_ci.changes() || current.service_commitment.changes() || current.time_zone.changes())) return; new AOOP_ServiceAvailabilityDegradation().clearFields(current);})(current,previous);

