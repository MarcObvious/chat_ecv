function SettingsModalCtrl() {
    'ngInject';

    // ViewModel
    const vm = this;

    var init = function() {
       vm.title = 'Settings';
    };

    init();
}

export default {
    name: 'SettingsModalCtrl',
    fn: SettingsModalCtrl
};
