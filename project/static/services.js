angular.module('myApp').factory('AuthService',
  ['$q', '$timeout', '$http',
  function ($q, $timeout, $http) {

    // create user variable
    var user = {logged_in: false, name: ""};

    // return available functions for use in controllers
    return ({
      isLoggedIn: isLoggedIn,
      login: login,
      logout: logout,
      register: register,
      getUserStatus: getUserStatus,
      getUserName: getUserName
    });

    function isLoggedIn() {
      if(user.logged_in) {
        return true;
      } else {
        return false;
      }
    }


    function login(email, password) {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a post request to the server
      $http.post('/api/login', {email: email, password: password})
        // handle success
        .success(function (data, status) {
          if(status === 200 && data.result){
            user.logged_in = true;
            user.name = data.name;
            deferred.resolve();
          } else {
            user.logged_in = false;
            user.name = '';
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          user.logged_in = false;
          user.name = '';
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function logout() {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a get request to the server
      $http.get('/api/logout')
        // handle success
        .success(function (data) {
          user.logged_in = false;
          deferred.resolve();
        })
        // handle error
        .error(function (data) {
          user.logged_in = false;
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function register(name, email, password) {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a post request to the server
      $http.post('/api/register', {name: name, email: email, password: password})
        // handle success
        .success(function (data, status) {
          if(status === 200 && data.result){
            deferred.resolve();
          } else {
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function getUserStatus() {
      return $http.get('/api/status')
      // handle success
      .success(function (data) {
        if(data.logged_in){
          user.logged_in = true;
          user.name = data.name;
        } else {
          user.logged_in = false;
          user.name = '';
        }
      })
      // handle error
      .error(function (data) {
        user.logged_in = false;
        user.name = '';
      });
    }

    function getUserName() {
        return user.name;
    }

}]);
