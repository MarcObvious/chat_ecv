function HomeCtrl($log, ChatService, $scope) {
    'ngInject';

    // ViewModel
    const vm = this;

    var init = function () {
        vm.title = 'ECV - Chat';
        vm.data = {};
        vm.data.name = '';

        vm.config = {};
        vm.config.connected = false;
        vm.config.ip = '84.89.136.194:9000';
        vm.config.room = 'CHAT';

        vm.data.textToSend = '';
        vm.data.text = '';
        vm.data.events = '';
        vm.data.sendTo = 'ALL';

        ChatService.new();

        vm.connect();

    };

    vm.connect = function () {
        vm.disconnect();
        if(vm.config.room !== '' && vm.config.ip !== '') {
            ChatService.connect( vm.config.ip, vm.config.room,
                function(){
                    $log.debug('Connect..');
                },
                function (id, message) {
                    $log.debug('Message rebut');
                    $log.debug(id + ': ' + message);
                    vm.data.text= id + ': ' + message + '\n';
                    $scope.$apply();
                },
                function() {
                    $log.debug('Close');
                },
                function(event, data) {
                    if (event === 'LOGIN') {
                        vm.data.name = ChatService.user_name;
                    }
                    vm.data.events += event + ': ' + data +'\n';
                    $scope.$apply();
                }
            );
        }
        else {
            $log.debug("No Room!");
        }
    };
    vm.disconnect = function () {
        if(vm.config.connected) {
            ChatService.close();
            vm.config.connected = false;
        }
    };


    vm.dummy = function () {
        $log.debug(ChatService.user_name);
        vm.data.name = ChatService.user_name;
        vm.config.connected = true;
    };

    vm.saveLogin = function () {
        $log.debug(vm);
        $log.debug("SaveLogin: " + vm.data.name);
        $log.debug(ChatService.onServerEvent('','ID'));
    };

    vm.sendText = function () {
        $log.debug("sendText: " + vm.data.textToSend);
        vm.data.text += vm.data.name + ': ' + vm.data.textToSend + '\n';
        if(vm.data.sendTo !== 'ALL' && vm.data.sendTo !== '') {
            ChatService.sendMessage(vm.data.textToSend, [vm.data.sendTo]);
        }
        else {
            ChatService.sendMessage(vm.data.textToSend);
        }

        vm.data.textToSend = '';
        $log.debug(vm.data.text);
    };

    vm.reload = function () {
        $log.debug("reload: " + vm.data.text);
        vm.data.text = '';
    };

    init();

}

export default {
    name: 'HomeCtrl',
    fn: HomeCtrl
};
