function HomeCtrl($log) {
    'ngInject';

    // ViewModel
    const vm = this;

    var init = function () {
        vm.title = 'ECV - Chat';
        vm.data = {};
        vm.data.name = '';
        vm.data.textToSend = '';
        vm.data.text = '';
    };

    init();

    vm.saveLogin = function () {
        $log.debug(vm);
        $log.debug("SaveLogin: " + vm.data.name);
    };

    vm.sendText = function () {
        $log.debug("sendText: " + vm.data.textToSend);
        vm.data.text += vm.data.name + ': ' + vm.data.textToSend + '\n';
        vm.data.textToSend = '';
        $log.debug(vm.data.text);
    };

    vm.reload = function () {
        $log.debug("reload: " + vm.data.text);
        vm.data.text = '';
    };

}

export default {
    name: 'HomeCtrl',
    fn: HomeCtrl
};
