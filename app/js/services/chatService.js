function ChatService($http) {
    'ngInject';

    const service = {};

    service.get = function() {
        return new Promise((resolve, reject) => {
            $http.get('apiPath').success((data) => {
                resolve(data);
            }).error((err, status) => {
                reject(err, status);
            });
        });
    };

    service.send = function() {

    };

    return service;

}

export default {
    name: 'ChatService',
    fn: ChatService
};
