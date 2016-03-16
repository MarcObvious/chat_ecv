function SettingsModalCtrl($log) {
    'ngInject';

    // ViewModel
    const vm = this;

    var init = function() {
       vm.title = 'Settings';
    };

    init();
   // console.log(match);

}

export default {
    name: 'SettingsModalCtrl',
    fn: SettingsModalCtrl
};
