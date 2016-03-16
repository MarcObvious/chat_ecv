function TwitterTimeline(TwitterService) {
    'ngInject';

    return {
        restrict: 'EA',
        templateUrl: 'directives/twitter.html',
        scope: {
            title: '@',
            message: '@twitterTimeline',
            country: '=',
            trends: '=',
            topic:'='
        },
        link: (scope, element, attrs) => {

            var init = function() {
                TwitterService.get({country: scope.country}).then(function(result){
                    console.log('You are in: ' + scope.country);
                    console.log(result);
                    scope.trends = result;
                });
                
                console.log(scope.trends);
            };

            
            scope.saveTopic = function(topic) {
                console.log(scope.topic);
                console.log(topic);
                scope.topic = topic;

                //scope.$apply();
            };

            scope.$watch('country', function (change) {
                TwitterService.get({country: scope.country}).then(function(result){
                    console.log('You are in: ' + scope.country);
                    scope.trends = result;
                    scope.$apply();
                });
            });

            init();
        }
    };
}

export default {
    name: 'twitterTimeline',
    fn: TwitterTimeline
};
