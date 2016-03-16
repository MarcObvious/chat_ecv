function HomeCtrl($log, ChatService, TwitterService, $modal, $scope) {
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
        vm.data.textToPost = '';
        vm.data.text = '';
        vm.data.events = '';
        vm.data.sendTo = 'ALL';

        vm.status = {};
        vm.status = {
            chat: true,
            trends: true,
        };

        vm.scene = {};
        vm.scene.sat = {};

        ChatService.new();

        vm.twitter = {
            country: 'WorldWide',
            topicc: '#something',
            trends: []
        };
        console.log(vm.twitter);

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
                    console.log(message);
                    var aux = JSON.parse(message);
                    $log.debug('Message rebut');
                    $log.debug(id + ': ' + aux.msg);
                    var tmp = vm.data.text;
                    vm.data.text = id  + aux.msg + '\n' + tmp;
                    // vm.addSat(aux.sat);
                    $scope.$apply();
                },
                function() {
                    $log.debug('Close');
                },
                function(event, data) {
                    if (event === 'LOGIN') {
                        vm.data.name = ChatService.user_name;
                    }
                    if (event === 'LOGOUT') {
                        console.log('LOGOUT!');
                        // vm.removeSat(data);
                    }
                    var tmp = vm.data.text;
                    vm.data.text = event + ': ' + data +'\n' + tmp;
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
        var tmp = vm.data.text;
        vm.data.text = vm.data.name +  ', at ' + vm.twitter.country + ' says: '  + vm.data.textToSend + '\n' + tmp;
        if(vm.data.sendTo !== 'ALL' && vm.data.sendTo !== '') {
            ChatService.sendMessage({msg: ', at ' + vm.twitter.country + ' says: '+vm.data.textToSend}, [vm.data.sendTo]);
        }
        else {
            ChatService.sendMessage({msg: ', at ' + vm.twitter.country + ' says: '+ vm.data.textToSend});
        }
        vm.data.textToSend = '';
    };

    vm.postText = function () {
        $log.debug("postText: " + vm.data.textToPost);
        if (vm.data.name){
            TwitterService.save({id: vm.twitter.country, topic: vm.twitter.topicc,  text: vm.data.textToPost, user_name: vm.data.name}).then(function(result){
                console.log(result);
                vm.twitter.trends[0] = result;
            });
            var tmp = vm.data.text;
            vm.data.text = 'EVENT: ' + vm.data.name +' has posted a tweet' + '\n' + tmp;

            ChatService.sendMessage({msg: 'EVENT: user ' + vm.data.name +' is in '+ vm.twitter.country});
        }
        vm.data.textToPost = '';
    };

    $scope.$watch('home.twitter.country', function (change) {
        if (vm.data.name){
            var tmp = vm.data.text;
            vm.data.text = 'EVENT: ' + vm.data.name +' is in '+ vm.twitter.country + '\n' + tmp;
            ChatService.sendMessage({msg: 'EVENT: user ' + vm.data.name +' is in '+ vm.twitter.country});
        }
    });

    $scope.$watch('home.twitter.topicc', function (change) {
        vm.data.textToPost = vm.twitter.topicc;
    });

    vm.reload = function () {
        $log.debug("reload: " + vm.data.text);
        vm.data.text = '';
    };

    vm.openSettigns = function () {
        $scope.modalInstance = $modal.open({
            templateUrl: 'modals/settings.modal.html',
            controller: 'SettingsModalCtrl as settings',
            resolve: {
            },
            size: 'md',
            scope: $scope
        });
    };

    vm.openInfo = function () {
        $scope.modalInstance = $modal.open({
            template: '<div>' +
            '<div class="modal-header"> ' +
                '<h3 class="modal-title upper">Authors: </h3>' +
            '</div>' +
            '<div class="modal-body row-fluid clearfix"> ' +
            '   <ul> <li><h4>Marc Mateu, Nia 146756</h4></li> ' +
            '   <li><h4>Ignasi Larroca</h4></li> </ul>' +
            '</div></div>',
            size: 'sm'
        });
    };





    init();
}

export default {
    name: 'HomeCtrl',
    fn: HomeCtrl
};
