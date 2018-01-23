var myApp = angular.module('myApp', ['ngRoute', 'ngFileUpload', 'textAngular', 'ngAnimate']);

myApp.filter('rawHtml', ['$sce', function($sce){
    return function(val) {
        return $sce.trustAsHtml(val);
    };
}]);

myApp.directive('ngConfirmClick', [
    function(){
        return {
            link: function (scope, element, attr) {
                var msg = attr.ngConfirmClick || "Are you sure?";
                var clickAction = attr.confirmedClick;
                element.bind('click',function (event) {
                    if ( window.confirm(msg) ) {
                        scope.$eval(clickAction)
                    }
                });
            }
        };
    }])

myApp.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'static/partials/home.html',
            controller: 'homeController',
            access: {restricted: false}
        })
        .when('/author', {
            templateUrl: 'static/partials/author.html',
            controller: 'authorController',
            access: {restricted: true, type: 'author'}
        })
        .when('/author/script/:id?', {
            templateUrl: 'static/partials/author/script.html',
            controller: 'authorController',
            access: {restricted: true, type: 'author'}
        })
        .when('/login/:status?', {
            templateUrl: 'static/partials/login.html',
            controller: 'loginController',
            access: {restricted: false}
        })
        .when('/passwordreset', {
            templateUrl: 'static/partials/passwordlost.html',
            controller: 'lostController',
            access: {restricted: false}
        })
        .when('/passwordreset/:email/:key', {
            templateUrl: 'static/partials/passwordreset.html',
            controller: 'resetController',
            access: {restricted: false}
        })
        .when('/logout', {
            controller: 'logoutController',
            access: {restricted: true, type: 'all'}
        })
        .when('/register', {
            templateUrl: 'static/partials/register.html',
            controller: 'registerController',
            access: {restricted: false}
        })
        .when('/admin', {
            templateUrl: 'static/partials/admin.html',
            controller: 'adminController',
            access: {restricted: true, type: 'admin'}
        })
        .when('/admin/:section/:id?', {
            templateUrl: function(urlattr){
                return 'static/partials/admin/' + urlattr.section + '.html';
            },
            controller: 'adminController',
            access: {restricted: true, type: 'admin'}
        })
        .when('/error/:errorcode', {
            templateUrl: function(urlattr){
                return 'static/partials/error/' + urlattr.errorcode + '.html';
            },
            access: {restricted: false}
        })
        .when('/rate', {
            templateUrl: 'static/partials/rate.html',
            controller: 'ratingController',
            access: {restricted: true, type: 'user'}
        })
        .when('/producer', {
            templateUrl: 'static/partials/producer.html',
            controller: 'producerController',
            access: {restricted: true, type: 'producer'}
        })
        .when('/producer/script', {
            templateUrl: 'static/partials/script.html',
            controller: 'scriptController',
            access: {restricted: true, type: 'producer'}
        })
        .when('/account', {
            templateUrl: 'static/partials/account.html',
            controller: 'accountController',
            access: {restricted: true, type: 'all'}
        })
        .otherwise({
            redirectTo: '/'
        });
});

myApp.run(function ($rootScope, $location, $route, AuthService, $window, $timeout) {

    $rootScope.isActive = function(viewLocation) {
        return viewLocation === $location.path();
    };


    $rootScope.error = false;
    $rootScope.errorMessage = "";

    $rootScope.$on('error', function(event, message) {
        $rootScope.info = false;

        $rootScope.error = true;
        $rootScope.errorMessage = message;

        $window.scrollTo(0,0);
        $timeout(function() { $rootScope.$emit('clear'); }, 10000);
    });

    $rootScope.info = false;
    $rootScope.infoMessage = "";

    $rootScope.$on('info', function(event, message) {
        $rootScope.error = false;

        $rootScope.info = true;
        $rootScope.infoMessage = message;

        $window.scrollTo(0,0);
        $timeout(function() { $rootScope.$emit('clear'); }, 10000);
    });

    $rootScope.$on('clear', function() {
        $rootScope.info = false;
        $rootScope.error = false;
        $timeout(1000)
            .then(function() {
                $rootScope.infoMessage = "";
                $rootScope.errorMessage = "";
            });
    });

    $rootScope.ratingStatus = [
        { 'id' : 'none', 'description' : 'Not Rated'}, 
        { 'id' : 'partial', 'description' : 'Partial Rating'},
        { 'id' : 'full', 'description' : 'Fully Rated'}
    ];

    $rootScope.answersType1 = [
        { 'id': 4, 'answer':'Excellent' },
        { 'id': 3, 'answer':'Good' },
        { 'id': 2, 'answer':'Satisfactory' },
        { 'id': 1, 'answer':'Needs Work' },
        /*{ 'id': 0, 'answer':'N/A' },*/
        { 'id': null, 'answer':'Not Rated' }
    ];

    $rootScope.answersType2 = [
        { 'id': 3, 'answer':'Definitely' },
        { 'id': 2, 'answer':'Probably' },
        { 'id': 1, 'answer':'Maybe' },
        { 'id': 0, 'answer':'No' },
        { 'id': null, 'answer':'Not Yet Rated' }
    ];

    $rootScope.$on('$routeChangeStart',
        function (event, next, current) {
            AuthService.getUserStatus()
                .then(function(){

                    $rootScope.user = {admin: AuthService.isAdmin(), loggedin: AuthService.isLoggedIn(), user: AuthService.isUser(), producer: AuthService.isProducer(), author: AuthService.isAuthor(), name: AuthService.getUserName(), email: AuthService.getUserEmail()};

                    $rootScope.year = AuthService.getYear();




                    $rootScope.username = AuthService.getUserName();

                    if (next.access && next.access.restricted && AuthService.isAuthor() && next.access.type != 'author' && next.access.type != 'all')
                    {
                        $location.path('/author');
                        $route.reload();
                    }
                    else if (AuthService.isLoggedIn() && next.controller && next.controller == 'loginController')
                    {
                        $location.path('/author');
                        $route.reload();
                    }
                    else if (next.access && next.access.restricted && !AuthService.isLoggedIn()){
                        $location.path('/login');
                        $route.reload();
                    }
                    else if (AuthService.isAdmin() && $location.path() == '/author')
                    {
                        $location.path('/admin');
                        $route.reload();
                    }
                    else if (AuthService.isProducer() && $location.path() == '/author')
                    {
                        $location.path('/producer');
                        $route.reload();
                    }
                    else if (AuthService.isUser() && $location.path() == '/author')
                    {
                        $location.path('/rate');
                        $route.reload();
                    }

                });
        });
});
