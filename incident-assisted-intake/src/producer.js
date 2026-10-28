try {
    new global.LabIncidentIntakeService().apply(producer, current);
} catch (intakeError) {
    gs.addErrorMessage(String(intakeError.message || intakeError));
    current.setAbortAction(true);
    gs.warn('Reportar Incidente: abertura não realizada por falha de validação. ' + String(intakeError.message || intakeError), 'LabIncidentIntake');
}
