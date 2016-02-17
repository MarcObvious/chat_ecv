function HomeCtrl($log, ChatService, $scope) {
    'ngInject';

    // ViewModel
    const vm = this;

    var init = function () {
        vm.title = 'ECV - Chat';

        vm.config = {};
        vm.config.connected = false;
        vm.config.ip = '84.89.136.194:9000';
        vm.config.room = 'CHAT';

        vm.data = {};
        vm.data.name = '';
        vm.data.textToSend = '';
        vm.data.text = '';
        vm.data.events = '';
        vm.data.sendTo = 'ALL';

        vm.scene = {};
        vm.scene.sat = {};
        vm.scene.canvasWidth = 400;
        vm.scene.canvasHeight = 400;
        ChatService.new();
        vm.satelit = {
            geometry: (Math.random()*(2-0.2)+0.8),
            color: getRandomColor(),
            castShadow : true,
            name : vm.data.name,
            position: {
                x : (Math.random()*(50-30)+30) ,
                y : 0,
                z : 0
            },
            speed : Math.round((Math.random()*(100-0.01)+0.05))/100
        };
        vm.satelit.distX = vm.satelit.position.x;
        vm.satelit.distY = vm.satelit.position.y;
        vm.satelit.distZ = vm.satelit.position.z;

        vm.connect();
    };

    function getRandomColor(){
        var color = "black";
        var c = Math.random()*6;
        if (c > 5) color = "red";
        if (c <= 5 && c > 4) color = "blue";
        if (c <= 4 && c > 3) color = "green";
        if (c <= 3 && c > 2) color = "yellow";
        if (c <= 2 && c > 1) color = "white";
        if (c <= 1) color = "purple";
        return color;
    }

    vm.addSat = function (sat) {
        vm.scene.sat = sat;
    };

    vm.removeSat = function (id) {
        console.log('Removing sat: ' + id);
        if (typeof id !== 'undefined') {
            delete  vm.scene.sat[id];
        }
    };

    vm.connect = function () {
        vm.disconnect();
        if(vm.config.room !== '' && vm.config.ip !== '') {
            ChatService.connect( vm.config.ip, vm.config.room,
                function(){
                    $log.debug('Connect..');
                },
                function (id, message) {
                    var aux = JSON.parse(message);
                    $log.debug('Message rebut');
                    $log.debug(id + ': ' + aux.msg);
                    vm.data.text += id + ': ' + aux.msg + '\n';
                    vm.addSat(aux.sat);
                    $scope.$apply();
                },
                function() {
                    $log.debug('Close');
                },
                function(event, data) {
                    if (event === 'LOGIN') {
                        vm.data.name = ChatService.user_name;
                        vm.satelit.name = ChatService.user_name;
                        //vm.addSat(data);
                    }
                    if (event === 'LOGOUT') {
                        vm.removeSat(data);
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

    vm.saveLogin = function () {
        $log.debug(vm);
        $log.debug("SaveLogin: " + vm.data.name);
        $log.debug(ChatService.onServerEvent('','ID'));
    };

    vm.sendText = function () {
        $log.debug("sendText: " + vm.data.textToSend);
        vm.data.text += vm.data.name + ': ' + vm.data.textToSend + '\n';
        if(vm.data.sendTo !== 'ALL' && vm.data.sendTo !== '') {
            ChatService.sendMessage({msg: vm.data.textToSend, sat: vm.satelit}, [vm.data.sendTo]);
        }
        else {
            ChatService.sendMessage({msg: vm.data.textToSend, sat: vm.satelit});
        }
        vm.data.textToSend = '';
        $log.debug(vm.data.text);
        vm.addSat(vm.satelit);
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
