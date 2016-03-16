function TwitterService($http, AppSettings) {
    'ngInject';

    const service = {};

    service.get = function(params) {
        return new Promise((resolve, reject) => {
            var url = AppSettings.api2Url + 'play/';
            Object.keys(params).forEach((key) => {
                url += params[key] + '/';
            });
            console.log(url);
            $http.get(url).success((data) => {
                resolve(data.data);
            }).error((err, status) => {
                reject(err, status);
            });
        });
    };

    service.save = function(params) {
        return new Promise((resolve, reject) => {
            var url = AppSettings.api2Url + 'play/';
            
            $http.post(url, params).success((data) => {
                resolve(data.data);
            }).error((err, status) => {
                reject(err, status);
            });
        });
    };

    return service;

}

export default {
    name: 'TwitterService',
    fn: TwitterService
};