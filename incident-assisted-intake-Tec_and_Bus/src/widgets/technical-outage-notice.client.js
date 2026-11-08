function ($scope) {
    var c = this;
    $scope.$watch(function () {
        return $scope.page && $scope.page.g_form ? $scope.page.g_form.getValue('outage_status_data') : '';
    }, function (value) {
        try { c.notice = value ? JSON.parse(value) : null; }
        catch (e) { c.notice = null; }
    });
}
